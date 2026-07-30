#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 root 用户运行此脚本。"
  exit 1
fi

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="/etc/xueersi-word-diagnostic.env"
SERVICE_FILE="/etc/systemd/system/xueersi-word-diagnostic.service"
NGINX_FILE="/etc/nginx/sites-available/xueersi-word-diagnostic"

echo "[1/7] 安装 Node.js、Nginx 与构建工具"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm nginx curl openssl build-essential python3

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "当前 Node.js 版本为 $(node -v)，需要 Node.js 22 或更高版本。"
  echo "请先升级 Node.js 后重新运行本脚本。"
  exit 1
fi

echo "[2/7] 安装项目依赖"
cd "$APP_DIR"
npm config set registry https://registry.npmmirror.com
npm ci

echo "[3/7] 构建网站"
npm run build
mkdir -p "$APP_DIR/data"

if [ ! -f "$ENV_FILE" ]; then
  while true; do
    read -r -s -p "请输入新的老师后台密码（12-64位，仅限字母、数字、下划线或短横线）: " ADMIN_PASSWORD
    echo
    if [[ "$ADMIN_PASSWORD" =~ ^[A-Za-z0-9_-]{12,64}$ ]]; then
      break
    fi
    echo "密码格式不符合要求，请重新输入。"
  done
  umask 077
  printf 'ADMIN_PASSWORD=%s\nDATABASE_PATH=%s/data/diagnostics.db\nPRONUNCIATION_CACHE_DIR=/opt/xueersi-audio-cache\nCOOKIE_SECURE=false\n' "$ADMIN_PASSWORD" "$APP_DIR" > "$ENV_FILE"
  unset ADMIN_PASSWORD
fi

if ! grep -q '^PRONUNCIATION_CACHE_DIR=' "$ENV_FILE"; then
  printf '\nPRONUNCIATION_CACHE_DIR=/opt/xueersi-audio-cache\n' >> "$ENV_FILE"
fi
mkdir -p /opt/xueersi-audio-cache

echo "[4/7] 配置网站服务"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Xueersi Word Diagnostic
After=network.target

[Service]
Type=simple
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/npm start -- --hostname 127.0.0.1 --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat > "$NGINX_FILE" <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sfn "$NGINX_FILE" /etc/nginx/sites-enabled/xueersi-word-diagnostic
rm -f /etc/nginx/sites-enabled/default
nginx -t

echo "[5/7] 启动服务"
systemctl daemon-reload
systemctl enable --now xueersi-word-diagnostic
systemctl enable --now nginx
systemctl restart xueersi-word-diagnostic nginx

echo "[6/7] 下载并核验本地发音库"
PRONUNCIATION_BASE_URL=http://127.0.0.1:3000 PRONUNCIATION_PREWARM_CONCURRENCY=8 npm run audio:prewarm

echo "[7/7] 检查网站"
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1/ >/dev/null; then
    echo "部署成功：http://47.93.51.131"
    echo "老师后台：http://47.93.51.131/?admin=1"
    exit 0
  fi
  sleep 2
done

echo "服务尚未正常响应，请运行以下命令查看日志："
echo "journalctl -u xueersi-word-diagnostic -n 50 --no-pager"
exit 1
