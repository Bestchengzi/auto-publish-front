import type { WebContents } from "electron";
import { BrowserWindow, ipcMain, session } from "electron";

import {
  isPlatformAuthId,
  isPlatformAuthSuccessUrl,
  PLATFORM_AUTH_CONFIG,
  type PlatformAuthId,
} from "./platform-auth-config";

/** 扫码/跳转后等待 Set-Cookie 落盘再采集 */
const AUTH_SUCCESS_DEBOUNCE_MS = 800;

export type SerializedCookie = {
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
  | { ok: true; platformId: PlatformAuthId; cookies: SerializedCookie[] }
  | {
      ok: false;
      error: "unsupported" | "busy" | "load_failed" | "cancelled";
      message?: string;
    };

function serializeCookie(c: Electron.Cookie): SerializedCookie {
  return {
    name: c.name,
    value: c.value,
    domain: c.domain ?? "",
    path: c.path ?? "/",
    secure: c.secure ?? false,
    httpOnly: c.httpOnly ?? false,
    sameSite: c.sameSite ?? "unspecified",
    expirationDate: c.expirationDate,
  };
}

async function collectCookies(
  ses: Electron.Session,
  cookieUrls: string[],
): Promise<SerializedCookie[]> {
  const merged = new Map<string, Electron.Cookie>();
  for (const url of cookieUrls) {
    const list = await ses.cookies.get({ url });
    for (const c of list) {
      console.log(c.name)
      const key = `${c.domain}\0${c.path}\0${c.name}`;
      merged.set(key, c);
    }
  }
  return [...merged.values()].map(serializeCookie);
}

/**
 * 为嵌入 WebContents（如 WebContentsView）绑定平台登录成功检测，
 * 登录成功后调用 onComplete，调用方负责销毁 view。
 */
export function attachPlatformAuthSuccessListener(
  webContents: WebContents,
  platformId: PlatformAuthId,
  ses: Electron.Session,
  onComplete: (result: PlatformAuthResult) => void,
): void {
  const cfg = PLATFORM_AUTH_CONFIG[platformId];
  let settled = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const clearDebounce = () => {
    if (debounceTimer != null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };

  const completeSuccess = async () => {
    if (settled || webContents.isDestroyed()) return;
    const url = webContents.getURL();
    if (!isPlatformAuthSuccessUrl(platformId, url)) return;

    settled = true;
    clearDebounce();
    try {
      const cookies = await collectCookies(ses, cfg.cookieUrls);
      onComplete({ ok: true, platformId, cookies });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      onComplete({ ok: false, error: "load_failed", message });
    }
  };

  const scheduleSuccessCheck = (url: string) => {
    if (settled || webContents.isDestroyed()) return;
    if (!isPlatformAuthSuccessUrl(platformId, url)) {
      clearDebounce();
      return;
    }
    clearDebounce();
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (settled || webContents.isDestroyed()) return;
      const latest = webContents.getURL();
      if (!isPlatformAuthSuccessUrl(platformId, latest)) return;
      void completeSuccess();
    }, AUTH_SUCCESS_DEBOUNCE_MS);
  };

  webContents.on("did-navigate", (_e, url) => scheduleSuccessCheck(url));
  webContents.on("did-navigate-in-page", (_e, url) => scheduleSuccessCheck(url));
  webContents.on("did-finish-load", () => scheduleSuccessCheck(webContents.getURL()));

  webContents.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || settled) return;
    // 被新导航取消的旧请求，不应视为最终失败（常见于 Strict Mode / 重入 loadURL）
    if (code === -3) return;
    settled = true;
    clearDebounce();
    onComplete({
      ok: false,
      error: "load_failed",
      message: `${code}: ${desc} (${url})`,
    });
  });
}

/** 每个弹窗使用独立 partition，支持同时打开多个平台授权，cookie 互不干扰 */
function nextAuthPartition(platformId: string): string {
  return `platform-auth-popup-${platformId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 登录窗口不加载业务 preload，避免第三方页面拿到 IPC 桥。 */
export function registerPlatformAuthIpc(): void {
  ipcMain.handle(
    "platform-auth:start",
    async (_event, platformId: string): Promise<PlatformAuthResult> => {
      if (!isPlatformAuthId(platformId)) {
        return { ok: false, error: "unsupported" };
      }

      const cfg = PLATFORM_AUTH_CONFIG[platformId];
      /** ephemeral partition，不持久化 cookie，每次打开都是全新会话 */
      const partition = nextAuthPartition(platformId);
      const ses = session.fromPartition(partition);

      return await new Promise<PlatformAuthResult>((resolve) => {
        const win = new BrowserWindow({
          width: 960,
          height: 800,
          show: false,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            partition,
          },
        });

        let settled = false;
        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const clearDebounce = () => {
          if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
          }
        };

        const completeSuccess = async () => {
          if (settled || win.isDestroyed()) return;
          const url = win.webContents.getURL();
          if (!isPlatformAuthSuccessUrl(platformId, url)) return;

          settled = true;
          clearDebounce();
          try {
            const cookies = await collectCookies(ses, cfg.cookieUrls);
            resolve({ ok: true, platformId, cookies });
          } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            resolve({ ok: false, error: "load_failed", message });
          } finally {
            if (!win.isDestroyed()) win.destroy();
          }
        };

        const scheduleSuccessCheck = (url: string) => {
          if (settled || win.isDestroyed()) return;

          if (!isPlatformAuthSuccessUrl(platformId, url)) {
            clearDebounce();
            return;
          }

          clearDebounce();
          debounceTimer = setTimeout(() => {
            debounceTimer = null;
            if (settled || win.isDestroyed()) return;
            const latest = win.webContents.getURL();
            if (!isPlatformAuthSuccessUrl(platformId, latest)) return;
            void completeSuccess();
          }, AUTH_SUCCESS_DEBOUNCE_MS);
        };

        win.once("ready-to-show", () => win.show());

        win.on("close", (e) => {
          if (settled) return;
          e.preventDefault();
          settled = true;
          clearDebounce();
          if (!win.isDestroyed()) win.destroy();
          resolve({ ok: false, error: "cancelled" });
        });

        win.webContents.on("did-navigate", (_e, url) => {
          scheduleSuccessCheck(url);
        });
        win.webContents.on("did-navigate-in-page", (_e, url) => {
          scheduleSuccessCheck(url);
        });
        win.webContents.on("did-finish-load", () => {
          scheduleSuccessCheck(win.webContents.getURL());
        });

        win.webContents.on(
          "did-fail-load",
          (_e, code, desc, url, isMainFrame) => {
            if (!isMainFrame || settled) return;
            settled = true;
            clearDebounce();
            if (!win.isDestroyed()) win.destroy();
            resolve({
              ok: false,
              error: "load_failed",
              message: `${code}: ${desc} (${url})`,
            });
          },
        );

        win
          .loadURL(cfg.loginUrl)
          .catch((err) => {
            if (settled) return;
            settled = true;
            clearDebounce();
            if (!win.isDestroyed()) win.destroy();
            resolve({
              ok: false,
              error: "load_failed",
              message: err instanceof Error ? err.message : String(err),
            });
          });
      });
    },
  );
}
