import { app, BrowserWindow, ipcMain, Menu, session, WebContentsView } from "electron";
import path from "node:path";

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

function getRendererUrl() {
  // Dev: use running Next dev server (fixed port 13200)
  if (!app.isPackaged)
    return process.env.ELECTRON_RENDERER_URL ?? "http://localhost:13200";

  // Prod: placeholder (later you can switch to loadFile for static export)
  return process.env.ELECTRON_RENDERER_URL ?? "http://localhost:13200";
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

  const url = getRendererUrl();
  try {
    await win.loadURL(url);
  } catch (error) {
    if (!app.isPackaged) {
      const message =
        "无法连接到渲染端（Next dev server）。\n\n" +
        "请先在项目根目录运行：npm run dev\n" +
        "或单独运行：npm run dev:web\n\n" +
        `当前尝试访问：${url}`;

      await win.loadURL(
        `data:text/html,${encodeURIComponent(
          `<html><head><meta charset="utf-8"/></head><body style="font-family: system-ui; padding: 24px;"><h2>Renderer 未启动</h2><pre>${message}</pre></body></html>`
        )}`
      );
      return;
    }
    throw error;
  }

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      win.webContents.send("open-in-tab", url);
    }
    return { action: "deny" };
  });
}

ipcMain.handle("app:ping", async () => {
  return { ok: true, ts: Date.now() };
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

ipcMain.handle("fetch-page-meta", async (_event, url: string) => {
  if (typeof url !== "string" || !url.startsWith("http")) return {};
  return fetchPageMeta(url);
});

const externalTabs = new Map<string, WebContentsView>();
/** 平台授权 tab 已做过首次 load+监听，避免 React Strict Mode 重复 IPC 导致二次 loadURL 中止首次导航 */
const platformAuthTabInitialized = new Set<string>();
let activeExternalTabId: string | null = null;
let lastBounds: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };

function getWindowFromIpcEvent(event: Electron.IpcMainEvent): BrowserWindow | null {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win && !win.isDestroyed() ? win : null;
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

function createExternalView(win: BrowserWindow, tabId: string) {
  if (externalTabs.has(tabId)) return externalTabs.get(tabId)!;
  const bv = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition: "persist:external-browser",
    },
  });
  externalTabs.set(tabId, bv);
  const send = (channel: string, ...args: unknown[]) => {
    if (win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  };

  bv.webContents.on("page-title-updated", (_e, title) => {
    send("external-tab:title-changed", tabId, title);
  });

  bv.webContents.on("page-favicon-updated", (_e, favicons) => {
    const favicon = Array.isArray(favicons) ? favicons[0] : undefined;
    if (favicon) send("external-tab:favicon-changed", tabId, favicon);
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
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      send("open-in-tab", url);
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
  externalTabs.delete(tabId);
  if (activeExternalTabId === tabId) {
    activeExternalTabId = null;
    if (win) detachEmbeddedView(win, view);
  }
  destroyEmbeddedWebContents(view.webContents);
});

ipcMain.handle("external-tab:can-go-back", async (_event, tabId: string) => {
  const view = externalTabs.get(tabId);
  return view?.webContents?.canGoBack() ?? false;
});

ipcMain.handle("external-tab:can-go-forward", async (_event, tabId: string) => {
  const view = externalTabs.get(tabId);
  return view?.webContents?.canGoForward() ?? false;
});

ipcMain.on("external-tab:go-back", (event, tabId: string) => {
  const view = externalTabs.get(tabId);
  if (view?.webContents?.canGoBack()) view.webContents.goBack();
});

ipcMain.on("external-tab:go-forward", (event, tabId: string) => {
  const view = externalTabs.get(tabId);
  if (view?.webContents?.canGoForward()) view.webContents.goForward();
});

ipcMain.on("external-tab:reload", (event, tabId: string) => {
  const view = externalTabs.get(tabId);
  if (view?.webContents) view.webContents.reload();
});

ipcMain.handle("platform-auth:open-in-tab", (event, platformId: string) => {
  if (!isPlatformAuthId(platformId)) return;
  const cfg = PLATFORM_AUTH_CONFIG[platformId];
  event.sender.send("open-platform-auth-tab", platformId, cfg.loginUrl);
});

function createPlatformAuthView(
  win: BrowserWindow,
  tabId: string,
  platformId: string,
): WebContentsView {
  if (externalTabs.has(tabId)) return externalTabs.get(tabId)!;
  const partition = `persist:platform-auth-${platformId}`;
  const bv = new WebContentsView({
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      partition,
    },
  });
  externalTabs.set(tabId, bv);
  const send = (channel: string, ...args: unknown[]) => {
    if (win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send(channel, ...args);
    }
  };

  bv.webContents.on("page-title-updated", (_e, title) => {
    send("external-tab:title-changed", tabId, title);
  });
  bv.webContents.on("page-favicon-updated", (_e, favicons) => {
    const favicon = Array.isArray(favicons) ? favicons[0] : undefined;
    if (favicon) send("external-tab:favicon-changed", tabId, favicon);
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
    if (typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      send("open-in-tab", url);
    }
    return { action: "deny" };
  });

  return bv;
}

ipcMain.on("external-tab:load-platform-auth", (event, tabId: string, platformId: string) => {
  if (typeof tabId !== "string" || typeof platformId !== "string" || !isPlatformAuthId(platformId)) return;
  const win = getWindowFromIpcEvent(event);
  if (!win) return;

  if (platformAuthTabInitialized.has(tabId)) {
    showExternalTab(win, tabId);
    return;
  }
  platformAuthTabInitialized.add(tabId);

  const cfg = PLATFORM_AUTH_CONFIG[platformId];
  const partition = `persist:platform-auth-${platformId}`;
  const ses = session.fromPartition(partition);

  const view = createPlatformAuthView(win, tabId, platformId);

  let completed = false;
  const finish = (result: PlatformAuthResult) => {
    if (completed) return;
    completed = true;
    platformAuthTabInitialized.delete(tabId);
    if (win.webContents && !win.webContents.isDestroyed()) {
      win.webContents.send("platform-auth:completed", tabId, result);
    }
    externalTabs.delete(tabId);
    if (activeExternalTabId === tabId) {
      activeExternalTabId = null;
      detachEmbeddedView(win, view);
    }
    destroyEmbeddedWebContents(view.webContents);
  };

  attachPlatformAuthSuccessListener(view.webContents, platformId, ses, (result) => finish(result));

  // 先附着到主窗口再加载，与独立 BrowserWindow 行为一致，避免部分站点在未附着 View 上报 ERR_FAILED
  showExternalTab(win, tabId);
  void view.webContents.loadURL(cfg.loginUrl).catch((err) => {
    finish({
      ok: false,
      error: "load_failed",
      message: err instanceof Error ? err.message : String(err),
    });
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  registerPlatformAuthIpc();
  await createMainWindow();

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createMainWindow();
  });
});

