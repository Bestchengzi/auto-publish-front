/**
 * 桌面端 IPC 桥接检查与调用，避免重复的 typeof window.desktop?.xxx 判断。
 * 仅在 Electron 环境可用。
 */

export function isDesktop(): boolean {
  return typeof window !== "undefined" && typeof window.desktop !== "undefined";
}

export function getDesktop(): Window["desktop"] {
  if (typeof window === "undefined") return undefined;
  return window.desktop;
}
