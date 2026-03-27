/**
 * API 配置
 *
 * - NEXT_PUBLIC_API_BASE_URL：通用后端根地址（开发与生产共用变量名，按环境填不同值）
 * - NEXT_PUBLIC_LANGGRAPH_BASE_URL：LangGraph 根地址（需在 .env 中配置完整路径，含 /api/langgraph 等）
 * 未设置 API_BASE_URL 时，apiUrl 等会回退为当前页面 origin。
 */
function getApiBaseUrl(): string {
  if (typeof process === "undefined") return "";
  const target = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (target) return target.replace(/\/$/, "");
  return "";
}

export const API_BASE_URL = getApiBaseUrl();

export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL
    ? API_BASE_URL
    : typeof window !== "undefined"
      ? window.location.origin
      : "";
  return `${base}${p}`;
}

/**
 * LangGraph API 基础 URL（与 SDK `apiUrl` 一致），仅读取 NEXT_PUBLIC_LANGGRAPH_BASE_URL。
 */
export function getLangGraphBaseUrl(): string {
  if (typeof process === "undefined") return "";
  const envUrl = process.env.NEXT_PUBLIC_LANGGRAPH_BASE_URL;
  return envUrl ? envUrl.replace(/\/$/, "") : "";
}
