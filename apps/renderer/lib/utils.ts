import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFlieUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const prefix = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment ? `${prefix}${path}` : path;
}

