import https from "node:https";
import http from "node:http";

export type PageMeta = {
  title?: string;
  favicon?: string;
};

/** 主进程抓取页面 meta（title、favicon），避免 CORS */
export async function fetchPageMeta(urlStr: string): Promise<PageMeta> {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) return {};
    const get = parsed.protocol === "https:" ? https.get : http.get;
    const html = await new Promise<string>((resolve, reject) => {
      const req = get(
        urlStr,
        { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0 (compatible)" } },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400) {
            const loc = res.headers.location;
            if (typeof loc === "string") {
              fetchPageMeta(new URL(loc, urlStr).href)
                .then((m) => resolve(JSON.stringify(m)))
                .catch(reject);
              return;
            }
          }
          let data = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => resolve(data));
        }
      );
      req.on("error", reject);
      req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
    });
    if (typeof html === "string" && html.startsWith("{"))
      return JSON.parse(html) as PageMeta;
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = titleMatch?.[1]?.trim().replace(/[\s]+/g, " ") || undefined;
    const faviconMatch =
      html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
    let favicon = faviconMatch?.[1];
    if (favicon) {
      try {
        favicon = new URL(favicon, urlStr).href;
      } catch {
        favicon = undefined;
      }
    }
    if (!favicon) {
      try {
        favicon = new URL("/favicon.ico", urlStr).href;
      } catch {
        favicon = undefined;
      }
    }
    return { title, favicon };
  } catch {
    return {};
  }
}
