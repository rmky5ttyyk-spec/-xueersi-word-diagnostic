const COOKIE_NAME = "xrs_admin_session";
async function configuredPassword(){return String(process.env.ADMIN_PASSWORD||"")}
async function digest(value:string){const bytes=new TextEncoder().encode(`xrs-word-diagnostic:${value}`);const hash=await crypto.subtle.digest("SHA-256",bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("")}
export async function expectedSession(){const password=await configuredPassword();if(!password)throw new Error("后台密码尚未配置");return digest(password)}
export async function passwordMatches(candidate:string){const password=await configuredPassword();if(!password||!candidate)return false;return (await digest(candidate))===(await digest(password))}
export async function isAdmin(request:Request){const cookie=request.headers.get("cookie")||"";const value=cookie.split(";").map(x=>x.trim()).find(x=>x.startsWith(`${COOKIE_NAME}=`))?.split("=")[1];return Boolean(value&&value===await expectedSession())}
export function sessionCookie(value:string){const secure=process.env.COOKIE_SECURE==="true"?"; Secure":"";return `${COOKIE_NAME}=${value}; HttpOnly${secure}; SameSite=Strict; Max-Age=28800; Path=/`}
