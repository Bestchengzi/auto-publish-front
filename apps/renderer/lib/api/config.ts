/**
 * API 配置
 *
 * - 通用后端：使用同源前缀 `/media`（见 `getApiBaseUrl`），由 Next `rewrites` 转发到实际服务，不依赖环境变量。
 * - LangGraph：生产环境走同源 `/media` 代理（`/media` + {@link LANGGRAPH_API_PREFIX}）。开发环境若设置
 *   `NEXT_PUBLIC_LANGGRAPH_BASE_URL`（服务根，可不含路径后缀），会在其后拼接 {@link LANGGRAPH_API_PREFIX} 再直连。
 *
 * 当 `API_BASE_URL` 为空字符串时，`apiUrl` 会回退为当前页面的 `origin`。
 *
 * 生产环境经 Nginx 反代流式输出时：务必对 `/media/` 关闭 `proxy_buffering`、拉长读超时，示例见
 * `deploy/nginx-base-api.stream.example.conf`；若上游仍被缓冲，可在 LangGraph/后端对流式响应加
 * `X-Accel-Buffering: no`。前端对 LangGraph 与 `streamRequest` 会附带 `Cache-Control: no-cache`（见
 * `applyStreamingProxyClientHints`），仅作辅助，不能替代 Nginx 配置。
 */
function getApiBaseUrl(): string {
  if (typeof process === "undefined") return "";
  const target = '/media';
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

/** LangGraph API 根路径（相对站点根），经 `/media` 转发到后端（生产或与 dev 环境变量联用时）。 */
export const LANGGRAPH_API_PREFIX = "/api/langgraph";

function getLangGraphBaseUrlFromDevEnv(): string | null {
  if (typeof process === "undefined") return null;
  if (process.env.NODE_ENV !== "development") return null;
  const raw = process.env.NEXT_PUBLIC_LANGGRAPH_BASE_URL?.trim();
  if (!raw) return null;
  const base = raw.replace(/\/$/, "");
  const suffix = LANGGRAPH_API_PREFIX.startsWith("/")
    ? LANGGRAPH_API_PREFIX
    : `/${LANGGRAPH_API_PREFIX}`;
  if (base.endsWith(suffix)) {
    return base;
  }
  return `${base}${suffix}`.replace(/\/$/, "");
}

/**
 * LangGraph API 基础 URL（与 SDK `apiUrl` 一致）。
 *
 * - 开发：已设置 `NEXT_PUBLIC_LANGGRAPH_BASE_URL` 时为「服务根」，自动拼接 {@link LANGGRAPH_API_PREFIX}；若已以该后缀结尾则不再重复拼接。
 * - 生产：`window.location.origin` + {@link API_BASE_URL} + {@link LANGGRAPH_API_PREFIX}，经同源 `/media` 代理。
 * - 生产且无 `window` 时返回空字符串。
 */
export function getLangGraphBaseUrl(): string {
  const fromDev = getLangGraphBaseUrlFromDevEnv();
  if (fromDev) return fromDev;

  const basePath = API_BASE_URL.replace(/\/$/, "");
  if (!basePath) return "";
  const relative = `${basePath}${LANGGRAPH_API_PREFIX}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${relative}`.replace(/\/$/, "");
  }
  return "";
}
