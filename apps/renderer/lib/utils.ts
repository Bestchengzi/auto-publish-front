import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const GEN_IMAGE_URL_PREFIX =
  process.env.NEXT_PUBLIC_GEN_IMAGE_PREFIX ?? "https://static.beeize.com";

export function getGenImageUrl(
  path: string | null | undefined,
  threadId?: string | null,
): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/api")) return `${GEN_IMAGE_URL_PREFIX}${path}`;
  if (path.startsWith("/mnt")) {
    if (!threadId) return "";
    return `${GEN_IMAGE_URL_PREFIX}/api/threads/${threadId}/artifacts${path}`;
  }
  return path;
}

