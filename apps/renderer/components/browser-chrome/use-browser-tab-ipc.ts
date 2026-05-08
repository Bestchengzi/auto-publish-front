"use client";

import * as React from "react";

import { getDesktop } from "@/lib/desktop-api";

import type { TabItem } from "./types";
import { generateTabId, getDomainFromUrl, getTitleKeyFromPath } from "./utils";

type UseBrowserTabIpcParams = {
  setTabs: React.Dispatch<React.SetStateAction<TabItem[]>>;
  setActiveId: React.Dispatch<React.SetStateAction<string | null>>;
  router?: { push: (href: string) => void };
  activeIdRef: React.MutableRefObject<string | null>;
  tabsRef: React.MutableRefObject<TabItem[]>;
  initialTabId: string;
  setCanGoBack: React.Dispatch<React.SetStateAction<boolean>>;
  setCanGoForward: React.Dispatch<React.SetStateAction<boolean>>;
  /** 当前标签是否正在显示嵌入的外部 / 平台授权 WebContents */
  embedExternalVisible: boolean;
};

export function useBrowserTabIpc({
  setTabs,
  setActiveId,
  activeIdRef,
  tabsRef,
  initialTabId,
  setCanGoBack,
  setCanGoForward,
  embedExternalVisible,
}: UseBrowserTabIpcParams) {
  const normalizeTabFromNavigatedUrl = React.useCallback(
    (rawUrl: string, current: TabItem) => {
      try {
        const next = new URL(rawUrl);
        const currentOrigin =
          typeof window !== "undefined" ? window.location.origin : "";
        const isInternal = Boolean(currentOrigin) && next.origin === currentOrigin;
        if (isInternal) {
          next.searchParams.delete("__desktopEmbedded");
          const cleanPath = `${next.pathname}${next.search}${next.hash}`;
          return {
            path: cleanPath || "/",
            isExternal: false,
            titleKey: getTitleKeyFromPath(cleanPath),
          };
        }
        return {
          path: rawUrl,
          isExternal: true,
          titleKey: getDomainFromUrl(rawUrl) || current.titleKey,
        };
      } catch {
        return {
          path: rawUrl,
          isExternal: current.isExternal ?? true,
          titleKey: current.titleKey,
        };
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!embedExternalVisible) getDesktop()?.externalTab?.hide?.();
  }, [embedExternalVisible]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onTitleChanged) return;
    return desktop.externalTab.onTitleChanged((tabId, title) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, title } : t)),
      );
    });
  }, [setTabs]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onFaviconChanged) return;
    return desktop.externalTab.onFaviconChanged((tabId, favicon) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, favicon } : t)),
      );
    });
  }, [setTabs]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onUrlChanged) return;
    return desktop.externalTab.onUrlChanged((tabId, url) => {
      setTabs((prev) =>
        prev.map((t) => {
          if (t.id !== tabId) return t;
          const normalized = normalizeTabFromNavigatedUrl(url, t);
          return {
            ...t,
            path: normalized.path,
            isExternal: normalized.isExternal,
            titleKey: normalized.titleKey,
          };
        }),
      );
    });
  }, [setTabs, normalizeTabFromNavigatedUrl]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onFailLoad || !desktop?.externalTab?.onFailLoadClear) return;
    const offFail = desktop.externalTab.onFailLoad((tabId, code, desc, validatedUrl) => {
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId
            ? {
                ...t,
                loadError: { code, description: desc, validatedUrl },
                loading: false,
              }
            : t,
        ),
      );
    });
    const offClear = desktop.externalTab.onFailLoadClear((tabId) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, loadError: undefined } : t)),
      );
    });
    return () => {
      offFail();
      offClear();
    };
  }, [setTabs]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onLoading) return;
    return desktop.externalTab.onLoading((tabId, loading) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, loading } : t)),
      );
      if (!loading && tabId === activeIdRef.current && desktop?.externalTab) {
        void desktop.externalTab.canGoBack(tabId).then(setCanGoBack);
        void desktop.externalTab.canGoForward(tabId).then(setCanGoForward);
      }
    });
  }, [setTabs, activeIdRef, setCanGoBack, setCanGoForward]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onOpenInTab) return;
    return desktop.externalTab.onOpenInTab((url) => {
      const domain = getDomainFromUrl(url);
      const newTab: TabItem = {
        id: generateTabId(),
        path: url,
        titleKey: domain || "browserChrome.newTab",
        isEmpty: false,
        isExternal: true,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveId(newTab.id);
    });
  }, [setTabs, setActiveId]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onDownloadStarted) return;
    return desktop.externalTab.onDownloadStarted((tabId) => {
      const prev = tabsRef.current;
      const target = prev.find((t) => t.id === tabId);
      if (!target) return;
      const next = prev.filter((t) => t.id !== tabId);
      const wasActive = activeIdRef.current === tabId;
      setTabs(next);
      if (wasActive) {
        const idx = prev.findIndex((t) => t.id === tabId);
        const newActive = next[Math.max(0, idx - 1)] ?? next[0];
        setActiveId(newActive?.id ?? null);
      }
      getDesktop()?.externalTab?.close?.(tabId);
    });
  }, [activeIdRef, setActiveId, setTabs, tabsRef]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onPlatformAuthTabRequest) return;
    return desktop.externalTab.onPlatformAuthTabRequest((platformId, loginUrl) => {
      const domain = getDomainFromUrl(loginUrl);
      const newTab: TabItem = {
        id: generateTabId(),
        path: loginUrl,
        titleKey: domain || platformId,
        isEmpty: false,
        isExternal: true,
        platformAuthId: platformId,
      };
      setTabs((prev) => [...prev, newTab]);
      setActiveId(newTab.id);
    });
  }, [setTabs, setActiveId]);

  React.useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.externalTab?.onPlatformAuthCompleted) return;
    return desktop.externalTab.onPlatformAuthCompleted((tabId) => {
      const prev = tabsRef.current;
      const next = prev.filter((t) => t.id !== tabId);
      const wasActive = activeIdRef.current === tabId;
      setTabs(next);
      if (wasActive) {
        const appTab = next.find((t) => t.id === initialTabId);
        setActiveId(appTab?.id ?? next[0]?.id ?? null);
      }
    });
  }, [setTabs, setActiveId, activeIdRef, tabsRef, initialTabId]);
}
