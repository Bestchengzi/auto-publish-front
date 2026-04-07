export {};

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

declare global {
  interface Window {
    __desktopEmbeddedView?: boolean;
    desktop?: {
      ping: () => Promise<{ ok: true; ts: number }>;
      startPlatformAuth: (platformId: string) => Promise<PlatformAuthResult>;
      fetchPageMeta: (url: string) => Promise<{ title?: string; favicon?: string }>;
      openPlatformAuthInTab: (platformId: string) => void;
      shellNav: {
        getState: () => Promise<{ canGoBack: boolean; canGoForward: boolean }>;
      };
      externalTab: {
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
        onOpenInTab: (cb: (url: string) => void) => () => void;
        onPlatformAuthTabRequest: (cb: (platformId: string, loginUrl: string) => void) => () => void;
        onPlatformAuthCompleted: (cb: (tabId: string, result: PlatformAuthResult) => void) => () => void;
      };
      window: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
        isMaximized: () => Promise<boolean>;
      };
    };
  }
}
