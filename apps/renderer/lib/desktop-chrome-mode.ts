type DesktopChromeMode = "web" | "desktop" | "embedded";

export function getDesktopChromeMode(): DesktopChromeMode {
  if (typeof window === "undefined") return "web";
  if (window.__desktopEmbeddedView) return "embedded";
  if (typeof window.desktop !== "undefined") return "desktop";
  return "web";
}
