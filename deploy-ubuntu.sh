#!/usr/bin/env bash
set -Eeuo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "请使用 root 用户运行：sudo bash deploy-ubuntu.sh"
  exit 1
fi

if [ ! -f /etc/os-release ]; then
  echo "无法识别服务器系统。"
  exit 1
fi

. /etc/os-release
if [ "${ID:-}" != "ubuntu" ]; then
  echo "当前系统不是 Ubuntu：${PRETTY_NAME:-unknown}"
  exit 1
fi

echo "[1/5] 安装 Docker、Git 与基础工具"
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io git curl ca-certificates
systemctl enable --now docker

echo "[2/5] 设置老师后台密码"
while true; do
  read -r -s -p "请输入新的老师后台密码（至少12位）: " ADMIN_PASSWORD
  echo
  if [ "${#ADMIN_PASSWORD}" -ge 12 ]; then
    break
  fi
  echo "密码长度不足12位，请重新输入。"
done

echo "[3/5] 构建网站镜像"
docker build -t xueersi-word-diagnostic:latest .

echo "[4/5] 启动网站与持久化数据库"
docker rm -f xueersi-word-diagnostic >/dev/null 2>&1 || true
docker volume create xueersi-diagnostic-data >/dev/null
docker run -d \
  --name xueersi-word-diagnostic \
  --restart unless-stopped \
  -p 80:3000 \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  -e DATABASE_PATH=/app/data/diagnostics.db \
  -e COOKIE_SECURE=false \
  -v xueersi-diagnostic-data:/app/data \
  xueersi-word-diagnostic:latest >/dev/null
unset ADMIN_PASSWORD

echo "[5/5] 检查网站状态"
for attempt in $(seq 1 20); do
  if curl --fail --silent --show-error http://127.0.0.1/ >/dev/null; then
    echo "部署成功：http://47.93.51.131"
    echo "如公网暂时打不开，请在阿里云安全组放行 TCP 80 端口。"
    exit 0
  fi
  sleep 2
done

echo "网站未能正常响应，最近日志如下："
docker logs --tail 80 xueersi-word-diagnostic
exit 1
