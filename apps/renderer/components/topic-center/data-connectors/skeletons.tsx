"use client";

import * as React from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import {
  BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS,
  BOARD_CARD_VISIBLE_ROWS,
} from "./constants";

function BoardCardSkeletonGrid({ prefix }: { prefix: string }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`${prefix}-${index}`}
          className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/60">
              <Skeleton className="size-full rounded-md" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="h-6 min-w-0 max-w-[min(100%,14rem)] flex-1 rounded-md" />
                <Skeleton className="h-4 w-14 shrink-0 rounded-md" />
              </div>
              <Skeleton className="mt-1 h-3 w-4/5 max-w-[min(100%,18rem)] rounded-md" />
            </div>
          </div>
          <div
            className={cn(
              "border-t border-border px-4 py-3",
              "publish-preview-scrollbar-none overflow-y-auto",
              BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS,
            )}
          >
            <ul className="space-y-1">
              {Array.from({ length: BOARD_CARD_VISIBLE_ROWS }).map(
                (_, itemIndex) => (
                  <li
                    key={`${prefix}-item-${index}-${itemIndex}`}
                    className="flex h-8 shrink-0 items-center gap-2"
                  >
                    <Skeleton className="h-4 min-w-0 flex-1 rounded-md" />
                    <Skeleton className="h-3 w-11 shrink-0 rounded-md" />
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataConnectorSectionSkeleton() {
  return <BoardCardSkeletonGrid prefix="connector-board-skeleton" />;
}

export function DataConnectorBoardsSkeleton() {
  return <BoardCardSkeletonGrid prefix="data-connector-board-panel-skeleton" />;
}

export function CompactCenteredState({
  title,
  description,
  action,
}: {
  title?: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-320px)] flex-1 items-center justify-center">
      <div className="flex max-w-xl flex-col items-center gap-4 text-center">
        {title ? (
          <div className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </div>
        ) : null}
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
        {action}
      </div>
    </div>
  );
}

export function ProviderListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-3 h-4 w-12 rounded-md" aria-hidden />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`provider-skeleton-${index}`}
            className="rounded-xl border border-border p-4"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="mt-2 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardItemsSkeleton() {
  return (
    <div
      className={cn(
        "publish-preview-scrollbar-none overflow-y-auto",
        BOARD_CARD_LIST_BODY_MAX_HEIGHT_CLASS,
      )}
    >
      <ul className="space-y-1">
        {Array.from({ length: BOARD_CARD_VISIBLE_ROWS }).map((_, index) => (
          <li
            key={`board-item-skeleton-${index}`}
            className="flex h-8 shrink-0 items-center gap-2"
          >
            <Skeleton className="h-4 min-w-0 flex-1 rounded-md" />
            <Skeleton className="h-3 w-11 shrink-0 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BoardDiscoverListSkeleton() {
  return (
    <ul className="max-h-[min(56vh,420px)] -mr-6 space-y-3 overflow-y-auto pr-6">
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={`board-discover-skeleton-${index}`}>
          <div className="flex cursor-default items-center gap-3 rounded-xl border border-border p-4 text-left">
            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50">
              <Skeleton className="size-7 rounded-md" />
            </div>
            <div className="min-w-0 flex-1">
              <Skeleton className="h-6 max-w-[min(100%,20rem)] rounded-md" />
              <Skeleton className="mt-1 h-3 w-full max-w-[min(100%,28rem)] rounded-md" />
            </div>
            <span className="shrink-0 pt-0.5">
              <Skeleton className="size-4 shrink-0 rounded-[4px]" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
