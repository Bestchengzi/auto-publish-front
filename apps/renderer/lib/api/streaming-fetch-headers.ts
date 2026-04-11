/**
 * 浏览器经 Nginx 等反代消费流式响应时，在请求侧补充提示（避免中间层把响应当作可强缓存对象）。
 * 真正「边收边吐」仍依赖 Nginx `proxy_buffering off`、必要时上游响应头 `X-Accel-Buffering: no`，
 * 见 `deploy/nginx-base-api.stream.example.conf`。
 */
export function applyStreamingProxyClientHints(headers: Headers): void {
  if (!headers.has("Cache-Control")) {
    headers.set("Cache-Control", "no-cache");
  }
}
