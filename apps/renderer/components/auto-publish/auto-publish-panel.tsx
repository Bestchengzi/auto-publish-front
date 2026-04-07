"use client";

import * as React from "react";
import { debounce } from "lodash";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import {
  MoreHorizontalIcon,
  PencilIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { PageEmptyState } from "@/components/common/page-empty-state";
import { AutoPublishSkeleton } from "@/components/auto-publish/auto-publish-skeleton";
import { ScheduledTaskDialog } from "@/components/auto-publish/scheduled-task-dialog";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/date";
import { getApiErrorMessage } from "@/lib/request";
import {
  deleteScheduledPublishTask,
  listScheduledPublishTasks,
  runScheduledPublishTaskNow,
  updateScheduledPublishTask,
  type ScheduledPublishLastRunStatus,
  type ScheduledPublishTaskResponse,
  type ScheduledPublishTaskUpdateBody,
} from "@/lib/api/scheduled-publish";

function taskRowToUpdateBody(
  row: ScheduledPublishTaskResponse,
  overrides: Partial<ScheduledPublishTaskUpdateBody> = {},
): ScheduledPublishTaskUpdateBody {
  return {
    name: row.name,
    prompt: row.prompt,
    model_name: row.model_name,
    schedule_enabled: row.schedule_enabled,
    jitter_minutes: row.jitter_minutes,
    persona_id: row.persona_id,
    image_source: row.image_source,
    timezone: row.timezone,
    schedule_text: row.schedule_text?.trim() || row.schedule?.expression || "",
    publish_targets: row.publish_targets,
    ...overrides,
  };
}

function PromptCell({ text }: { text: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth + 1);
  }, []);
  React.useLayoutEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, measure]);
  const span = (
    <span ref={ref} className="block min-w-0 truncate text-sm text-foreground">
      {text}
    </span>
  );
  if (!truncated) return <div className="min-w-0 max-w-full">{span}</div>;
  return (
    <Tooltip>
      <TooltipTrigger
        className="min-w-0 max-w-full"
        render={
          <div className="min-w-0 max-w-full cursor-default outline-none">
            {span}
          </div>
        }
      />
      <TooltipContent side="top" className="max-w-md">
        <p className="whitespace-pre-wrap break-words text-left">{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function AutoPublishPanel() {
  const t = useTranslations("autoPublish");
  const queryClient = useQueryClient();
  const [queryInput, setQueryInput] = React.useState("");
  const [query, setQuery] = React.useState("");
  const updateQuery = React.useMemo(
    () => debounce((v: string) => setQuery(v), 300),
    [],
  );
  React.useEffect(() => () => updateQuery.cancel(), [updateQuery]);

  const tasksQuery = useQuery({
    queryKey: ["auto-publish", "tasks"] as QueryKey,
    queryFn: () => listScheduledPublishTasks(),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  React.useEffect(() => {
    if (!hasLoadedOnce && tasksQuery.isFetched) {
      setHasLoadedOnce(true);
    }
  }, [hasLoadedOnce, tasksQuery.isFetched]);

  const isInitialLoading = !hasLoadedOnce && tasksQuery.isLoading;

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [dialogMode, setDialogMode] = React.useState<"create" | "edit">(
    "create",
  );
  const [editingTask, setEditingTask] =
    React.useState<ScheduledPublishTaskResponse | null>(null);
  const [pendingRunNow, setPendingRunNow] =
    React.useState<ScheduledPublishTaskResponse | null>(null);
  const [pendingDelete, setPendingDelete] =
    React.useState<ScheduledPublishTaskResponse | null>(null);

  const runNowMutation = useMutation({
    mutationFn: runScheduledPublishTaskNow,
    onSuccess: () => {
      toast.success(t("toast.runNowSuccess"));
      void queryClient.invalidateQueries({
        queryKey: ["auto-publish", "tasks"],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t("toast.runNowFailed"))),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScheduledPublishTask,
    onSuccess: () => {
      toast.success(t("toast.deleteSuccess"));
      setPendingDelete(null);
      void queryClient.invalidateQueries({
        queryKey: ["auto-publish", "tasks"],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t("toast.deleteFailed"))),
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ScheduledPublishTaskUpdateBody;
    }) => updateScheduledPublishTask(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["auto-publish", "tasks"],
      });
    },
    onError: (e) => toast.error(getApiErrorMessage(e, t("toast.saveFailed"))),
  });

  const filtered = React.useMemo(() => {
    const items = tasksQuery.data?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => x.name.toLowerCase().includes(q));
  }, [tasksQuery.data, query]);

  function statusLabel(s: ScheduledPublishLastRunStatus | null): string {
    if (!s) return "—";
    const key = `runStatus.${s}` as const;
    return t(key);
  }

  function lastRunStatusClassName(
    s: ScheduledPublishLastRunStatus | null,
  ): string {
    if (!s) return "text-muted-foreground";
    switch (s) {
      case "success":
        return "font-medium text-emerald-600 dark:text-emerald-400";
      case "failed":
        return "font-medium text-destructive";
      case "partial_success":
        return "font-medium text-amber-600 dark:text-amber-400";
      case "running":
        return "font-medium text-sky-600 dark:text-sky-400";
      case "queued":
        return "font-medium text-amber-600 dark:text-amber-400";
      default:
        return "text-muted-foreground";
    }
  }

  return (
    <>
      <div className="flex h-full w-full min-h-0 flex-col">
        <div className="mx-auto flex h-full w-full max-w-7xl min-h-0 flex-col px-8 py-8">
          <div className="flex flex-1 min-h-0 flex-col gap-4">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                {t("title")}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("description")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 w-full sm:flex-1 sm:max-w-xs lg:max-w-xs">
                <Input
                  value={queryInput}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQueryInput(v);
                    updateQuery(v);
                  }}
                  placeholder={t("search.placeholder")}
                  aria-label={t("search.ariaLabel")}
                  className="h-9 w-full"
                />
              </div>
              <Button
                type="button"
                className="h-9 w-full shrink-0 sm:ml-auto sm:w-auto"
                onClick={() => {
                  setDialogMode("create");
                  setEditingTask(null);
                  setDialogOpen(true);
                }}
              >
                {t("newTask")}
              </Button>
            </div>

            <div className="min-h-0 flex-1 rounded-xl border border-border flex flex-col overflow-hidden">
              {isInitialLoading ? (
                <AutoPublishSkeleton />
              ) : filtered.length === 0 ? (
                <div className="flex min-h-[200px] flex-1 flex-col items-center justify-center p-8">
                  <PageEmptyState
                    title={t("empty.title")}
                    description={t("empty.hint")}
                  />
                </div>
              ) : (
                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
                  <Table bodyScroll className="min-w-[800px] table-fixed">
                    <TableHeader
                      className={cn(
                        "[&_tr]:border-border [&_th]:h-[47px] [&_th]:py-0 [&_tr]:py-0",
                        "[&_tr]:bg-muted/40",
                      )}
                    >
                      <TableRow className="hover:bg-muted/40">
                        <TableHead className="w-44 min-w-0 pl-4">
                          {t("table.name")}
                        </TableHead>
                        <TableHead className="min-w-0">
                          {t("table.prompt")}
                        </TableHead>
                        <TableHead className="w-54 shrink-0">
                          {t("table.cron")}
                        </TableHead>
                        <TableHead className="w-30 shrink-0">
                          {t("table.lastRun")}
                        </TableHead>
                        <TableHead className="w-28 shrink-0 text-center">
                          {t("table.lastStatus")}
                        </TableHead>
                        <TableHead className="w-28 shrink-0 text-center">
                          {t("table.enabled")}
                        </TableHead>
                        <TableHead className="w-12 shrink-0 text-right">
                          <span className="sr-only">{t("table.actions")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="w-44 min-w-0 pl-4">
                            <div className="truncate text-sm font-medium">
                              {row.name}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-0 max-w-0">
                            <PromptCell text={row.prompt} />
                          </TableCell>
                          <TableCell className="w-54 shrink-0 font-mono text-xs">
                            <PromptCell
                              text={row.schedule_text?.trim() || "—"}
                            />
                          </TableCell>
                          <TableCell className="w-30 shrink-0 text-sm tabular-nums">
                            {row.last_run_at
                              ? formatDateTime(row.last_run_at)
                              : "—"}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "w-28 shrink-0 text-center text-sm",
                              lastRunStatusClassName(row.last_run_status),
                            )}
                          >
                            {statusLabel(row.last_run_status)}
                          </TableCell>
                          <TableCell className="w-28 shrink-0 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={row.schedule_enabled}
                                disabled={
                                  toggleScheduleMutation.isPending &&
                                  toggleScheduleMutation.variables?.id ===
                                    row.id
                                }
                                aria-label={t("table.toggleScheduleAria", {
                                  name: row.name,
                                })}
                                onCheckedChange={(checked) => {
                                  toggleScheduleMutation.mutate({
                                    id: row.id,
                                    body: taskRowToUpdateBody(row, {
                                      schedule_enabled: checked,
                                    }),
                                  });
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="w-12 shrink-0 text-right">
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
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setDialogMode("edit");
                                    setEditingTask(row);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <PencilIcon className="size-4" />
                                  {t("actions.edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setPendingRunNow(row)}
                                  disabled={runNowMutation.isPending}
                                >
                                  <PlayIcon className="size-4" />
                                  {t("actions.runNow")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setPendingDelete(row)}
                                >
                                  <Trash2Icon className="size-4" />
                                  {t("actions.delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScheduledTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        task={dialogMode === "edit" ? editingTask : null}
      />

      <DeleteConfirmDialog
        open={pendingRunNow != null}
        onOpenChange={(o) => !o && setPendingRunNow(null)}
        title={t("runNowDialog.title")}
        description={t("runNowDialog.description", {
          name: pendingRunNow?.name ?? "",
        })}
        closeLabel={t("runNowDialog.close")}
        cancelLabel={t("runNowDialog.cancel")}
        confirmLabel={t("runNowDialog.confirm")}
        isPending={runNowMutation.isPending}
        onConfirm={async () => {
          if (!pendingRunNow) return;
          await runNowMutation.mutateAsync(pendingRunNow.id);
          setPendingRunNow(null);
        }}
      />

      <DeleteConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description", {
          name: pendingDelete?.name ?? "",
        })}
        closeLabel={t("deleteDialog.close")}
        cancelLabel={t("deleteDialog.cancel")}
        confirmLabel={t("deleteDialog.confirm")}
        isPending={deleteMutation.isPending}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteMutation.mutateAsync(pendingDelete.id);
        }}
      />
    </>
  );
}
