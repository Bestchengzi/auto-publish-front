import { contextBridge, ipcRenderer } from "electron";

export type PlatformAuthSerializedCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite: "unspecified" | "no_restriction" | "lax" | "strict";
  expirationDate?: number;
};

export type PlatformAuthResult =
  | { ok: true; platformId: string; cookies: PlatformAuthSerializedCookie[] }
  | {
      ok: false;
      error: "unsupported" | "busy" | "load_failed" | "cancelled";
      message?: string;
    };

export type PageMeta = { title?: string; favicon?: string };

export type ExternalTabApi = {
  load: (tabId: string, url: string) => void;
  loadPlatformAuth: (tabId: string, platformId: string) => void;
  navigate: (tabId: string, url: string) => void;
  show: (tabId: string) => void;
  setBounds: (bounds: { x: number; y: number; width: number; height: number }) => void;
  hide: () => void;
  close: (tabId: string) => void;
  reload: (tabId: string) => void;
  canGoBack: (tabId: string) => Promise<boolean>;
  canGoForward: (tabId: string) => Promise<boolean>;
  goBack: (tabId: string) => void;
  goForward: (tabId: string) => void;
  onTitleChanged: (cb: (tabId: string, title: string) => void) => () => void;
  onFaviconChanged: (cb: (tabId: string, favicon: string) => void) => () => void;
  onUrlChanged: (cb: (tabId: string, url: string) => void) => () => void;
  onLoading: (cb: (tabId: string, loading: boolean) => void) => () => void;
  onFailLoad: (
    cb: (tabId: string, code: number, description: string, validatedUrl: string) => void,
  ) => () => void;
  onFailLoadClear: (cb: (tabId: string) => void) => () => void;
  onDownloadStarted: (cb: (tabId: string) => void) => () => void;
  onOpenInTab: (cb: (url: string) => void) => () => void;
  onPlatformAuthTabRequest: (cb: (platformId: string, loginUrl: string) => void) => () => void;
  onPlatformAuthCompleted: (cb: (tabId: string, result: PlatformAuthResult) => void) => () => void;
};

export type ShellNavState = { canGoBack: boolean; canGoForward: boolean };

export type DesktopUpdateState = {
  phase: "idle" | "checking" | "available" | "downloading" | "downloaded" | "not-available" | "error";
  currentVersion: string;
  availableVersion?: string;
  downloadUrl?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  message?: string;
  checkedAt?: number;
};

export type DesktopApi = {
  /** 主进程 `process.platform`，供渲染端布局（如 macOS 交通灯避让） */
  platform: NodeJS.Platform;
  ping: () => Promise<{ ok: true; ts: number }>;
  startPlatformAuth: (platformId: string) => Promise<PlatformAuthResult>;
  openPlatformAuthInTab: (
    platformId: string,
    cookie?: string | null,
    mode?: "capture" | "browse",
  ) => void;
  fetchPageMeta: (url: string) => Promise<PageMeta>;
  /** 主窗口（产品页）自身 history，与 externalTab 无关 */
  shellNav: { getState: () => Promise<ShellNavState> };
  externalTab: ExternalTabApi;
  updater: {
    getState: () => Promise<DesktopUpdateState>;
    check: () => Promise<
      | { ok: true }
      | { ok: false; reason: "not_packaged" | "check_failed"; message?: string }
    >;
    download: () => Promise<
      | { ok: true; action: "download_started" | "opened_download_url" }
      | {
          ok: false;
          reason:
            | "not_ready"
            | "missing_download_url"
            | "open_failed"
            | "download_failed";
          message?: string;
        }
    >;
    install: () => Promise<{ ok: true } | { ok: false; reason: "not_ready" }>;
    onStateChanged: (cb: (state: DesktopUpdateState) => void) => () => void;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };
};

function subscribe(channel: string, cb: (...args: unknown[]) => void): () => void {
  const handler = (_: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

function detectEmbeddedView(): boolean {
  try {
    return Boolean(ipcRenderer.sendSync("desktop:is-embedded-view-sync"));
  } catch {
    return false;
  }
}

function getAllowedRendererOrigins(): Set<string> {
  const allow = new Set<string>([
    "http://localhost:13200",
    "http://192.168.88.30:13200",
    "https://keduck.cn",
  ]);
  const envUrl = process.env.ELECTRON_RENDERER_URL;
  if (typeof envUrl === "string" && envUrl.trim()) {
    try {
      allow.add(new URL(envUrl).origin);
    } catch {
      // ignore invalid env url
    }
  }
  return allow;
}

const allowedRendererOrigins = getAllowedRendererOrigins();

const api: DesktopApi = {
  platform: process.platform,
  ping: () => ipcRenderer.invoke("app:ping"),
  startPlatformAuth: (platformId: string) =>
    ipcRenderer.invoke("platform-auth:start", platformId),
  openPlatformAuthInTab: (
    platformId: string,
    cookie?: string | null,
    mode?: "capture" | "browse",
  ) =>
    ipcRenderer.invoke(
      "platform-auth:open-in-tab",
      platformId,
      cookie ?? null,
      mode ?? "capture",
    ),
  fetchPageMeta: (url: string) => ipcRenderer.invoke("fetch-page-meta", url),
  shellNav: {
    getState: () => ipcRenderer.invoke("shell-nav:get-state") as Promise<ShellNavState>,
  },
  externalTab: {
    load: (tabId, url) => ipcRenderer.send("external-tab:load", tabId, url),
    navigate: (tabId, url) => ipcRenderer.send("external-tab:navigate", tabId, url),
    show: (tabId) => ipcRenderer.send("external-tab:show", tabId),
    setBounds: (bounds) => ipcRenderer.send("external-tab:set-bounds", bounds),
    hide: () => ipcRenderer.send("external-tab:hide"),
    close: (tabId) => ipcRenderer.send("external-tab:close", tabId),
    reload: (tabId) => ipcRenderer.send("external-tab:reload", tabId),
    canGoBack: (tabId) => ipcRenderer.invoke("external-tab:can-go-back", tabId),
    canGoForward: (tabId) => ipcRenderer.invoke("external-tab:can-go-forward", tabId),
    goBack: (tabId) => ipcRenderer.send("external-tab:go-back", tabId),
    goForward: (tabId) => ipcRenderer.send("external-tab:go-forward", tabId),
    loadPlatformAuth: (tabId, platformId) => ipcRenderer.send("external-tab:load-platform-auth", tabId, platformId),
    onTitleChanged: (cb) => subscribe("external-tab:title-changed", (tabId, title) => cb(tabId as string, title as string)),
    onFaviconChanged: (cb) => subscribe("external-tab:favicon-changed", (tabId, favicon) => cb(tabId as string, favicon as string)),
    onUrlChanged: (cb) => subscribe("external-tab:url-changed", (tabId, url) => cb(tabId as string, url as string)),
    onLoading: (cb) => subscribe("external-tab:loading", (tabId, loading) => cb(tabId as string, loading as boolean)),
    onFailLoad: (cb) =>
      subscribe("external-tab:fail-load", (tabId, code, desc, validatedUrl) =>
        cb(tabId as string, code as number, desc as string, validatedUrl as string),
      ),
    onFailLoadClear: (cb) =>
      subscribe("external-tab:fail-load-clear", (tabId) => cb(tabId as string)),
    onDownloadStarted: (cb) =>
      subscribe("external-tab:download-started", (tabId) => cb(tabId as string)),
    onOpenInTab: (cb) => subscribe("open-in-tab", (url) => cb(url as string)),
    onPlatformAuthTabRequest: (cb) =>
      subscribe("open-platform-auth-tab", (platformId, loginUrl) => cb(platformId as string, loginUrl as string)),
    onPlatformAuthCompleted: (cb) =>
      subscribe("platform-auth:completed", (tabId, result) => cb(tabId as string, result as PlatformAuthResult)),
  },
  updater: {
    getState: () => ipcRenderer.invoke("app:update:get-state"),
    check: () => ipcRenderer.invoke("app:update:check"),
    download: () => ipcRenderer.invoke("app:update:download"),
    install: () => ipcRenderer.invoke("app:update:install"),
    onStateChanged: (cb) =>
      subscribe("app:update:state-changed", (state) => cb(state as DesktopUpdateState)),
  },
  window: {
    minimize: () => ipcRenderer.send("window:minimize"),
    maximize: () => ipcRenderer.send("window:maximize"),
    close: () => ipcRenderer.send("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  },
};

function shouldExposeDesktopApi() {
  try {
    const { protocol, origin } = window.location;
    if (protocol === "file:") return true;
    return allowedRendererOrigins.has(origin);
  } catch {
    return false;
  }
}

if (shouldExposeDesktopApi()) {
  contextBridge.exposeInMainWorld("desktop", api);
}
contextBridge.exposeInMainWorld("__desktopEmbeddedView", detectEmbeddedView());
