"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { getDesktop } from "@/lib/desktop-api";

import { BrowserChromeHeader } from "./browser-chrome-header";
import { ExternalTabPlaceholder } from "./external-tab-placeholder";
import { PlatformAuthTabPlaceholder } from "./platform-auth-tab-placeholder";
import type { TabItem } from "./types";
import { useBrowserTabIpc } from "./use-browser-tab-ipc";
import {
  generateTabId,
  getAppFaviconUrl,
  getDomainFromUrl,
  getTitleKeyFromPath,
  resolveAddressBarInput,
} from "./utils";

export type { TabItem } from "./types";

export function BrowserChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const locale = pathname.split("/")[1] || "zh-CN";
  const [tabs, setTabs] = React.useState<TabItem[]>(() => [
    {
      id: generateTabId(),
      path: pathname || `/${locale}`,
      titleKey: getTitleKeyFromPath(pathname) || "browserChrome.newTab",
      isEmpty: false,
    },
  ]);
  const [activeId, setActiveId] = React.useState<string | null>(
    () => tabs[0]!.id,
  );
  const [internalShellKey, setInternalShellKey] = React.useState(0);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const currentTitleKey = getTitleKeyFromPath(pathname);

  const activeIdRef = React.useRef(activeId);
  activeIdRef.current = activeId;
  const tabsRef = React.useRef(tabs);
  tabsRef.current = tabs;

  const [canGoBack, setCanGoBack] = React.useState(false);
  const [canGoForward, setCanGoForward] = React.useState(false);

  React.useEffect(() => {
    getDesktop()?.window?.isMaximized?.().then(setIsMaximized);
  }, []);

  useBrowserTabIpc({
    setTabs,
    setActiveId,
    router,
    activeIdRef,
    tabsRef,
    setCanGoBack,
    setCanGoForward,
    embedExternalVisible: Boolean(
      activeTab?.isExternal || activeTab?.platformAuthId,
    ),
  });

  React.useEffect(() => {
    setTabs((prev) => {
      const active = prev.find((tab) => tab.id === activeId);
      if (!active || active.isEmpty || active.isExternal) return prev;
      if (active.path === pathname) return prev;
      return prev.map((tab) =>
        tab.id === activeId
          ? { ...tab, path: pathname, titleKey: currentTitleKey }
          : tab,
      );
    });
  }, [pathname, activeId, currentTitleKey]);

  const syncDocMetaToActiveTab = React.useCallback(() => {
    if (typeof document === "undefined") return;
    const title = document.title;
    const favicon = getAppFaviconUrl();
    setTabs((prev) => {
      const active = prev.find((tab) => tab.id === activeId);
      if (!active || active.isEmpty || active.isExternal) return prev;
      if (active.path !== pathname) return prev;
      const tab = prev.find((t) => t.id === activeId)!;
      if (tab.title === title && tab.favicon === favicon) return prev;
      return prev.map((t) =>
        t.id === activeId ? { ...t, title, favicon } : t,
      );
    });
  }, [activeId, pathname]);

  React.useEffect(() => {
    syncDocMetaToActiveTab();
    const titleEl = document.querySelector("title");
    const headEl = document.head;
    if (!titleEl || !headEl) return;
    const observer = new MutationObserver(syncDocMetaToActiveTab);
    observer.observe(titleEl, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    observer.observe(headEl, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [syncDocMetaToActiveTab]);

  const [urlInput, setUrlInput] = React.useState("");

  const displayUrl = React.useMemo(() => {
    if (activeTab?.isEmpty) return "";
    const path = (activeTab?.path ?? pathname) || "/";
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (activeTab?.isExternal) return path;
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}${normalizedPath}`;
    }
    return normalizedPath;
  }, [activeTab, pathname]);

  React.useEffect(() => {
    setUrlInput(displayUrl);
  }, [displayUrl]);

  const handleUrlSubmit = (value: string) => {
    const active = tabs.find((t) => t.id === activeId);
    if (!active) return;
    const { url, isExternal } = resolveAddressBarInput(
      value,
      Boolean(active.isEmpty),
    );
    if (!url) return;
    const tabId = activeId;
    const domain = isExternal ? getDomainFromUrl(url) : "";
    const titleKey = isExternal
      ? domain || "browserChrome.newTab"
      : getTitleKeyFromPath(url);
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              path: url,
              titleKey,
              isEmpty: false,
              isExternal,
              loadError: undefined,
              title: isExternal ? domain : undefined,
            }
          : tab,
      ),
    );
    if (!isExternal) {
      router.push(url);
      return;
    }
    if (tabId) getDesktop()?.externalTab?.navigate?.(tabId, url);
  };

  const retryExternalNavigation = React.useCallback(
    (tabId: string, url: string) => {
      setTabs((prev) =>
        prev.map((t) => (t.id === tabId ? { ...t, loadError: undefined } : t)),
      );
      getDesktop()?.externalTab?.navigate?.(tabId, url);
    },
    [],
  );

  const handleAddTab = () => {
    const newTab: TabItem = {
      id: generateTabId(),
      path: "",
      titleKey: "browserChrome.newTab",
      isEmpty: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveId(newTab.id);
  };

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    if (next.length === 0) return;
    if (tab.isExternal || tab.platformAuthId)
      getDesktop()?.externalTab?.close?.(id);
    setTabs(next);
    const wasActive = id === activeId;
    if (wasActive) {
      const newActive = next[Math.max(0, idx - 1)];
      setActiveId(newActive.id);
      if (newActive.path && !newActive.isEmpty && !newActive.isExternal)
        router.push(newActive.path);
    } else if (activeId && tabs.find((t) => t.id === activeId)) {
      setActiveId(activeId);
    } else {
      setActiveId(next[0].id);
    }
  };

  const handleSelectTab = (tab: TabItem) => {
    setActiveId(tab.id);
    if (tab.path && !tab.isEmpty && !tab.isExternal && !tab.platformAuthId)
      router.push(tab.path);
  };

  const desktop = getDesktop();
  const handleMinimize = () => desktop?.window?.minimize?.();
  const handleMaximize = () => {
    desktop?.window?.maximize?.();
    setIsMaximized((v) => !v);
  };
  const handleClose = () => desktop?.window?.close?.();

  const applyShellNavState = React.useCallback(
    (s: { canGoBack: boolean; canGoForward: boolean }) => {
      setCanGoBack(s.canGoBack);
      setCanGoForward(s.canGoForward);
    },
    [],
  );

  const refreshShellNavFromMain = React.useCallback(() => {
    const d = getDesktop();
    if (!d?.shellNav?.getState) return;
    void d.shellNav.getState().then(applyShellNavState);
  }, [applyShellNavState]);

  React.useEffect(() => {
    if (activeTab?.isEmpty) {
      setCanGoBack(false);
      setCanGoForward(false);
      return;
    }
    const isExternalOrAuth = Boolean(
      activeTab?.isExternal || activeTab?.platformAuthId,
    );
    const d = getDesktop();
    const tabIdForNav = activeTab?.id;

    if (isExternalOrAuth && d?.externalTab && tabIdForNav) {
      void Promise.all([
        d.externalTab.canGoBack(tabIdForNav),
        d.externalTab.canGoForward(tabIdForNav),
      ]).then(([back, forward]) => {
        setCanGoBack(back);
        setCanGoForward(forward);
      });
      return;
    }

    if (isExternalOrAuth) return;

    if (!d?.shellNav?.getState) {
      setCanGoBack(true);
      setCanGoForward(true);
      return;
    }
    void d.shellNav.getState().then(applyShellNavState);
  }, [
    activeTab?.id,
    activeTab?.isExternal,
    activeTab?.platformAuthId,
    activeTab?.isEmpty,
    pathname,
    applyShellNavState,
  ]);

  React.useEffect(() => {
    if (
      activeTab?.isEmpty ||
      activeTab?.isExternal ||
      activeTab?.platformAuthId
    )
      return;
    if (!getDesktop()?.shellNav?.getState) return;
    const onPop = () => refreshShellNavFromMain();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [
    activeTab?.isEmpty,
    activeTab?.isExternal,
    activeTab?.platformAuthId,
    refreshShellNavFromMain,
  ]);

  const scheduleShellNavResync = React.useCallback(() => {
    refreshShellNavFromMain();
    queueMicrotask(refreshShellNavFromMain);
    setTimeout(refreshShellNavFromMain, 0);
    setTimeout(refreshShellNavFromMain, 80);
  }, [refreshShellNavFromMain]);

  const handleRefresh = () => {
    if (activeTab?.isEmpty) return;
    if (activeTab?.isExternal || activeTab?.platformAuthId) {
      if (activeTab.isExternal && activeTab.loadError && activeTab.path) {
        retryExternalNavigation(activeTab.id, activeTab.path);
        return;
      }
      getDesktop()?.externalTab?.reload?.(activeTab.id);
      return;
    }
    router.refresh();
    setInternalShellKey((k) => k + 1);
  };

  const handleBack = () => {
    if (activeTab?.isEmpty) return;
    if (activeTab?.isExternal || activeTab?.platformAuthId) {
      getDesktop()?.externalTab?.goBack?.(activeTab.id);
      return;
    }
    if (!canGoBack) return;
    router.back();
    scheduleShellNavResync();
  };

  const handleForward = () => {
    if (activeTab?.isEmpty) return;
    if (activeTab?.isExternal || activeTab?.platformAuthId) {
      getDesktop()?.externalTab?.goForward?.(activeTab.id);
      return;
    }
    if (!canGoForward) return;
    router.forward();
    scheduleShellNavResync();
  };

  const handleHeaderDoubleClick = () => {
    getDesktop()?.window?.maximize?.();
    setIsMaximized((v) => !v);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/40 dark:bg-muted/40">
      <BrowserChromeHeader
        tabs={tabs}
        activeId={activeId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onAddTab={handleAddTab}
        isMaximized={isMaximized}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onCloseWindow={handleClose}
        onHeaderDoubleClick={handleHeaderDoubleClick}
        urlInput={urlInput}
        setUrlInput={setUrlInput}
        displayUrl={displayUrl}
        onUrlSubmit={handleUrlSubmit}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onBack={handleBack}
        onForward={handleForward}
        onRefresh={handleRefresh}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {/* 产品内容始终挂载，仅通过 display 切换可见性，避免 tab 切换时卸载导致刷新 */}
        <div
          key={internalShellKey}
          className="absolute inset-0 overflow-hidden"
          style={{
            display:
              !activeTab?.isEmpty &&
              !activeTab?.isExternal &&
              !activeTab?.platformAuthId
                ? "block"
                : "none",
          }}
        >
          {children}
        </div>
        {/* 空 tab 占位 */}
        {activeTab?.isEmpty && (
          <div className="absolute inset-0 flex h-full items-center justify-center bg-background">
            <p className="text-muted-foreground">
              {t("browserChrome.emptyStatePrompt")}
            </p>
          </div>
        )}
        {/* 平台授权 tab */}
        {activeTab?.platformAuthId && !activeTab?.isEmpty && (
          <div className="absolute inset-0">
            <PlatformAuthTabPlaceholder
              tabId={activeTab.id}
              platformId={activeTab.platformAuthId}
            />
          </div>
        )}
        {/* 外部网页 tab */}
        {activeTab?.isExternal && !activeTab?.isEmpty && (
          <div className="absolute inset-0">
            <ExternalTabPlaceholder
              tabId={activeTab.id}
              url={activeTab.path}
              loadError={activeTab.loadError}
              onRetry={() => {
                if (activeTab.path)
                  retryExternalNavigation(activeTab.id, activeTab.path);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
