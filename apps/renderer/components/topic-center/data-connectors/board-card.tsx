"use client";

import * as React from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

import type {
  TopicBoardResponse,
  TopicDataListItemResponse,
} from "@/lib/api/data-connectors";
import { listTopicCenterBoardItems } from "@/lib/api/data-connectors";
import { formatRelativeTimeFromNow } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useInfiniteScrollAnchor } from "@/hooks/use-infinite-scroll-anchor";
import { Button } from "@/components/ui/button";

import { BoardIcon } from "./board-icon";
import {
  BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS,
  BOARD_ITEMS_PAGE_SIZE,
} from "./constants";
import { BoardItemsSkeleton } from "./skeletons";
import type { TopicCenterTranslator } from "./types";

const titleTextClass =
  "min-w-0 flex-1 truncate text-base leading-normal text-foreground/90";
const titleLinkClass = cn(
  titleTextClass,
  "hover:text-primary hover:underline underline-offset-2",
);

function BoardItemTitle({ text, href }: { text: string; href: string | null }) {
  return (
    <div className="flex min-w-0 flex-1" title={text}>
      {href != null ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={titleLinkClass}
          onClick={(event) => event.stopPropagation()}
        >
          {text}
        </a>
      ) : (
        <span className={titleTextClass}>{text}</span>
      )}
    </div>
  );
}

export function DataConnectorBoardCard({
  board,
  appLocale,
  t,
  onPreviewItem,
}: {
  board: TopicBoardResponse;
  appLocale: string;
  t: TopicCenterTranslator;
  onPreviewItem: (boardId: string, item: TopicDataListItemResponse) => void;
}) {
  const listScrollRef = React.useRef<HTMLDivElement | null>(null);
  const itemsQuery = useInfiniteQuery({
    queryKey: ["topic-center", "board-items", board.board_id, BOARD_ITEMS_PAGE_SIZE],
    queryFn: ({ pageParam }) =>
      listTopicCenterBoardItems(board.board_id, {
        page: pageParam,
        size: BOARD_ITEMS_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loadedCount = allPages.reduce(
        (sum, page) => sum + page.items.length,
        0,
      );
      if (loadedCount >= lastPage.total) return undefined;
      return (lastPage.page ?? allPages.length) + 1;
    },
    staleTime: 60 * 1000,
  });

  const items = React.useMemo(
    () => itemsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [itemsQuery.data?.pages],
  );
  const hasNextPage = Boolean(itemsQuery.hasNextPage);
  const loadMoreAnchorRef = useInfiniteScrollAnchor<HTMLDivElement>({
    canLoadMore: hasNextPage,
    disabled: itemsQuery.isFetchingNextPage,
    onLoadMore: () => {
      void itemsQuery.fetchNextPage();
    },
    rootRef: listScrollRef,
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3 px-4 py-3">
        <BoardIcon
          iconUrl={board.icon_url}
          name={board.title}
          className="size-9 rounded-md bg-muted/60"
          imageClassName="object-cover"
          textClassName="text-sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="min-w-0 flex-1 truncate text-base font-semibold text-foreground">
              {board.title}
            </h3>
            <span className="shrink-0 text-sm text-muted-foreground">
              {t("dataConnectors.board.updateCount", {
                count: board.badge_count ?? 0,
              })}
            </span>
          </div>
          {board.description ? (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {board.description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border px-4 py-3">
        {itemsQuery.isPending && itemsQuery.data == null ? (
          <BoardItemsSkeleton />
        ) : null}

        {itemsQuery.isError && itemsQuery.data == null ? (
          <div className="flex min-h-[192px] flex-col items-center justify-center gap-3 text-center">
            <div className="text-sm text-muted-foreground">
              {t("dataConnectors.board.loadError")}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void itemsQuery.refetch()}
            >
              {t("dataConnectors.retry")}
            </Button>
          </div>
        ) : null}

        {!itemsQuery.isPending && !itemsQuery.isError && items.length === 0 ? (
          <div className="flex min-h-[192px] items-center justify-center text-sm text-muted-foreground">
            {t("dataConnectors.board.empty")}
          </div>
        ) : null}

        {!itemsQuery.isPending && !itemsQuery.isError && items.length > 0 ? (
          <div
            ref={listScrollRef}
            className={cn(
              "publish-preview-scrollbar-none overflow-y-auto",
              BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS,
            )}
          >
            <ul className="w-full space-y-1 overflow-hidden">
              {items.map((item) => {
                return (
                  <li
                    key={item.item_id}
                    className="-mx-2 flex h-8 shrink-0 cursor-pointer items-center gap-2 rounded-md px-2 text-base transition-colors hover:bg-muted/60"
                    onClick={() => onPreviewItem(board.board_id, item)}
                  >
                    <div className="min-w-0 flex-1">
                      <BoardItemTitle
                        text={item.title}
                        href={item.content_url ?? null}
                      />
                    </div>
                    <div
                      className={cn(
                        "relative flex shrink-0 items-center justify-end",
                        !item.published_at && "min-w-[4.25rem]",
                      )}
                    >
                      {item.published_at ? (
                        <span
                          className="text-xs tabular-nums text-muted-foreground"
                          aria-hidden
                        >
                          {formatRelativeTimeFromNow(item.published_at, appLocale)}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            {hasNextPage ? (
              <div ref={loadMoreAnchorRef} className="flex justify-center pt-1 pb-0.5">
                {itemsQuery.isFetchingNextPage ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-primary">
                    <Loader2Icon className="size-3.5 animate-spin" />
                    {t("dataConnectors.loading")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("dataConnectors.loadMoreHint")}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
