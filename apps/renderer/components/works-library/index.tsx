"use client";

import * as React from "react";
import { debounce } from "lodash";
import {
  VideoIcon,
  ImageIcon,
  FileTextIcon,
  PencilIcon,
  MoreHorizontalIcon,
  Trash2Icon,
  ListIcon,
  FilePen,
} from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import { getPlatformsWithNames } from "@/lib/platforms";
import type { PlatformId } from "@/components/account-management/types";
import { BulkBar } from "@/components/account-management/bulk-bar";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { PlatformLogo } from "@/components/account-management/platform-logo";
import type { Work, WorkType, PublishStatus } from "./types";
import { PublishStatusBadge } from "./publish-status-badge";
import { WorkEmptyState } from "./work-empty-state";
import { cn } from "@/lib/utils";

const MOCK_WORKS: Work[] = [
  {
    id: "w_1",
    title: "春游vlog · 杭州西湖",
    type: "video",
    platformIds: ["rednote", "douyin"],
    createdAt: "2025-03-15 14:32",
    status: "success",
    successCount: 2,
    failedCount: 0,
    isDraft: false,
  },
  {
    id: "w_2",
    title: "AI 绘画入门教程",
    type: "image",
    platformIds: ["rednote", "toutiao", "wechat_mp"],
    createdAt: "2025-03-14 09:20",
    status: "publishing",
    successCount: 1,
    failedCount: 0,
    isDraft: false,
  },
  {
    id: "w_3",
    title: "产品使用说明文档",
    type: "text",
    platformIds: ["wechat_mp", "toutiao"],
    createdAt: "2025-03-13 16:45",
    status: "failed",
    successCount: 1,
    failedCount: 1,
    isDraft: false,
  },
  {
    id: "w_4",
    title: "未完成的视频脚本",
    type: "video",
    platformIds: [],
    createdAt: "2025-03-18 10:00",
    status: "publishing",
    successCount: 0,
    failedCount: 0,
    isDraft: true,
  },
];

function WorkTypeIcon({ type }: { type: WorkType }) {
  const config = {
    video: { Icon: VideoIcon, label: "video" },
    image: { Icon: ImageIcon, label: "image" },
    text: { Icon: FileTextIcon, label: "text" },
  };
  const { Icon } = config[type];
  return (
    <span
      className="grid size-7 place-items-center rounded-md bg-muted text-muted-foreground ring-1 ring-border"
      aria-hidden
    >
      <Icon className="size-4" />
    </span>
  );
}

export function WorksLibrary() {
  const t = useTranslations("worksLibrary");

  const platforms = React.useMemo(
    () => getPlatformsWithNames((id) => t(`platforms.${id}`)),
    [t],
  );

  const [tab, setTab] = React.useState<"works" | "drafts">("works");
  const [queryInput, setQueryInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [platformFilter, setPlatformFilter] = React.useState<PlatformId | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<PublishStatus | "all">("all");

  const updateQuery = React.useMemo(() => debounce((next: string) => setQuery(next), 300), []);
  React.useEffect(() => () => updateQuery.cancel(), [updateQuery]);

  const [works, setWorks] = React.useState<Work[]>(() => MOCK_WORKS);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null);
  const [pendingBatchDeleteOpen, setPendingBatchDeleteOpen] = React.useState(false);

  const filteredWorks = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return works.filter((w) => {
      const isDraft = w.isDraft;
      const passTab = tab === "drafts" ? isDraft : !isDraft;
      const passQuery = !q || w.title.toLowerCase().includes(q);
      const passPlatform =
        platformFilter === "all" ||
        w.platformIds.some((pid) => pid === platformFilter);
      const passStatus = statusFilter === "all" || w.status === statusFilter;
      return passTab && passQuery && passPlatform && passStatus;
    });
  }, [works, tab, query, platformFilter, statusFilter]);

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
    setWorks((prev) => prev.filter((w) => !selectedIds.has(w.id)));
    setSelectedIds(new Set());
  }

  function deleteOne(id: string) {
    setWorks((prev) => prev.filter((w) => w.id !== id));
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  }

  const platformMap = React.useMemo(
    () => new Map(platforms.map((p) => [p.id, p])),
    [platforms],
  );
  const activePlatform = platformFilter === "all" ? null : platformMap.get(platformFilter);

  return (
    <div className="w-full h-full">
      <div className="h-full w-full max-w-6xl mx-auto rounded-xl p-8 px-10 flex flex-col">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "works" | "drafts")}
          className="flex flex-1 min-h-0 flex-col gap-4"
        >
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
            <TabsList className="rounded-lg border border-border p-1">
              <TabsTrigger value="works" className="gap-1.5">
                <ListIcon className="size-4" />
                {t("tabs.works")}
              </TabsTrigger>
              <TabsTrigger value="drafts" className="gap-1.5">
                <FilePen className="size-4" />
                {t("tabs.drafts")}
              </TabsTrigger>
            </TabsList>

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

          <div className="flex-1 min-h-0 rounded-xl border border-border flex flex-col overflow-hidden">
            <BulkBar
              selectedCount={selectedIds.size}
              onDeleteSelected={() => setPendingBatchDeleteOpen(true)}
              selectedCountLabel={t("bulk.selectedCount", { count: selectedIds.size })}
              batchDeleteLabel={t("actions.batchDelete")}
              showMoveToGroup={false}
            />
            {filteredWorks.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-auto">
                <Table className="min-w-[860px]">
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
                      <TableHead className="w-12">
                        <Checkbox
                          aria-label={t("table.selectAll")}
                          checked={allSelected}
                          indeterminate={someSelected}
                          onCheckedChange={(v) => toggleAll(Boolean(v))}
                        />
                      </TableHead>
                      <TableHead>{t("table.title")}</TableHead>
                      <TableHead>{t("table.type")}</TableHead>
                      <TableHead>{t("table.platform")}</TableHead>
                      <TableHead>{t("table.createdAt")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.successFail")}</TableHead>
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
                        <TableCell className="w-12">
                          <Checkbox
                            aria-label={t("table.selectOne")}
                            checked={checked}
                            onCheckedChange={(v) => toggleOne(w.id, Boolean(v))}
                          />
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-foreground">
                            {w.title}
                          </span>
                        </TableCell>
                        <TableCell>
                          <WorkTypeIcon type={w.type} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
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
                        <TableCell className="text-sm text-foreground">
                          {w.createdAt}
                        </TableCell>
                        <TableCell>
                          <PublishStatusBadge
                            status={w.status}
                            successLabel={t("status.success")}
                            failedLabel={t("status.failed")}
                            publishingLabel={t("status.publishing")}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
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
                                <DropdownMenuItem onClick={() => {}}>
                                  <PencilIcon className="size-4" />
                                  {t("actions.edit")}
                                </DropdownMenuItem>
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
          </div>
        </Tabs>

        <DeleteConfirmDialog
          open={pendingDeleteId !== null}
          onOpenChange={(open) => !open && setPendingDeleteId(null)}
          onConfirm={() => {
            if (pendingDeleteId) {
              deleteOne(pendingDeleteId);
              setPendingDeleteId(null);
            }
          }}
          closeLabel={t("dialog.close")}
          title={t("actions.delete")}
          description={t("actions.deleteWorkConfirm")}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.confirm")}
        />

        <DeleteConfirmDialog
          open={pendingBatchDeleteOpen}
          onOpenChange={setPendingBatchDeleteOpen}
          onConfirm={() => {
            deleteSelected();
            setPendingBatchDeleteOpen(false);
          }}
          closeLabel={t("dialog.close")}
          title={t("actions.batchDelete")}
          description={t("actions.batchDeleteConfirm", { count: selectedIds.size })}
          cancelLabel={t("dialog.cancel")}
          confirmLabel={t("dialog.confirm")}
        />
      </div>
    </div>
  );
}
