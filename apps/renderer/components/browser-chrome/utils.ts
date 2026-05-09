const ROUTE_TO_TITLE_KEY: Record<string, string> = {
  account: "sidebar.items.account",
  "asset-library": "sidebar.items.assetLibrary",
  "works-library": "sidebar.items.worksLibrary",
  "creation-center": "sidebar.items.creationCenter",
  "topic-center": "sidebar.items.topicCenter",
  "auto-publish": "sidebar.items.autoPublish",
  "earn-points": "sidebar.items.earnPoints",
};

export function getTitleKeyFromPath(pathname: string): string {
  const seg = pathname.split("/").filter(Boolean)[1];
  return (seg && ROUTE_TO_TITLE_KEY[seg]) ?? "browserChrome.newTab";
}

export function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function getAppFaviconUrl(): string {
  if (typeof window === "undefined") return "/favicon.ico";
  const link =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]');
  if (link?.href) {
    try {
      return new URL(link.href, window.location.origin).href;
    } catch {
      return `${window.location.origin}/favicon.ico`;
    }
  }
  return `${window.location.origin}/favicon.ico`;
}

export function displayHostForExternalError(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.host || url;
  } catch {
    return url.replace(/^https?:\/\//i, "").split("/")[0] || url;
  }
}

/** 与 Chromium 错误页常见文案对齐，便于用户检索 */
export function chromiumStyleErrorCodeLabel(code: number): string {
  switch (code) {
    case -105:
      return "DNS_PROBE_FINISHED_NXDOMAIN";
    case -106:
      return "ERR_INTERNET_DISCONNECTED";
    case -102:
      return "ERR_CONNECTION_REFUSED";
    case -118:
      return "ERR_CONNECTION_TIMED_OUT";
    case -109:
      return "ERR_ADDRESS_UNREACHABLE";
    case -300:
      return "ERR_INVALID_URL";
    case -501:
      return "ERR_INSECURE_RESPONSE";
    case -2:
      return "ERR_FAILED";
    default:
      return `NET_ERROR_${Math.abs(code)}`;
  }
}

export function normalizeUrl(input: string): { url: string; isExternal: boolean } {
  const trimmed = input.trim();
  if (!trimmed) return { url: "", isExternal: false };
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { url: trimmed, isExternal: true };
  }
  if (
    trimmed.includes(".") &&
    !trimmed.startsWith("/") &&
    !trimmed.includes(" ")
  ) {
    return { url: `https://${trimmed}`, isExternal: true };
  }
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return { url: path, isExternal: false };
}

/** 新标签页地址栏：非网址输入走百度搜索；已打开的页签仍沿用 normalizeUrl */
export function resolveAddressBarInput(
  input: string,
  emptyNewTab: boolean,
): { url: string; isExternal: boolean } {
  if (!emptyNewTab) return normalizeUrl(input);
  const trimmed = input.trim();
  if (!trimmed) return { url: "", isExternal: false };
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { url: trimmed, isExternal: true };
  }
  if (trimmed.startsWith("/")) {
    return { url: trimmed, isExternal: false };
  }
  if (trimmed.includes(".") && !trimmed.includes(" ")) {
    return { url: `https://${trimmed}`, isExternal: true };
  }
  return {
    url: `https://www.baidu.com/s?wd=${encodeURIComponent(trimmed)}`,
    isExternal: true,
  };
}

export function generateTabId() {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
