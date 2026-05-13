import { app, BrowserWindow, ipcMain, Menu, session, shell, webContents, WebContentsView } from "electron";
import path from "node:path";
import { autoUpdater } from "electron-updater";
import type { UpdateInfo } from "electron-updater";

import { fetchPageMeta } from "./fetch-page-meta";
import {
  attachPlatformAuthSuccessListener,
  registerPlatformAuthIpc,
  type PlatformAuthResult,
} from "./platform-auth-ipc";
import {
  isPlatformAuthId,
  PLATFORM_AUTH_CONFIG,
} from "./platform-auth-config";

type UpdatePhase =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "not-available"
  | "error";

type UpdateState = {
  phase: UpdatePhase;
  currentVersion: string;
  availableVersion?: string;
  downloadUrl?: string;
  percent?: number;
  transferred?: number;
  total?: number;
  message?: string;
  checkedAt?: number;
};

type PendingAuthRequest = {
  requesterWebContentsId: number;
  cookie: string | null;
  mode: "capture" | "browse";
};

let updateState: UpdateState = {
  phase: "idle",
  currentVersion: app.getVersion(),
};

let autoUpdaterInitialized = false;
/** OSS 桶根（与 electron-builder `publish.url` 一致）；Windows 的 `latest.yml` 与安装包放此根下 */
const UPDATE_DOWNLOAD_BASE_URL = "https://open-stack.oss-cn-shanghai.aliyuncs.com/";

/** Mac：Intel / ARM 各一份 `latest-mac.yml`，OSS 上分目录避免覆盖；与官网下载直链前缀一致 */
function getMacAutoUpdateFeedUrl(): string {
  const root = UPDATE_DOWNLOAD_BASE_URL.endsWith("/")
    ? UPDATE_DOWNLOAD_BASE_URL
    : `${UPDATE_DOWNLOAD_BASE_URL}/`;
  const sub = process.arch === "arm64" ? "mac/arm64/" : "mac/x64/";
  return `${root}${sub}`;
}

/** 解析 yml / UpdateInfo 里相对路径时使用的基址（Mac 用架构子目录，Win 用桶根） */
function getUpdateResolutionBaseUrl(): string {
  if (process.platform === "darwin") {
    return getMacAutoUpdateFeedUrl();
  }
  return UPDATE_DOWNLOAD_BASE_URL.endsWith("/")
    ? UPDATE_DOWNLOAD_BASE_URL
    : `${UPDATE_DOWNLOAD_BASE_URL}/`;
}

function getRendererBaseUrl() {
  const envRendererUrl = process.env.ELECTRON_RENDERER_URL?.trim();
  if (typeof envRendererUrl === "string" && /^https?:\/\//i.test(envRendererUrl)) {
    return envRendererUrl;
  }
  return app.isPackaged ? "https://keduck.cn" : "http://localhost:13200";
}

function getUpdateDownloadUrl(info: UpdateInfo, extension: string): string | undefined {
  const normalizedExtension = extension.toLowerCase();
  const file = info.files?.find((entry) =>
    entry.url.toLowerCase().split("?")[0]?.endsWith(`.${normalizedExtension}`),
  );
  const rawUrl = file?.url ?? (info.path?.toLowerCase().endsWith(`.${normalizedExtension}`) ? info.path : undefined);
  if (!rawUrl) return undefined;
  try {
    return new URL(rawUrl, getUpdateResolutionBaseUrl()).href;
  } catch {
    return rawUrl;
  }
}

function applyUpdateInfo(info: UpdateInfo, phase: UpdatePhase) {
  setUpdateState({
    phase,
    availableVersion: info.version,
    downloadUrl: getUpdateDownloadUrl(info, process.platform === "darwin" ? "dmg" : "exe"),
    message: undefined,
    checkedAt: Date.now(),
  });
}

function broadcastUpdateState() {
  for (const win of BrowserWindow.getAllWindows()) {
    safeSendToWindow(win, "app:update:state-changed", updateState);
  }
}

function safeSendToWebContents(
  target: Electron.WebContents | undefined | null,
  channel: string,
  ...args: unknown[]
) {
  try {
    if (!target || target.isDestroyed()) return;
    target.send(channel, ...args);
  } catch {
    // Window or webContents may be destroyed between lifecycle checks.
  }
}

function safeSendToWindow(
  win: BrowserWindow | undefined | null,
  channel: string,
  ...args: unknown[]
) {
  try {
    if (!win || win.isDestroyed()) return;
    safeSendToWebContents(win.webContents, channel, ...args);
  } catch {
    // Accessing webContents can throw after BrowserWindow destruction.
  }
}

function isHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function loadWindowOpenUrlInCurrentView(
  target: Electron.WebContents,
  url: string,
  onError?: (message: string) => void,
) {
  if (!isHttpUrl(url)) return;
  void target.loadURL(url).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("ERR_ABORTED") || message.includes("(-3)")) return;
    onError?.(message);
  });
}

function getWindowWebContentsId(win: BrowserWindow | undefined | null): number | undefined {
  try {
    if (!win || win.isDestroyed()) return undefined;
    const target = win.webContents;
    if (!target || target.isDestroyed()) return undefined;
    return target.id;
  } catch {
    return undefined;
  }
}

function setUpdateState(next: Partial<UpdateState>) {
  updateState = { ...updateState, ...next, currentVersion: app.getVersion() };
  broadcastUpdateState();
}

function setupAutoUpdater() {
  if (autoUpdaterInitialized) return;
  autoUpdaterInitialized = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = true;

  if (process.platform === "darwin") {
    autoUpdater.setFeedURL({
      provider: "generic",
      url: getMacAutoUpdateFeedUrl(),
    });
  }

  autoUpdater.on("checking-for-update", () => {
    setUpdateState({
      phase: "checking",
      message: undefined,
      percent: undefined,
      transferred: undefined,
      total: undefined,
      downloadUrl: undefined,
      checkedAt: Date.now(),
    });
  });

  autoUpdater.on("update-available", (info) => {
    applyUpdateInfo(info, "available");
  });

  autoUpdater.on("download-progress", (progress) => {
    setUpdateState({
      phase: "downloading",
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on("update-not-available", () => {
    setUpdateState({
      phase: "not-available",
      availableVersion: undefined,
      downloadUrl: undefined,
      percent: undefined,
      transferred: undefined,
      total: undefined,
      checkedAt: Date.now(),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    applyUpdateInfo(info, "downloaded");
    setUpdateState({ percent: 100 });
  });

  autoUpdater.on("error", (error) => {
    setUpdateState({
      phase: "error",
      message: error?.message ?? String(error),
      checkedAt: Date.now(),
    });
  });
}

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    frame: false,
    titleBarStyle: "hidden",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs")
    }
  });

  win.once("ready-to-show", () => {
    win.show();
    win.maximize();
  });

  const rendererUrl = getRendererBaseUrl();
  try {
    await win.loadURL(rendererUrl);
  } catch (error) {
    const modeHint = app.isPackaged
      ? "请设置 ELECTRON_RENDERER_URL 为线上地址。"
      : "请先在项目根目录运行：npm run dev（或 npm run dev:web）。";
    const detail = error instanceof Error ? error.message : String(error);
    await win.loadURL(
      `data:text/html,${encodeURIComponent(
        `<html><head><meta charset="utf-8"/></head><body style="font-family: system-ui; padding: 24px;"><h2>无法加载渲染端</h2><p>${modeHint}</p><p>当前尝试访问：</p><pre>${rendererUrl}</pre><pre>${detail}</pre></body></html>`,
      )}`,
    );
    return;
  }

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === "string" && isHttpUrl(url)) {
      safeSendToWindow(win, "open-in-tab", url);
    }
    return { action: "deny" };
  });
}

ipcMain.handle("app:ping", async () => {
  return { ok: true, ts: Date.now() };
});

ipcMain.handle("app:update:get-state", async () => {
  return updateState;
});

ipcMain.handle("app:update:check", async () => {
  if (!app.isPackaged) {
    return { ok: false, reason: "not_packaged" as const };
  }
  try {
    await autoUpdater.checkForUpdates();
    return { ok: true as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setUpdateState({ phase: "error", message, checkedAt: Date.now() });
    return { ok: false as const, reason: "check_failed" as const, message };
  }
});

ipcMain.handle("app:update:download", async () => {
  if (updateState.phase !== "available" && updateState.phase !== "error") {
    return { ok: false as const, reason: "not_ready" as const };
  }

  if (process.platform === "darwin") {
    if (!updateState.downloadUrl) {
      return { ok: false as const, reason: "missing_download_url" as const };
    }
    try {
      await shell.openExternal(updateState.downloadUrl);
      return { ok: true as const, action: "opened_download_url" as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setUpdateState({ phase: "error", message, checkedAt: Date.now() });
      return { ok: false as const, reason: "open_failed" as const, message };
    }
  }

  try {
    setUpdateState({
      phase: "downloading",
      percent: 0,
      transferred: undefined,
      total: undefined,
    });
    await autoUpdater.downloadUpdate();
    return { ok: true as const, action: "download_started" as const };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setUpdateState({ phase: "error", message, checkedAt: Date.now() });
    return { ok: false as const, reason: "download_failed" as const, message };
  }
});

ipcMain.handle("app:update:install", async () => {
  if (updateState.phase !== "downloaded") {
    return { ok: false as const, reason: "not_ready" as const };
  }
  setImmediate(() => {
    autoUpdater.quitAndInstall(false, true);
  });
  return { ok: true as const };
});

/** 主壳窗口（Next 渲染进程）自身的历史栈，用于内部标签的前进/后退按钮状态 */
ipcMain.handle("shell-nav:get-state", (event) => {
  const wc = event.sender;
  try {
    if (wc.isDestroyed()) return { canGoBack: false, canGoForward: false };
    const nh = wc.navigationHistory;
    return {
      canGoBack: nh.canGoBack(),
      canGoForward: nh.canGoForward(),
    };
  } catch {
    return { canGoBack: false, canGoForward: false };
  }
});

ipcMain.on("window:minimize", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.minimize();
});

ipcMain.on("window:maximize", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on("window:close", (_event) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win) win.close();
});

ipcMain.handle("window:isMaximized", async () => {
  const win = BrowserWindow.getFocusedWindow();
  return win?.isMaximized() ?? false;
});

ipcMain.on("desktop:is-embedded-view-sync", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const winWebContentsId = getWindowWebContentsId(win);
  const isEmbedded = typeof winWebContentsId === "number" && event.sender.id !== winWebContentsId;
  event.returnValue = isEmbedded;
});

ipcMain.handle("fetch-page-meta", async (_event, url: string) => {
  if (typeof url !== "string" || !url.startsWith("http")) return {};
  return fetchPageMeta(url);
});

const externalTabs = new Map<string, WebContentsView>();
/** 平台授权 tab 已做过首次 load+监听，避免 React Strict Mode 重复 IPC 导致二次 loadURL 中止首次导航 */
const platformAuthTabInitialized = new Set<string>();
/** 记录发起授权的 renderer，授权完成后仅定向回传给发起者（同时通知壳层用于收口 tab） */
const platformAuthRequesterByTabId = new Map<string, number>();
/** 按平台暂存发起者队列：收到 load-platform-auth 时再与新 tabId 绑定 */
const pendingAuthRequestQueueByPlatform = new Map<string, PendingAuthRequest[]>();
let activeExternalTabId: string | null = null;
let lastBounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

function getWindowFromIpcEvent(event: Electron.IpcMainEvent): BrowserWindow | null {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win && !win.isDestroyed() ? win : null;
}

function sendToWebContentsId(targetId: number | undefined, channel: string, ...args: unknown[]) {
  if (typeof targetId !== "number") return;
  const target = webContents.fromId(targetId);
  safeSendToWebContents(target, channel, ...args);
}

function detachEmbeddedView(win: BrowserWindow, view: WebContentsView) {
  try {
    win.contentView.removeChildView(view);
  } catch {
    // 未挂载时忽略
  }
}

function destroyEmbeddedWebContents(wc: Electron.WebContents) {
  setImmediate(() => {
    try {
      if (wc && !wc.isDestroyed()) (wc as unknown as { destroy: () => void }).destroy();
    } catch {
      // ignore
    }
  });
}

function parseAccountCookie(rawCookie: string | null): Electron.Cookie[] {
  if (typeof rawCookie !== "string" || rawCookie.trim() === "") return [];
  try {
    const parsed: unknown = JSON.parse(rawCookie);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): Electron.Cookie[] => {
      if (!item || typeof item !== "object") return [];
      const cookie = item as Partial<Electron.Cookie>;
      if (
        typeof cookie.name !== "string" ||
        cookie.name.trim() === "" ||
        typeof cookie.value !== "string"
      ) {
        return [];
      }
      return [
        {
          name: cookie.name,
          value: cookie.value,
          domain: typeof cookie.domain === "string" ? cookie.domain : undefined,
          path: typeof cookie.path === "string" ? cookie.path : "/",
          secure: Boolean(cookie.secure),
          httpOnly: Boolean(cookie.httpOnly),
          sameSite: cookie.sameSite,
          expirationDate:
            typeof cookie.expirationDate === "number"
              ? cookie.expirationDate
              : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}

function cookieUrlFromDomain(domain: string | undefined, secure: boolean): string | null {
  if (typeof domain !== "string" || domain.trim() === "") return null;
  const hostname = domain.trim().replace(/^\./, "");
  if (!hostname) return null;
  return `${secure ? "https" : "http"}://${hostname}/`;
}

async function injectAccountCookies(
  ses: Electron.Session,
  rawCookie: string | null,
  fallbackUrls: string[],
) {
  const cookies = parseAccountCookie(rawCookie);
  await Promise.allSettled(
    cookies.map((cookie) => {
      const url =
        cookieUrlFromDomain(cookie.domain, Boolean(cookie.secure)) ??
        fallbackUrls[0];
      if (!url) return Promise.resolve();
      return ses.cookies.set({ ...cookie, url });
    }),
  );
}

function createExternalView(win: BrowserWindow, tabId: string) {
  if (externalTabs.has(tabId)) return externalTabs.get(tabId)!;
  const bv = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:external-browser",
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
  externalTabs.set(tabId, bv);
  const send = (channel: string, ...args: unknown[]) => {
    safeSendToWindow(win, channel, ...args);
  };
  bv.webContents.on("page-title-updated", (_e, title) => {
    send("external-tab:title-changed", tabId, title);
  });

  bv.webContents.on("page-favicon-updated", (_e, favicons) => {
    const favicon = Array.isArray(favicons) ? favicons[0] : undefined;
    if (favicon) send("external-tab:favicon-changed", tabId, favicon);
  });
  bv.webContents.on("did-navigate", (_e, url) => {
    send("external-tab:url-changed", tabId, url);
  });
  bv.webContents.on("did-navigate-in-page", (_e, url) => {
    send("external-tab:url-changed", tabId, url);
  });

  let loadingTimeout: NodeJS.Timeout | null = null;
  bv.webContents.on("did-start-loading", () => {
    send("external-tab:fail-load-clear", tabId);
    if (activeExternalTabId === tabId) showExternalTab(win, tabId);
    send("external-tab:loading", tabId, true);
    if (loadingTimeout) clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
      loadingTimeout = null;
      send("external-tab:loading", tabId, false);
    }, 30000);
  });
  bv.webContents.on("did-fail-load", (_e, code, desc, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    if (code === -3) return;
    const urlStr = typeof validatedURL === "string" ? validatedURL : "";
    send("external-tab:fail-load", tabId, code, desc, urlStr);
    if (activeExternalTabId === tabId) detachEmbeddedView(win, bv);
  });
  bv.webContents.on("did-finish-load", () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    send("external-tab:loading", tabId, false);
  });

  bv.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === "string") {
      loadWindowOpenUrlInCurrentView(bv.webContents, url, (message) => {
        send("external-tab:fail-load", tabId, -2, message, url);
      });
    }
    return { action: "deny" };
  });

  return bv;
}

function showExternalTab(win: BrowserWindow, tabId: string, bounds?: { x: number; y: number; width: number; height: number }) {
  const view = externalTabs.get(tabId);
  if (!view) return;
  const prevId = activeExternalTabId;
  if (prevId && prevId !== tabId) {
    const prev = externalTabs.get(prevId);
    if (prev) detachEmbeddedView(win, prev);
  }
  activeExternalTabId = tabId;
  win.contentView.addChildView(view);
  view.setBounds(bounds ?? lastBounds);
}

function hideAllExternalTabs(win: BrowserWindow) {
  if (activeExternalTabId) {
    const v = externalTabs.get(activeExternalTabId);
    if (v) detachEmbeddedView(win, v);
  }
  activeExternalTabId = null;
}

ipcMain.on("external-tab:load", (event, tabId: string, url: string) => {
  if (typeof tabId !== "string" || typeof url !== "string" || !url.startsWith("http")) return;
  const win = getWindowFromIpcEvent(event);
  if (!win) return;
  const existing = externalTabs.get(tabId);
  if (existing) {
    showExternalTab(win, tabId);
    return;
  }
  const view = createExternalView(win, tabId);
  view.webContents.loadURL(url);
  showExternalTab(win, tabId);
});

ipcMain.on("external-tab:navigate", (event, tabId: string, url: string) => {
  if (typeof tabId !== "string" || typeof url !== "string" || !url.startsWith("http")) return;
  const win = getWindowFromIpcEvent(event);
  if (!win) return;
  const existing = externalTabs.get(tabId);
  if (existing) {
    existing.webContents.loadURL(url);
    showExternalTab(win, tabId);
  } else {
    const view = createExternalView(win, tabId);
    view.webContents.loadURL(url);
    showExternalTab(win, tabId);
  }
});

ipcMain.on("external-tab:show", (event, tabId: string) => {
  if (typeof tabId !== "string") return;
  const win = getWindowFromIpcEvent(event);
  if (!win) return;
  if (!externalTabs.has(tabId)) return;
  showExternalTab(win, tabId);
});

ipcMain.on("external-tab:set-bounds", (event, bounds: { x: number; y: number; width: number; height: number }) => {
  const win = getWindowFromIpcEvent(event);
  if (!win) return;
  lastBounds = bounds;
  const view = activeExternalTabId ? externalTabs.get(activeExternalTabId) : null;
  if (view) view.setBounds(bounds);
});

ipcMain.on("external-tab:hide", (event) => {
  const win = getWindowFromIpcEvent(event);
  if (!win) return;
  hideAllExternalTabs(win);
});

ipcMain.on("external-tab:close", (event, tabId: string) => {
  if (typeof tabId !== "string") return;
  const win = getWindowFromIpcEvent(event);
  const view = externalTabs.get(tabId);
  if (!view) return;
  platformAuthTabInitialized.delete(tabId);
  platformAuthRequesterByTabId.delete(tabId);
  externalTabs.delete(tabId);
  if (activeExternalTabId === tabId) {
    activeExternalTabId = null;
    if (win) detachEmbeddedView(win, view);
  }
  destroyEmbeddedWebContents(view.webContents);
});

ipcMain.handle("external-tab:can-go-back", async (_event, tabId: string) => {
  const wc = externalTabs.get(tabId)?.webContents;
  try {
    if (!wc || wc.isDestroyed()) return false;
    return wc.navigationHistory.canGoBack();
  } catch {
    return false;
  }
});

ipcMain.handle("external-tab:can-go-forward", async (_event, tabId: string) => {
  const wc = externalTabs.get(tabId)?.webContents;
  try {
    if (!wc || wc.isDestroyed()) return false;
    return wc.navigationHistory.canGoForward();
  } catch {
    return false;
  }
});

ipcMain.on("external-tab:go-back", (event, tabId: string) => {
  const wc = externalTabs.get(tabId)?.webContents;
  try {
    if (!wc || wc.isDestroyed()) return;
    if (wc.navigationHistory.canGoBack()) wc.goBack();
  } catch {
    // ignore
  }
});

ipcMain.on("external-tab:go-forward", (event, tabId: string) => {
  const wc = externalTabs.get(tabId)?.webContents;
  try {
    if (!wc || wc.isDestroyed()) return;
    if (wc.navigationHistory.canGoForward()) wc.goForward();
  } catch {
    // ignore
  }
});

ipcMain.on("external-tab:reload", (event, tabId: string) => {
  const view = externalTabs.get(tabId);
  if (view?.webContents) view.webContents.reload();
});

ipcMain.handle("platform-auth:open-in-tab", (event, platformId: string, cookie?: string | null, mode?: string) => {
  if (!isPlatformAuthId(platformId)) return;
  const cfg = PLATFORM_AUTH_CONFIG[platformId];
  const requesterWebContentsId = event.sender.id;
  const authMode = mode === "browse" ? "browse" : "capture";
  const queue = pendingAuthRequestQueueByPlatform.get(platformId) ?? [];
  queue.push({
    requesterWebContentsId,
    cookie: typeof cookie === "string" ? cookie : null,
    mode: authMode,
  });
  pendingAuthRequestQueueByPlatform.set(platformId, queue);
  const targetUrl = authMode === "browse" ? (cfg.authedUrl ?? cfg.loginUrl) : cfg.loginUrl;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    safeSendToWindow(win, "open-platform-auth-tab", platformId, targetUrl);
    return;
  }
  safeSendToWebContents(event.sender, "open-platform-auth-tab", platformId, targetUrl);
});

function createPlatformAuthView(
  win: BrowserWindow,
  tabId: string,
  platformId: string,
): WebContentsView {
  if (externalTabs.has(tabId)) return externalTabs.get(tabId)!;
  /** 每个 tab 使用独立 ephemeral partition，不持久化 cookie，每次授权互不干扰 */
  const partition = `platform-auth-${tabId}`;
  const bv = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition,
    },
  });
  externalTabs.set(tabId, bv);
  const send = (channel: string, ...args: unknown[]) => {
    safeSendToWindow(win, channel, ...args);
  };

  bv.webContents.on("page-title-updated", (_e, title) => {
    send("external-tab:title-changed", tabId, title);
  });
  bv.webContents.on("page-favicon-updated", (_e, favicons) => {
    const favicon = Array.isArray(favicons) ? favicons[0] : undefined;
    if (favicon) send("external-tab:favicon-changed", tabId, favicon);
  });
  bv.webContents.on("did-navigate", (_e, url) => {
    send("external-tab:url-changed", tabId, url);
  });
  bv.webContents.on("did-navigate-in-page", (_e, url) => {
    send("external-tab:url-changed", tabId, url);
  });
  let loadingTimeout: NodeJS.Timeout | null = null;
  bv.webContents.on("did-start-loading", () => {
    send("external-tab:loading", tabId, true);
    if (loadingTimeout) clearTimeout(loadingTimeout);
    loadingTimeout = setTimeout(() => {
      loadingTimeout = null;
      send("external-tab:loading", tabId, false);
    }, 30000);
  });
  bv.webContents.on("did-finish-load", () => {
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    send("external-tab:loading", tabId, false);
  });
  bv.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === "string") {
      loadWindowOpenUrlInCurrentView(bv.webContents, url, (message) => {
        send("external-tab:fail-load", tabId, -2, message, url);
      });
    }
    return { action: "deny" };
  });

  return bv;
}

ipcMain.on(
  "external-tab:load-platform-auth",
  (event, tabId: string, platformId: string) => {
  if (typeof tabId !== "string" || typeof platformId !== "string" || !isPlatformAuthId(platformId)) return;
  const win = getWindowFromIpcEvent(event);
  if (!win) return;

  if (platformAuthTabInitialized.has(tabId)) {
    showExternalTab(win, tabId);
    return;
  }
  const queue = pendingAuthRequestQueueByPlatform.get(platformId) ?? [];
  const authRequest = queue.shift();
  if (queue.length > 0) pendingAuthRequestQueueByPlatform.set(platformId, queue);
  else pendingAuthRequestQueueByPlatform.delete(platformId);
  platformAuthRequesterByTabId.set(tabId, authRequest?.requesterWebContentsId ?? event.sender.id);
  platformAuthTabInitialized.add(tabId);

  const cfg = PLATFORM_AUTH_CONFIG[platformId];
  /** 与 createPlatformAuthView 保持一致：ephemeral partition，每次授权独立 cookie */
  const partition = `platform-auth-${tabId}`;
  const ses = session.fromPartition(partition);

  const view = createPlatformAuthView(win, tabId, platformId);

  let completed = false;
  const finish = (result: PlatformAuthResult) => {
    if (completed) return;
    completed = true;
    const requesterId = platformAuthRequesterByTabId.get(tabId);
    platformAuthRequesterByTabId.delete(tabId);
    platformAuthTabInitialized.delete(tabId);
    safeSendToWindow(win, "platform-auth:completed", tabId, result);
    const winWebContentsId = getWindowWebContentsId(win);
    if (requesterId && requesterId !== winWebContentsId) {
      sendToWebContentsId(requesterId, "platform-auth:completed", tabId, result);
    }
    externalTabs.delete(tabId);
    if (activeExternalTabId === tabId) {
      activeExternalTabId = null;
      detachEmbeddedView(win, view);
    }
    destroyEmbeddedWebContents(view.webContents);
  };

  if (authRequest?.mode !== "browse") {
    attachPlatformAuthSuccessListener(view.webContents, platformId, ses, (result) => finish(result));
  }

  // 先附着到主窗口再加载，与独立 BrowserWindow 行为一致，避免部分站点在未附着 View 上报 ERR_FAILED
  showExternalTab(win, tabId);
  const targetUrl =
    authRequest?.mode === "browse" ? (cfg.authedUrl ?? cfg.loginUrl) : cfg.loginUrl;
  void injectAccountCookies(ses, authRequest?.cookie ?? null, cfg.cookieUrls)
    .then(() => view.webContents.loadURL(targetUrl))
    .catch((err) => {
    // 重定向链中被新导航中断时，Electron 会抛 ERR_ABORTED(-3)，不应视为授权失败。
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ERR_ABORTED") || msg.includes("(-3)")) return;
    if (authRequest?.mode === "browse") {
      safeSendToWindow(win, "external-tab:fail-load", tabId, -2, msg, targetUrl);
      return;
    }
    finish({
      ok: false,
      error: "load_failed",
      message: msg,
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  setupAutoUpdater();
  registerPlatformAuthIpc();
  await createMainWindow();

  if (app.isPackaged) {
    setTimeout(() => {
      void autoUpdater.checkForUpdates().catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        setUpdateState({ phase: "error", message, checkedAt: Date.now() });
      });
    }, 15_000);
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createMainWindow();
  });
});
