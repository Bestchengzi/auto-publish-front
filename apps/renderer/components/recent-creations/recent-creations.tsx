"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  useDeleteThread,
  useRenameThread,
  useThreads,
} from "@/lib/langgraph/core/threads/hooks";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";

export function RecentCreations({
  locale,
  limit,
}: {
  locale: string;
  limit?: number;
}) {
  const t = useTranslations("sidebar.items");
  const pathname = usePathname();
  const router = useRouter();
  const { data, isLoading, isFetching } = useThreads({
    ...(typeof limit === "number" ? { limit } : {}),
    sortBy: "updated_at",
    sortOrder: "desc",
    select: ["thread_id", "updated_at", "values"],
  });

  const threads = useMemo(() => data ?? [], [data]);
  const renameThread = useRenameThread();
  const deleteThread = useDeleteThread();

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const activePath = pathname ?? "";

  useEffect(() => {
    if (!hasLoadedOnce && data !== undefined && !isLoading) {
      setHasLoadedOnce(true);
    }
  }, [data, hasLoadedOnce, isLoading]);

  function openRename(threadId: string, currentTitle: string) {
    setActiveThreadId(threadId);
    setTitleDraft(currentTitle);
    setRenameOpen(true);
  }

  function openDelete(threadId: string) {
    setActiveThreadId(threadId);
    setDeleteOpen(true);
  }

  async function submitRename() {
    const threadId = activeThreadId;
    const nextTitle = titleDraft.trim();
    if (!threadId || !nextTitle) return;
    await renameThread.mutateAsync({ threadId, title: nextTitle });
    setRenameOpen(false);
  }

  async function submitDelete() {
    const threadId = activeThreadId;
    if (!threadId) return;
    const deletingActiveThread = activePath === `/${locale}/creation-center/${threadId}`;
    await deleteThread.mutateAsync({ threadId });
    setDeleteOpen(false);
    if (deletingActiveThread) {
      router.push(`/${locale}/creation-center/new`);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="px-2 text-xs font-medium text-muted-foreground/70">
          {t("recentCreations")}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto -mr-3 pr-0">
        {!hasLoadedOnce && isLoading ? (
          <div className="space-y-1 px-2">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={idx}
                className="flex h-8 items-center rounded-md px-2"
              >
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : isFetching && threads.length === 0 ? (
          <div className="rounded-md bg-muted/20 px-2 py-2 text-xs text-muted-foreground">
            {t("emptyRecentCreations")}
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-md bg-muted/20 px-2 py-2 text-xs text-muted-foreground">
            {t("emptyRecentCreations")}
          </div>
        ) : (
          <div className="space-y-1">
            {threads.map((thread) => {
              const values = (thread.values ?? {}) as Record<string, unknown>;
              const title =
                typeof values.title === "string"
                  ? values.title.trim()
                  : values.title?.toString().trim() ?? "";
              const safeTitle = title || "Untitled";
              const threadPath = `/${locale}/creation-center/${thread.thread_id}`;
              const isActive = activePath === threadPath;

              return (
                <div
                  key={thread.thread_id}
                  className={cn(
                    "group flex items-center rounded-md py-1 pl-2 pr-3 text-sm",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-foreground/80 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Link
                    href={threadPath}
                    prefetch
                    className="min-w-0 flex-1"
                  >
                    <span className="block truncate">{safeTitle}</span>
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      aria-label={t("threadActions")}
                      className={cn(
                        buttonVariants({ variant: "ghost", size: "icon-xs" }),
                        "ml-1 transition-opacity",
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <MoreHorizontalIcon className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" side="top" sideOffset={6}>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.preventDefault();
                          openRename(thread.thread_id, safeTitle);
                        }}
                      >
                        <PencilIcon className="size-4" />
                        {t("renameThread")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          openDelete(thread.thread_id);
                        }}
                      >
                        <Trash2Icon className="size-4" />
                        {t("deleteThread")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog
        open={renameOpen}
        onOpenChange={(open) => {
          setRenameOpen(open);
          if (!open) setActiveThreadId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("renameThread")}</DialogTitle>
            <DialogDescription>{t("renameThreadDesc")}</DialogDescription>
          </DialogHeader>
          <Input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitRename();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameOpen(false)}
              disabled={renameThread.isPending}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={() => void submitRename()}
              disabled={renameThread.isPending || !titleDraft.trim()}
            >
              {renameThread.isPending ? t("saving") : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setActiveThreadId(null);
        }}
        onConfirm={submitDelete}
        closeLabel={t("cancel")}
        title={t("deleteThread")}
        description={t("deleteThreadDesc")}
        cancelLabel={t("cancel")}
        confirmLabel={deleteThread.isPending ? t("deleting") : t("confirmDelete")}
        isPending={deleteThread.isPending}
      />
    </div>
  );
}

