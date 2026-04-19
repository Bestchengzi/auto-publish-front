"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { formatRelativeTimeFromNow } from "@/lib/date";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import { createThread } from "@/lib/langgraph-client";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { PageEmptyState } from "@/components/common/page-empty-state";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const HOT_LIST_MAX_ITEMS = 10;
const HOT_LIST_BODY_HEIGHT_CLASS =
  "h-[calc(10*2rem+9*0.25rem+1.5rem)]";

function HotTopicsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {HOT_RANK_LIST_ORDER.map((id) => (
        <div
          key={id}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <Skeleton className="size-9 shrink-0 rounded-md" />
            <Skeleton className="h-4 min-w-0 flex-1" />
            <Skeleton className="h-4 w-24 shrink-0 rounded-sm" />
          </div>
          <Separator />
          <div
            className={cn(
              "space-y-1 overflow-hidden px-4 py-3",
              HOT_LIST_BODY_HEIGHT_CLASS,
            )}
          >
            {Array.from({ length: HOT_LIST_MAX_ITEMS }).map((_, index) => (
              <div
                key={`${id}-sk-${index}`}
                className="flex h-8 shrink-0 items-center gap-2"
              >
                <Skeleton className="h-4 w-5 shrink-0 rounded-sm" aria-hidden />
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
  return (
    <div className="flex min-w-0 flex-1" title={text}>
      {href != null ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={titleLinkClass}
        >
          {text}
        </a>
      ) : (
        <span className={titleTextClass}>{text}</span>
      )}
    </div>
  );
}

function useUpdateAgoTick(epochTs: number | null, appLocale: string) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (epochTs == null) return;
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(id);
  }, [epochTs]);

  if (epochTs == null) return null;
  return formatRelativeTimeFromNow(epochTs, appLocale);
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
        <div className="flex size-9 shrink-0 items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- hot rank logo asset */}
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
          <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
            {boardTitle}
          </h3>
          {updatedLabel ? (
            <span
              className="shrink-0 whitespace-nowrap text-sm tabular-nums text-muted-foreground"
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
          "flex min-h-0 flex-col overflow-hidden px-4 py-3",
          HOT_LIST_BODY_HEIGHT_CLASS,
        )}
      >
        {displayItems.length === 0 ? (
          <div className="min-h-0 flex flex-1 items-center justify-center px-1 text-center text-base text-muted-foreground">
            {t("hotRank.empty")}
          </div>
        ) : (
          <ul className="w-full space-y-1 overflow-hidden">
            {displayItems.map((item, index) => {
              const rank = index + 1;
              const itemKey = `${listId}-${index}`;
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
                  key={`${listId}-${index}`}
                  className="group relative -mx-2 flex h-8 shrink-0 items-center gap-2 rounded-md px-2 text-base transition-colors hover:bg-muted/60"
                >
                  <span
                    className={cn("w-5 shrink-0 text-center tabular-nums", rankColorClass)}
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
                      "disabled:opacity-100 transition-opacity",
                      !hasPending &&
                        "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100",
                      isPending && "pointer-events-auto opacity-100",
                      hasPending &&
                        !isPending &&
                        "pointer-events-none opacity-0 disabled:opacity-0",
                    )}
                    aria-label={t("actions.secondaryCreation")}
                    onClick={async (event) => {
                      event.preventDefault();
                      event.stopPropagation();
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

export function TopicCenterHotRankPanel() {
  const t = useTranslations();
  const tTopicCenter = useTranslations("topicCenter");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [settings] = useLocalSettings();
  const [pendingItemKey, setPendingItemKey] = React.useState<string | null>(null);
  const selectedPersonaId =
    typeof settings.context.persona_id === "string"
      ? settings.context.persona_id
      : null;

  const handleDiverge = React.useCallback(
    async (title: string, itemKey: string) => {
      const normalizedTitle = title.trim();
      if (!normalizedTitle || pendingItemKey) return;

      setPendingItemKey(itemKey);
      try {
        const threadId = await createThread({ metadata: {} });
        const now = new Date().toISOString();
        const optimisticTitle = tTopicCenter("actions.newConversationTitle");
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

            const withoutCurrent = oldData.filter(
              (thread) => thread.thread_id !== threadId,
            );
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: `${tTopicCenter("actions.divergePromptPrefix")}${normalizedTitle}`,
          personaId: selectedPersonaId,
        });
        router.push(`/${locale}/creation-center/${threadId}`);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : tTopicCenter("actions.divergeFailed");
        toast.error(message);
        setPendingItemKey(null);
      }
    },
    [locale, pendingItemKey, queryClient, router, selectedPersonaId, tTopicCenter],
  );

  const hotRankQuery = useQuery({
    queryKey: ["hot-rank"],
    queryFn: fetchHotRank,
    staleTime: 5 * 60 * 1000,
  });

  const hotRankShowSkeleton = hotRankQuery.isPending && hotRankQuery.data == null;
  const hotRankShowGrid = hotRankQuery.data != null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-3">
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HOT_RANK_LIST_ORDER.map((listId) => {
            const items = getHotRankItemsForList(hotRankQuery.data, listId);
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
  );
}
