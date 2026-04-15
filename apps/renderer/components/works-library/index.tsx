"use client";

import * as React from "react";
import { debounce } from "lodash";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { CircleAlertIcon, MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPageButton,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { getPlatformsWithNames } from "@/lib/platforms";
import type { PlatformId } from "@/components/account-management/types";
import { BulkBar } from "@/components/account-management/bulk-bar";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { PlatformLogo } from "@/components/account-management/platform-logo";
import type {
  PublishFailureLog,
  PublishStatus,
  PublishTriggerType,
  Work,
} from "./types";
import { PublishStatusBadge } from "./publish-status-badge";
import { WorkEmptyState } from "./work-empty-state";
import { WorksLibrarySkeleton } from "./works-library-skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";
import {
  deleteUserPublishRecordGroups,
  listUserPublishRecordGroups,
  type PublishRecordGroupResponse,
} from "@/lib/api/publish";
import { createPageList } from "@/lib/pagination";

const SUPPORTED_PLATFORM_IDS: PlatformId[] = [
  "toutiao",
  "rednote",
  "douyin",
  "wechat_mp",
  "wechat_channels",
  "zhixunbao",
  "zhihu",
  "csdn",
  "baijiahao",
];
const PAGE_SIZE = 20;

type PublishRecordsPageData = {
  items: Work[];
  total: number;
  page: number;
  pageSize: number;
};

function isPlatformId(value: string): value is PlatformId {
  return SUPPORTED_PLATFORM_IDS.includes(value as PlatformId);
}

function extractTitleFromGroup(group: PublishRecordGroupResponse): string {
  if (typeof group.title === "string" && group.title.trim().length > 0) {
    return group.title.trim();
  }
  for (const record of group.records) {
    const info = record.publish_info;
    if (!info || typeof info !== "object" || Array.isArray(info)) continue;
    const candidate =
      (info as Record<string, unknown>).title ??
      (info as Record<string, unknown>).post_title ??
      (info as Record<string, unknown>).article_title;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return group.thread_id;
}

function mapTriggerSourceToPublishType(triggerSource?: string): PublishTriggerType {
  if (triggerSource === "manual_api" || triggerSource === "scheduled_task") {
    return "manual";
  }
  if (triggerSource === "auto_tool") {
    return "dialog";
  }
  return "unknown";
}

function mapFailureLogs(group: PublishRecordGroupResponse): PublishFailureLog[] {
  return group.records
    .filter((item) => !item.success)
    .map((item) => ({
      accountId: item.account_id,
      platform: item.platform,
      reason:
        typeof item.error_message === "string" && item.error_message.trim().length > 0
          ? item.error_message.trim()
          : "",
    }));
}

function mapGroupToWork(group: PublishRecordGroupResponse): Work {
  const status: PublishStatus = group.failed_account_count > 0 ? "failed" : "success";
  const platformIds = Array.from(
    new Set(
      group.records
        .map((item) => item.platform)
        .filter((platform): platform is PlatformId => isPlatformId(platform)),
    ),
  );
  return {
    id: group.thread_id,
    title: extractTitleFromGroup(group),
    platformIds,
    createdAt: formatDateTime(group.last_published_at || group.created_at),
    publishType: mapTriggerSourceToPublishType(group.records[0]?.trigger_source),
    status,
    successCount: group.success_account_count,
    failedCount: group.failed_account_count,
    failedLogs: mapFailureLogs(group),
  };
}

/** 固定宽度 + 省略；仅在被截断时悬停显示全文 */
function WorksLibraryTitleCell({ title }: { title: string }) {
  const textRef = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);

  const remeasure = React.useCallback(() => {
    const el = textRef.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);

  React.useLayoutEffect(() => {
    remeasure();
    const el = textRef.current;
    if (!el) return;
    const ro = new ResizeObserver(remeasure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [title, remeasure]);

  const label = (
    <span
      ref={textRef}
      className="block min-w-0 truncate text-sm text-foreground"
    >
      {title}
    </span>
  );

  if (!truncated) {
    return <div className="min-w-0 max-w-full">{label}</div>;
  }

  return (
    <Tooltip>
      <TooltipTrigger
        className="min-w-0 max-w-full"
        render={
          <div className="min-w-0 max-w-full cursor-default outline-none">
            {label}
          </div>
        }
      />
      <TooltipContent side="top" className="max-w-md">
        <p className="whitespace-pre-wrap break-words text-left">{title}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function WorksLibrary() {
  const t = useTranslations("worksLibrary");
  const queryClient = useQueryClient();

  const platforms = React.useMemo(
    () => getPlatformsWithNames((id) => t(`platforms.${id}`)),
    [t],
  );

  const [page, setPage] = React.useState(1);
  const [queryInput, setQueryInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<PlatformId | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<PublishStatus | "all">("all");

  const updateQuery = React.useMemo(() => debounce((next: string) => setQuery(next), 300), []);
  React.useEffect(() => () => updateQuery.cancel(), [updateQuery]);

  React.useEffect(() => {
    setPage(1);
  }, [query, platformFilter, statusFilter]);

  const publishRecordsQuery = useQuery<PublishRecordsPageData>({
    queryKey: ["works-library", "publish-records", page, PAGE_SIZE] as QueryKey,
    queryFn: async () => {
      const res = await listUserPublishRecordGroups({
        page,
        pageSize: PAGE_SIZE,
      });
      return {
        items: res.items.map(mapGroupToWork),
        total: res.total,
        page: res.page,
        pageSize: res.page_size,
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  React.useEffect(() => {
    if (!hasLoadedOnce && publishRecordsQuery.isFetched) {
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce, publishRecordsQuery.isFetched]);
  const isInitialLoading = !hasLoadedOnce && publishRecordsQuery.isLoading;
  const [hiddenWorkIds, setHiddenWorkIds] = React.useState<Set<string>>(() => new Set());
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [pendingFailureLogWork, setPendingFailureLogWork] = React.useState<Work | null>(null);
  const [pendingBatchDeleteOpen, setPendingBatchDeleteOpen] = React.useState(false);
  const deletePublishRecordsMutation = useMutation({
    mutationFn: async (threadIds: string[]) => {
      return deleteUserPublishRecordGroups({ threadIds });
    },
  });

  const works = React.useMemo(() => {
    const list = publishRecordsQuery.data?.items ?? [];
    if (hiddenWorkIds.size === 0) return list;
    return list.filter((item) => !hiddenWorkIds.has(item.id));
  }, [hiddenWorkIds, publishRecordsQuery.data]);

  const listMeta = publishRecordsQuery.data;
  const totalCount = listMeta?.total ?? 0;
  const pageSize = listMeta?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showPagination = !isInitialLoading && totalCount > 0;
  const pageItems = React.useMemo(
    () => createPageList(page, totalPages),
    [page, totalPages],
  );

  React.useEffect(() => {
    if (!listMeta) return;
    if (page > totalPages) setPage(totalPages);
  }, [listMeta, page, totalPages]);

  const filteredWorks = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter((w) => {
      const passQuery = !q || w.title.toLowerCase().includes(q);
      const passPlatform =
        platformFilter === "all" ||
        w.platformIds.some((pid) => pid === platformFilter);
      const passStatus = statusFilter === "all" || w.status === statusFilter;
      return passQuery && passPlatform && passStatus;
    });
  }, [works, query, platformFilter, statusFilter]);

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    setSelectedIds((prev) => {
      const allowed = new Set(filteredWorks.map((w) => w.id));
      const next = new Set<string>();
      for (const id of prev) if (allowed.has(id)) next.add(id);
      return next;
    });
  }, [filteredWorks]);

  const allSelected = filteredWorks.length > 0 && selectedIds.size === filteredWorks.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  function toggleOne(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (next) n.add(id);
      else n.delete(id);
      return n;
    });
  }

  function toggleAll(next: boolean) {
    setSelectedIds(next ? new Set(filteredWorks.map((w) => w.id)) : new Set());
  }

  function deleteSelected() {
    const threadIds = Array.from(selectedIds);
    if (threadIds.length === 0) return;

    deletePublishRecordsMutation.mutate(threadIds, {
      onSuccess: () => {
        setHiddenWorkIds(new Set());
        setSelectedIds(new Set());
        setPendingBatchDeleteOpen(false);
        void queryClient.invalidateQueries({
          queryKey: ["works-library", "publish-records"],
        });
      },
      onError: (error) => {
        // 保持弹窗打开，方便用户重试；同时在控制台给出错误细节
        console.error("Failed to delete publish records:", error);
      },
    });
  }

  function deleteOne(id: string) {
    deletePublishRecordsMutation.mutate([id], {
      onSuccess: () => {
        setHiddenWorkIds(new Set());
        setSelectedIds(new Set());
        setPendingDeleteId(null);
        void queryClient.invalidateQueries({
          queryKey: ["works-library", "publish-records"],
        });
      },
      onError: (error) => {
        console.error("Failed to delete publish record:", error);
      },
    });
  }

  const platformMap = React.useMemo(
    () => new Map(platforms.map((p) => [p.id, p])),
    [platforms],
  );
  const activePlatform = platformFilter === "all" ? null : platformMap.get(platformFilter);

  return (
    <div className="w-full h-full">
      <div className="h-full w-full max-w-[92rem] mx-auto rounded-xl p-8 px-10 flex flex-col">
        <div className="flex flex-1 min-h-0 flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl font-semibold tracking-tight">
                {t("title")}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("description")}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                value={queryInput}
                onChange={(e) => {
                  const next = e.target.value;
                  setQueryInput(next);
                  updateQuery(next);
                }}
                placeholder={t("search.placeholder")}
                aria-label={t("search.ariaLabel")}
              />
            </div>

            <Select
              value={platformFilter}
              onValueChange={(v) => setPlatformFilter(v as PlatformId | "all")}
            >
              <SelectTrigger className="gap-1.5" size="default">
                <span className="text-muted-foreground">
                  {t("filters.platform")}
                </span>
                <span className="inline-flex items-center gap-2 font-medium">
                  {activePlatform ? (
                    <PlatformLogo platformId={activePlatform.id} size={20} />
                  ) : null}
                  <span>
                    {activePlatform ? activePlatform.name : t("filters.all")}
                  </span>
                </span>
                <SelectValue className="sr-only" />
              </SelectTrigger>
              <SelectContent align="end" className="w-56">
                <SelectGroup>
                  <SelectLabel>{t("filters.platform")}</SelectLabel>
                  <SelectItem value="all">
                    <span className="inline-flex items-center gap-2">
                      <span className="grid size-5 place-items-center rounded-md bg-muted text-[10px] font-semibold text-foreground/70 ring-1 ring-border">
                        {t("filters.allShort")}
                      </span>
                      {t("filters.all")}
                    </span>
                  </SelectItem>
                  {platforms.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="inline-flex items-center gap-2">
                        <PlatformLogo platformId={p.id} size={20} />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) =>
                setStatusFilter(v as PublishStatus | "all")
              }
            >
              <SelectTrigger className="gap-1.5" size="default">
                <span className="text-muted-foreground">
                  {t("filters.status")}
                </span>
                <span className="font-medium">
                  {statusFilter === "all"
                    ? t("filters.all")
                    : statusFilter === "success"
                      ? t("status.success")
                      : statusFilter === "failed"
                        ? t("status.failed")
                        : t("status.publishing")}
                </span>
                <SelectValue className="sr-only" />
              </SelectTrigger>
              <SelectContent align="end" className="w-44">
                <SelectGroup>
                  <SelectLabel>{t("filters.status")}</SelectLabel>
                  <SelectItem value="all">{t("filters.all")}</SelectItem>
                  <SelectItem value="success">{t("status.success")}</SelectItem>
                  <SelectItem value="failed">{t("status.failed")}</SelectItem>
                  <SelectItem value="publishing">
                    {t("status.publishing")}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {isInitialLoading ? (
            <WorksLibrarySkeleton />
          ) : (
            <div className="flex-1 min-h-0 rounded-xl border border-border flex flex-col overflow-hidden">
              <BulkBar
                selectedCount={selectedIds.size}
                onDeleteSelected={() => setPendingBatchDeleteOpen(true)}
                selectedCountLabel={t("bulk.selectedCount", { count: selectedIds.size })}
                batchDeleteLabel={t("actions.batchDelete")}
                showMoveToGroup={false}
              />
              <div className="flex min-h-0 flex-1 flex-col">
              {filteredWorks.length > 0 ? (
                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                  <Table bodyScroll className="min-w-[1020px] table-fixed">
                    <TableHeader
                      className={cn(
                        "[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0",
                        selectedIds.size > 0 ? "[&_tr]:bg-background" : "[&_tr]:bg-muted/40",
                      )}
                    >
                      <TableRow
                        className={
                          selectedIds.size > 0 ? "hover:bg-background" : "hover:bg-muted/40"
                        }
                      >
                        <TableHead className="w-12 shrink-0 px-4">
                          <Checkbox
                            aria-label={t("table.selectAll")}
                            checked={allSelected}
                            indeterminate={someSelected}
                            onCheckedChange={(v) => toggleAll(Boolean(v))}
                          />
                        </TableHead>
                        <TableHead className="w-96 max-w-96 min-w-0">
                          {t("table.title")}
                        </TableHead>
                        <TableHead className="w-44 min-w-44 max-w-44">
                          {t("table.platform")}
                        </TableHead>
                        <TableHead className="w-[8.5rem] max-w-[8.5rem]">
                          {t("table.createdAt")}
                        </TableHead>
                        <TableHead className="w-[7rem] max-w-[7rem]">
                          {t("table.publishType")}
                        </TableHead>
                        <TableHead className="w-[6.75rem] max-w-[6.75rem]">
                          {t("table.status")}
                        </TableHead>
                        <TableHead className="w-14 max-w-14 text-center">
                          {t("table.successFail")}
                        </TableHead>
                        <TableHead className="w-12 text-right">
                          <span className="sr-only">{t("table.actions")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWorks.map((w) => {
                        const checked = selectedIds.has(w.id);
                        return (
                          <TableRow key={w.id} className="hover:bg-muted/30">
                            <TableCell className="w-12 shrink-0 px-4">
                              <Checkbox
                                aria-label={t("table.selectOne")}
                                checked={checked}
                                onCheckedChange={(v) => toggleOne(w.id, Boolean(v))}
                              />
                            </TableCell>
                            <TableCell className="w-96 max-w-96 min-w-0">
                              <WorksLibraryTitleCell title={w.title} />
                            </TableCell>
                            <TableCell className="w-44 min-w-44 max-w-44">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {w.platformIds.length > 0 ? (
                                  w.platformIds.map((pid) => {
                                    const platform = platformMap.get(pid);
                                    return platform ? (
                                      <PlatformLogo
                                        key={pid}
                                        platformId={platform.id}
                                        size={28}
                                      />
                                    ) : null;
                                  })
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="w-[8.5rem] max-w-[8.5rem] text-sm tabular-nums text-foreground">
                              {w.createdAt}
                            </TableCell>
                            <TableCell className="w-[7rem] max-w-[7rem] text-sm text-foreground">
                              {w.publishType === "manual"
                                ? t("publishType.manual")
                                : w.publishType === "dialog"
                                  ? t("publishType.dialog")
                                  : t("publishType.unknown")}
                            </TableCell>
                            <TableCell className="w-[6.75rem] max-w-[6.75rem] min-w-0">
                              <PublishStatusBadge
                                className="w-full"
                                status={w.status}
                                successLabel={t("status.success")}
                                failedLabel={t("status.failed")}
                                publishingLabel={t("status.publishing")}
                              />
                            </TableCell>
                            <TableCell className="w-14 max-w-14 text-center text-sm tabular-nums text-foreground">
                              {w.successCount} / {w.failedCount}
                            </TableCell>
                            <TableCell className="w-12 text-right">
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    render={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        aria-label={t("table.actions")}
                                      >
                                        <MoreHorizontalIcon className="size-4" />
                                      </Button>
                                    }
                                  />
                                  <DropdownMenuContent align="end" className="w-36">
                                    {w.status === "failed" ? (
                                      <DropdownMenuItem
                                        onClick={() => setPendingFailureLogWork(w)}
                                      >
                                        <CircleAlertIcon className="size-4" />
                                        {t("actions.failureLog")}
                                      </DropdownMenuItem>
                                    ) : null}
                                    <DropdownMenuItem
                                      variant="destructive"
                                      onClick={() => setPendingDeleteId(w.id)}
                                    >
                                      <Trash2Icon className="size-4" />
                                      {t("actions.delete")}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex min-h-[200px] flex-1 items-center justify-center p-8">
                  <WorkEmptyState
                    title={t("emptyTitle")}
                    description={t("emptyDescription")}
                  />
                </div>
              )}
              {showPagination ? (
                <div className="shrink-0 border-t border-border bg-muted/20 px-3 py-2">
                  <Pagination
                    aria-label={t("pagination.navLabel")}
                    className="justify-between gap-3 sm:justify-between"
                  >
                    <div className="order-last w-full text-center text-xs text-muted-foreground sm:order-first sm:w-auto sm:text-left">
                      {t("pagination.summary", {
                        total: totalCount,
                        pageSize,
                      })}
                    </div>
                    <PaginationContent className="order-first sm:order-last">
                      <PaginationItem>
                        <PaginationPrevious
                          aria-label={t("pagination.previous")}
                          disabled={page <= 1 || publishRecordsQuery.isFetching}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                        />
                      </PaginationItem>
                      {pageItems.map((item, idx) =>
                        item === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis
                              screenReaderLabel={t("pagination.ellipsis")}
                            />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={item}>
                            <PaginationPageButton
                              isActive={item === page}
                              aria-label={t("pagination.goToPage", { page: item })}
                              disabled={publishRecordsQuery.isFetching}
                              onClick={() => setPage(item)}
                            >
                              {item}
                            </PaginationPageButton>
                          </PaginationItem>
                        ),
                      )}
                      <PaginationItem>
                        <PaginationNext
                          aria-label={t("pagination.next")}
                          disabled={
                            page >= totalPages || publishRecordsQuery.isFetching
                          }
                          onClick={() =>
                            setPage((p) => Math.min(totalPages, p + 1))
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              ) : null}
              </div>
            </div>
          )}
        </div>

        <DeleteConfirmDialog
          open={pendingDeleteId !== null}
          onOpenChange={(open) => !open && setPendingDeleteId(null)}
          onConfirm={() => {
            if (pendingDeleteId) {
              deleteOne(pendingDeleteId);
            }
          }}
          closeLabel={t("dialog.close")}
          title={t("actions.delete")}
          description={t("actions.deleteWorkConfirm")}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.confirm")}
          isPending={deletePublishRecordsMutation.isPending}
        />

        <Dialog
          open={pendingFailureLogWork !== null}
          onOpenChange={(open) => {
            if (!open) setPendingFailureLogWork(null);
          }}
        >
          <DialogContent
            className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden sm:max-w-lg"
            closeLabel={t("dialog.close")}
          >
            {pendingFailureLogWork ? (
              <>
                <DialogHeader className="shrink-0">
                  <DialogTitle>{t("failureLogDialog.title")}</DialogTitle>
                </DialogHeader>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {t("failureLogDialog.summary", {
                    failed: pendingFailureLogWork.failedCount,
                    total: pendingFailureLogWork.successCount + pendingFailureLogWork.failedCount,
                  })}
                </p>
                <div className="mt-4 min-h-0 max-h-[min(52vh,28rem)] flex-1 overflow-y-auto overscroll-y-contain pr-1">
                  <ul className="space-y-2">
                    {pendingFailureLogWork.failedLogs.map((log, index) => {
                      const platformLabel = isPlatformId(log.platform)
                        ? (platformMap.get(log.platform)?.name ?? log.platform)
                        : log.platform;
                      return (
                        <li
                          key={`${log.accountId}-${index}`}
                          className="rounded-lg border border-destructive/35 bg-destructive/5 px-3 py-2.5 text-sm"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {log.accountId}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {platformLabel}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-destructive">
                            {t("failureLogDialog.failedTag")}
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {log.reason || t("failureLogDialog.emptyReason")}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                  {pendingFailureLogWork.failedLogs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t("failureLogDialog.empty")}
                    </p>
                  ) : null}
                </div>
                <DialogFooter className="mt-4 shrink-0 border-t border-border pt-4 sm:justify-end">
                  <Button type="button" onClick={() => setPendingFailureLogWork(null)}>
                    {t("failureLogDialog.confirm")}
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        <DeleteConfirmDialog
          open={pendingBatchDeleteOpen}
          onOpenChange={setPendingBatchDeleteOpen}
          onConfirm={() => {
            deleteSelected();
          }}
          closeLabel={t("dialog.close")}
          title={t("actions.batchDelete")}
          description={t("actions.batchDeleteConfirm", { count: selectedIds.size })}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.confirm")}
          isPending={deletePublishRecordsMutation.isPending}
        />
      </div>
    </div>
  );
}
