import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 生成图 URL 前缀：
 * - 生产：不拼固定域名，用相对路径（由浏览器按当前站点解析，等同跟站同源，且 SSR/CSR 一致）。
 * - 开发：使用 NEXT_PUBLIC_GEN_IMAGE_PREFIX（如静态站或独立图床）。
 */
function getGenImageUrlPrefix(): string {
  if (process.env.NODE_ENV === "production") {
    return "";
  }
  return (process.env.NEXT_PUBLIC_GEN_IMAGE_PREFIX ?? "").replace(/\/$/, "");
}

export function getGenImageUrl(
  path: string | null | undefined,
  threadId?: string | null,
): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = getGenImageUrlPrefix();
  if (path.startsWith("/api")) return `${base}${path}`;
  if (path.startsWith("/mnt")) {
    if (!threadId) return "";
    return `${base}/api/threads/${threadId}/artifacts${path}`;
  }
  return path;
}

