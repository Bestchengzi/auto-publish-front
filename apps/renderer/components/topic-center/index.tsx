"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import {
  fetchHotRank,
  getHotRankItemsForList,
  getHotRankLogoPath,
  getHotRankUpdateTimeForList,
  HOT_RANK_LIST_ORDER,
  type HotRankDisplayItem,
  type HotRankListId,
} from "@/lib/api/hot-rank";
import { formatUpdateAgoMinutesToHours } from "@/lib/date";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import { createThread } from "@/lib/langgraph-client";
import { PageEmptyState } from "@/components/common/page-empty-state";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** 热榜卡片内列表最多展示条数；内容区高度按此行数固定 */
const HOT_LIST_MAX_ITEMS = 10;
/**
 * 固定为 10 条列表占位高度（与 space-y-1 一致），各平台卡片主体等高
 * 列表为 text-base，行高使用 h-8（2rem）
 * = 10 行 × 2rem + 9 个 space-y-1(0.25rem)
 * 外层同一节点有 px-4 py-3，border-box 下 height 含 padding，须加上 py-3（1.5rem）否则内列表会被裁切
 */
const HOT_LIST_BODY_HEIGHT_CLASS =
  "h-[calc(10*2rem+9*0.25rem+1.5rem)]";

function HotTopicsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {HOT_RANK_LIST_ORDER.map((id) => (
        <div
          key={id}
          className="flex flex-col rounded-xl border border-border bg-card overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-4 w-24 shrink-0 rounded-sm" />
          </div>
          <Separator />
          <div
            className={cn(
              "px-4 py-3 space-y-1 overflow-hidden",
              HOT_LIST_BODY_HEIGHT_CLASS,
            )}
          >
            {Array.from({ length: HOT_LIST_MAX_ITEMS }).map((_, j) => (
              <div
                key={`${id}-sk-${j}`}
                className="flex h-8 shrink-0 items-center gap-2"
              >
                <Skeleton
                  className="h-4 w-5 shrink-0 rounded-sm"
                  aria-hidden
                />
                <Skeleton className="h-4 min-w-0 flex-1" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const titleTextClass =
  "min-w-0 flex-1 truncate text-base leading-normal text-foreground/90";
const titleLinkClass = cn(
  titleTextClass,
  "hover:text-primary hover:underline underline-offset-2",
);

function HotRankItemTitle({
  text,
  href,
}: {
  text: string;
  href: string | null;
}) {
  const anchorRef = React.useRef<HTMLAnchorElement>(null);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);

  const remeasure = React.useCallback(() => {
    const el = href != null ? anchorRef.current : spanRef.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, [href]);

  React.useLayoutEffect(() => {
    remeasure();
    const el = href != null ? anchorRef.current : spanRef.current;
    if (!el) return;
    const ro = new ResizeObserver(remeasure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, href, remeasure]);

  const inner =
    href != null ? (
      <a
        ref={anchorRef}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={titleLinkClass}
      >
        {text}
      </a>
    ) : (
      <span ref={spanRef} className={titleTextClass}>
        {text}
      </span>
    );

  if (!truncated) {
    return (
      <div className="flex min-w-0 flex-1">
        {inner}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="min-w-0 flex-1"
        render={
          <div
            className="flex min-w-0 flex-1 cursor-default outline-none"
          >
            {inner}
          </div>
        }
      />
      <TooltipContent side="top" className="max-w-sm">
        <p className="whitespace-pre-wrap break-words text-left">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function useUpdateAgoTick(epochTs: number | null, appLocale: string) {
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (epochTs == null) return;
    const id = window.setInterval(() => {
      setTick((n) => n + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [epochTs]);
  if (epochTs == null) return null;
  return formatUpdateAgoMinutesToHours(epochTs, appLocale);
}

function HotListCard({
  listId,
  boardTitle,
  items,
  updatedAtTs,
  appLocale,
  onDiverge,
  pendingItemKey,
}: {
  listId: HotRankListId;
  boardTitle: string;
  items: HotRankDisplayItem[];
  updatedAtTs: number | null;
  appLocale: string;
  onDiverge: (title: string, itemKey: string) => Promise<void>;
  pendingItemKey: string | null;
}) {
  const t = useTranslations("topicCenter");
  const displayItems = items.slice(0, HOT_LIST_MAX_ITEMS);
  const logoSrc = getHotRankLogoPath(listId);
  const relativeTime = useUpdateAgoTick(updatedAtTs, appLocale);
  const updatedLabel =
    relativeTime != null
      ? t("hotRank.updatedAgo", { time: relativeTime })
      : null;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="size-9 shrink-0 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- 热榜独立 logo 资源 */}
          <img
            src={logoSrc}
            alt=""
            width={30}
            height={30}
            className="object-contain"
            aria-hidden
          />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h3 className="truncate text-base font-semibold text-foreground min-w-0 flex-1">
            {boardTitle}
          </h3>
          {updatedLabel ? (
            <span
              className="shrink-0 text-sm text-muted-foreground tabular-nums whitespace-nowrap"
              title={updatedLabel}
            >
              {updatedLabel}
            </span>
          ) : null}
        </div>
      </div>
      <Separator />
      <div
        className={cn(
          "px-4 py-3 flex flex-col min-h-0 overflow-hidden",
          HOT_LIST_BODY_HEIGHT_CLASS,
        )}
      >
        {displayItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-base text-muted-foreground text-center px-1 min-h-0">
            {t("hotRank.empty")}
          </div>
        ) : (
          <ul className="w-full space-y-1 overflow-hidden">
            {displayItems.map((item, i) => {
              const rank = i + 1;
              const itemKey = `${listId}-${i}`;
              const isPending = pendingItemKey === itemKey;
              const hasPending = pendingItemKey !== null;
              const rankColorClass =
                rank === 1
                  ? "text-red-500 font-semibold"
                  : rank === 2
                    ? "text-orange-500 font-semibold"
                    : rank === 3
                      ? "text-amber-500 font-semibold"
                      : "text-muted-foreground";
              return (
                <li
                  key={`${listId}-${i}`}
                  className="group relative flex h-8 shrink-0 items-center gap-2 text-base -mx-2 px-2 rounded-md hover:bg-muted/60 transition-colors"
                >
                  <span
                    className={cn("shrink-0 w-5 text-center tabular-nums", rankColorClass)}
                    aria-hidden
                  >
                    {rank}
                  </span>
                  <HotRankItemTitle text={item.title} href={item.url} />
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={hasPending}
                    className={cn(
                      "absolute right-2 top-1/2 -mt-4 h-8 px-3 py-0 text-sm font-medium whitespace-nowrap shadow-sm",
                      "disabled:opacity-100",
                      "transition-opacity",
                      !hasPending && "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto",
                      isPending && "opacity-100 pointer-events-auto",
                      hasPending && !isPending && "opacity-0 pointer-events-none disabled:opacity-0",
                    )}
                    aria-label={t("actions.secondaryCreation")}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await onDiverge(item.title, itemKey);
                    }}
                  >
                    {isPending ? (
                      <Loader2Icon className="size-4 animate-spin" />
                    ) : (
                      t("actions.secondaryCreation")
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TopicCenter() {
  const t = useTranslations();
  const tTopicCenter = useTranslations("topicCenter");
  const { ready: authReady, isLoggedIn } = useAuthLoggedIn();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const locale = pathname?.split("/").filter(Boolean)[0] ?? "zh-CN";
  const [pendingItemKey, setPendingItemKey] = React.useState<string | null>(null);

  const handleDiverge = React.useCallback(
    async (title: string, itemKey: string) => {
      const normalizedTitle = title.trim();
      if (!normalizedTitle || pendingItemKey) return;
      if (!authReady) return;
      if (!isLoggedIn) {
        window.dispatchEvent(new Event("media-auth-open-login"));
        return;
      }

      setPendingItemKey(itemKey);
      try {
        const threadId = await createThread({ metadata: {} });
        const now = new Date().toISOString();
        const optimisticTitle = "新对话";
        const optimisticThread = {
          thread_id: threadId,
          created_at: now,
          updated_at: now,
          metadata: {},
          values: optimisticTitle ? { title: optimisticTitle } : {},
        } as unknown as AgentThread;

        queryClient.setQueriesData(
          {
            queryKey: ["threads", "search"],
            exact: false,
          },
          (oldData: Array<AgentThread> | undefined) => {
            if (!oldData || oldData.length === 0) {
              return [optimisticThread];
            }
            const withoutCurrent = oldData.filter((x) => x.thread_id !== threadId);
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: `${tTopicCenter("actions.divergePromptPrefix")}${normalizedTitle}`,
        });
        router.push(`/${locale}/creation-center/${threadId}`);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : tTopicCenter("actions.divergeFailed");
        toast.error(message);
        setPendingItemKey(null);
      }
    },
    [authReady, isLoggedIn, locale, pendingItemKey, queryClient, router, tTopicCenter],
  );

  const hotRankQuery = useQuery({
    queryKey: ["hot-rank"],
    queryFn: fetchHotRank,
    staleTime: 5 * 60 * 1000,
  });

  const hotRankShowSkeleton =
    hotRankQuery.isPending && hotRankQuery.data == null;
  const hotRankShowGrid = hotRankQuery.data != null;

  return (
    <div className="flex min-h-full w-full flex-col">
      <div className="flex min-h-full flex-1 flex-col rounded-xl p-8 px-16">
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4">
          <div className="min-w-0 shrink-0">
            <div className="text-xl font-semibold tracking-tight">
              {t("topicCenter.hotRankBoardTitle")}
            </div>
          </div>
          <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
            {hotRankQuery.isError ? (
              <div
                className={cn(
                  "flex w-full justify-center p-8",
                  !hotRankShowGrid && "min-h-0 flex-1 items-center",
                )}
              >
                <PageEmptyState
                  title={tTopicCenter("hotRank.loadError")}
                  description={tTopicCenter("hotRank.loadErrorHint")}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => hotRankQuery.refetch()}
                  >
                    {tTopicCenter("hotRank.retry")}
                  </Button>
                </PageEmptyState>
              </div>
            ) : null}
            {hotRankShowSkeleton ? <HotTopicsSkeleton /> : null}
            {hotRankShowGrid ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {HOT_RANK_LIST_ORDER.map((listId) => {
                  const items = getHotRankItemsForList(
                    hotRankQuery.data,
                    listId,
                  );
                  const updatedAtTs = getHotRankUpdateTimeForList(
                    hotRankQuery.data,
                    listId,
                  );
                  return (
                    <HotListCard
                      key={listId}
                      listId={listId}
                      boardTitle={t(`topicCenter.hotRankBoards.${listId}`)}
                      items={items}
                      updatedAtTs={updatedAtTs}
                      appLocale={locale}
                      onDiverge={handleDiverge}
                      pendingItemKey={pendingItemKey}
                    />
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
