"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { dismissAppBootstrapOverlay } from "@/lib/app-bootstrap-overlay";
import { getDesktop } from "@/lib/desktop-api";
import { useDesktopUpdater } from "@/lib/desktop-updater";

import { BrowserChromeHeader } from "./browser-chrome-header";
import { ExternalTabPlaceholder } from "./external-tab-placeholder";
import { PlatformAuthTabPlaceholder } from "./platform-auth-tab-placeholder";
import type { TabItem } from "./types";
import { useBrowserTabIpc } from "./use-browser-tab-ipc";
import {
  generateTabId,
  getDomainFromUrl,
  getTitleKeyFromPath,
  resolveAddressBarInput,
} from "./utils";

export type { TabItem } from "./types";

export function BrowserChrome() {
  const pathname = usePathname();
  const t = useTranslations();
  const locale = pathname.split("/")[1] || "zh-CN";
  const [initialTabId] = React.useState(() => generateTabId());
  const [tabs, setTabs] = React.useState<TabItem[]>(() => [
    {
      id: initialTabId,
      path: pathname || `/${locale}`,
      titleKey: getTitleKeyFromPath(pathname) || "browserChrome.newTab",
      isEmpty: false,
    },
  ]);
  const [activeId, setActiveId] = React.useState<string | null>(
    () => tabs[0]!.id,
  );
  const [isMaximized, setIsMaximized] = React.useState(false);

  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  const activeIdRef = React.useRef(activeId);
  activeIdRef.current = activeId;
  const tabsRef = React.useRef(tabs);
  tabsRef.current = tabs;

  const [canGoBack, setCanGoBack] = React.useState(false);
  const [canGoForward, setCanGoForward] = React.useState(false);
  const { state: updateState, check: checkUpdates, install: installUpdates } = useDesktopUpdater();

  React.useLayoutEffect(() => {
    dismissAppBootstrapOverlay();
  }, []);

  React.useEffect(() => {
    getDesktop()?.window?.isMaximized?.().then(setIsMaximized);
  }, []);

  useBrowserTabIpc({
    setTabs,
    setActiveId,
    activeIdRef,
    tabsRef,
    setCanGoBack,
    setCanGoForward,
    embedExternalVisible: Boolean(!activeTab?.isEmpty),
  });

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

  const toEmbeddedUrl = React.useCallback((tab: TabItem) => {
    if (!tab.path) return "";
    if (tab.isExternal || tab.platformAuthId) return tab.path;
    const normalizedPath = tab.path.startsWith("/") ? tab.path : `/${tab.path}`;
    if (typeof window === "undefined" || !window.location?.origin) {
      return normalizedPath;
    }
    const nextUrl = new URL(normalizedPath, window.location.origin);
    nextUrl.searchParams.set("__desktopEmbedded", "1");
    return nextUrl.toString();
  }, []);

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
    if (tabId) {
      const nextTab: TabItem = {
        ...active,
        path: url,
        isExternal,
      };
      const embeddedUrl = toEmbeddedUrl(nextTab);
      if (embeddedUrl) getDesktop()?.externalTab?.navigate?.(tabId, embeddedUrl);
    }
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
    if (id === initialTabId) return;
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    const idx = tabs.findIndex((t) => t.id === id);
    const next = tabs.filter((t) => t.id !== id);
    if (next.length === 0) return;
    if (tab.isExternal || tab.platformAuthId)
      getDesktop()?.externalTab?.close?.(id);
    else if (!tab.isEmpty) getDesktop()?.externalTab?.close?.(id);
    setTabs(next);
    const wasActive = id === activeId;
    if (wasActive) {
      const newActive = next[Math.max(0, idx - 1)];
      setActiveId(newActive.id);
    } else if (activeId && tabs.find((t) => t.id === activeId)) {
      setActiveId(activeId);
    } else {
      setActiveId(next[0].id);
    }
  };

  const handleSelectTab = (tab: TabItem) => {
    setActiveId(tab.id);
  };

  const desktop = getDesktop();
  const handleMinimize = () => desktop?.window?.minimize?.();
  const handleMaximize = () => {
    desktop?.window?.maximize?.();
    setIsMaximized((v) => !v);
  };
  const handleClose = () => desktop?.window?.close?.();

  React.useEffect(() => {
    if (activeTab?.isEmpty) {
      setCanGoBack(false);
      setCanGoForward(false);
      return;
    }
    const d = getDesktop();
    const tabIdForNav = activeTab?.id;
    if (d?.externalTab && tabIdForNav) {
      void Promise.all([
        d.externalTab.canGoBack(tabIdForNav),
        d.externalTab.canGoForward(tabIdForNav),
      ]).then(([back, forward]) => {
        setCanGoBack(back);
        setCanGoForward(forward);
      });
      return;
    }
    setCanGoBack(false);
    setCanGoForward(false);
  }, [
    activeTab?.id,
    activeTab?.isEmpty,
  ]);

  const handleRefresh = () => {
    if (activeTab?.isEmpty) return;
    if (activeTab?.isExternal && activeTab.loadError && activeTab.path) {
      retryExternalNavigation(activeTab.id, activeTab.path);
      return;
    }
    getDesktop()?.externalTab?.reload?.(activeTab.id);
  };

  const handleBack = () => {
    if (activeTab?.isEmpty) return;
    getDesktop()?.externalTab?.goBack?.(activeTab.id);
  };

  const handleForward = () => {
    if (activeTab?.isEmpty) return;
    getDesktop()?.externalTab?.goForward?.(activeTab.id);
  };

  const handleHeaderDoubleClick = () => {
    getDesktop()?.window?.maximize?.();
    setIsMaximized((v) => !v);
  };

  const updateBadgeText = React.useMemo(() => {
    if (!getDesktop()) return null;
    if (updateState.phase === "checking") return t("browserChrome.updater.checking");
    if (updateState.phase === "available") return t("browserChrome.updater.available");
    if (updateState.phase === "downloading") {
      const pct = Math.max(0, Math.min(100, Math.round(updateState.percent ?? 0)));
      return t("browserChrome.updater.downloading", { percent: pct });
    }
    if (updateState.phase === "downloaded") return t("browserChrome.updater.ready");
    if (updateState.phase === "error") return t("browserChrome.updater.error");
    return null;
  }, [t, updateState]);

  const handleUpdateBadgeClick = React.useCallback(() => {
    if (updateState.phase === "downloaded") {
      void installUpdates();
      return;
    }
    if (
      updateState.phase === "idle"
      || updateState.phase === "not-available"
      || updateState.phase === "error"
    ) {
      void checkUpdates();
    }
  }, [checkUpdates, installUpdates, updateState.phase]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted/40 dark:bg-muted/40">
      <BrowserChromeHeader
        tabs={tabs}
        activeId={activeId}
        initialTabId={initialTabId}
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
        updateBadgeText={updateBadgeText}
        onUpdateBadgeClick={handleUpdateBadgeClick}
      />

      <div className="relative min-h-0 flex-1 overflow-hidden">
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
        {/* 所有非空非授权 tab 统一使用 WebContentsView 承载 */}
        {!activeTab?.platformAuthId && !activeTab?.isEmpty && (
          <div className="absolute inset-0">
            <ExternalTabPlaceholder
              tabId={activeTab.id}
              url={toEmbeddedUrl(activeTab)}
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
