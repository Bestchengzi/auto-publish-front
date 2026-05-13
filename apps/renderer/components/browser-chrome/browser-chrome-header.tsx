"use client";

import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  DownloadIcon,
  GlobeIcon,
  MinusIcon,
  PlusIcon,
  RefreshCwIcon,
  StarIcon,
  SquareIcon,
  XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { getDesktop } from "@/lib/desktop-api";
import { cn } from "@/lib/utils";

import type { TabItem } from "./types";
import { TabIcon } from "./tab-icon";

export type BrowserChromeHeaderProps = {
  tabs: TabItem[];
  activeId: string | null;
  initialTabId: string;
  onSelectTab: (tab: TabItem) => void;
  onCloseTab: (e: React.MouseEvent, id: string) => void;
  onAddTab: () => void;
  isMaximized: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onCloseWindow: () => void;
  onHeaderDoubleClick: () => void;
  urlInput: string;
  setUrlInput: (v: string) => void;
  displayUrl: string;
  onUrlSubmit: (value: string) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  updateBadgeText?: string | null;
  onUpdateBadgeClick?: () => void;
};

export function BrowserChromeHeader({
  tabs,
  activeId,
  initialTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  isMaximized,
  onMinimize,
  onMaximize,
  onCloseWindow,
  onHeaderDoubleClick,
  urlInput,
  setUrlInput,
  displayUrl,
  onUrlSubmit,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onRefresh,
  updateBadgeText,
  onUpdateBadgeClick,
}: BrowserChromeHeaderProps) {
  const t = useTranslations();
  const addressEditable = activeId !== initialTabId;
  /** macOS `titleBarStyle: hidden` 下系统交通灯叠在内容区左上角，首帧后用 layout 写入避免与 SSR 不一致 */
  const [darwinTabLeading, setDarwinTabLeading] = React.useState(false);
  React.useLayoutEffect(() => {
    if (getDesktop()?.platform === "darwin") setDarwinTabLeading(true);
  }, []);

  return (
    <header className="flex shrink-0 flex-col border-b border-border bg-muted/30 dark:bg-muted/20">
      <div
        className="flex h-9 items-center gap-0.5 px-1"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        onDoubleClick={onHeaderDoubleClick}
      >
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden",
            // 约三颗交通灯宽度 + 与内容的间距，与常见 Electron 壳一致
            darwinTabLeading && "pl-[78px]",
          )}
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        >
          <div
            className="flex min-w-0 max-w-full items-center gap-0.5 overflow-hidden"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            {tabs.map((tab) => {
            const displayTitle =
              tab.title ?? (tab.isExternal ? tab.titleKey : t(tab.titleKey));
            return (
              <div
                key={tab.id}
                role="tab"
                aria-selected={tab.id === activeId}
                onClick={() => onSelectTab(tab)}
                className={cn(
                  "group flex w-[180px] min-w-[56px] shrink cursor-default items-center gap-1.5 overflow-hidden rounded-t-md px-3 py-1.5 transition-colors",
                  tab.id === activeId
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <TabIcon tab={tab} />
                <span className="min-w-0 flex-1 truncate text-sm">{displayTitle}</span>
                {tab.id !== initialTabId && (
                  <button
                    type="button"
                    onClick={(e) => onCloseTab(e, tab.id)}
                    className="ml-0.5 shrink-0 rounded p-0.5 opacity-60 outline-none ring-0 hover:bg-muted hover:opacity-100 focus-visible:outline-none focus-visible:ring-0"
                    aria-label="关闭"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
            );
            })}
            <div
              aria-hidden="true"
              className="mx-1 h-4 w-px shrink-0 bg-border"
            />
            <button
              type="button"
              onClick={onAddTab}
              className="ml-0.5 shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
              aria-label={t("browserChrome.newTab")}
            >
              <PlusIcon className="size-4" />
            </button>
          </div>
          <div
            aria-hidden="true"
            className="w-8 shrink-0"
            style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
          />
        </div>

        <div
          className="min-h-full w-2 shrink-0"
          style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
        />

        <div
          className="flex shrink-0 items-center gap-1 pl-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {updateBadgeText ? (
            <button
              type="button"
              onClick={onUpdateBadgeClick}
              className="inline-flex h-6 cursor-pointer items-center gap-1.5 rounded bg-primary/15 px-2 text-xs font-medium text-primary hover:bg-primary/20"
            >
              {updateBadgeText === t("browserChrome.updater.ready") ? (
                <RefreshCwIcon className="size-3.5" />
              ) : (
                <DownloadIcon className="size-3.5" />
              )}
              <span>{updateBadgeText}</span>
            </button>
          ) : null}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onMinimize}
              className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="最小化"
            >
              <MinusIcon className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMaximize}
              className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={isMaximized ? "还原" : "最大化"}
            >
              {isMaximized ? (
                <CopyIcon className="size-4" />
              ) : (
                <SquareIcon className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onCloseWindow}
              className="rounded p-2 text-muted-foreground hover:bg-red-500/20 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400"
              aria-label="关闭"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex h-11 items-center gap-2 border-t border-border/60 bg-background px-3 py-2"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:cursor-default disabled:opacity-40"
            aria-label={t("browserChrome.back")}
          >
            <ChevronLeftIcon className="size-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onForward}
            disabled={!canGoForward}
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:cursor-default disabled:opacity-40"
            aria-label={t("browserChrome.forward")}
          >
            <ChevronRightIcon className="size-5" strokeWidth={2.25} />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("browserChrome.refresh")}
          >
            <RefreshCwIcon className="size-4" />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-muted/60 px-2.5 py-0.5">
            <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <Input
                type="text"
                value={urlInput}
                onChange={(e) => {
                  if (!addressEditable) return;
                  setUrlInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (!addressEditable) return;
                  if (e.key === "Enter") onUrlSubmit(urlInput);
                }}
                onBlur={() => setUrlInput(displayUrl)}
                placeholder={t("browserChrome.urlPlaceholder")}
                readOnly={!addressEditable}
                className="h-6 w-full min-w-0 border-0 bg-transparent px-0 text-sm rounded-none shadow-none focus-visible:ring-0"
                style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
              />
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t("browserChrome.favorite")}
          >
            <StarIcon className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
