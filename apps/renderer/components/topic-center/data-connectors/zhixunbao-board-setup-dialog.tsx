"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import {
  discoverDataConnectionBoards,
  syncDataConnectionBoards,
  type DataConnectionBoardCandidate,
  type DataConnectionResponse,
} from "@/lib/api/data-connectors";
import { getApiErrorMessage } from "@/lib/request";
import { cn } from "@/lib/utils";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { discoverBoardsQueryKey } from "./constants";
import { BoardIcon } from "./board-icon";
import { BoardDiscoverListSkeleton } from "./skeletons";
import type { TopicCenterTranslator } from "./types";

export type ZhixunbaoBoardSetupDialogProps = {
  connection: DataConnectionResponse | null;
  connectionId: string | null;
  initialSelectedKeys: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestEdit: (connection: DataConnectionResponse) => void;
  onRequestDelete: (connection: DataConnectionResponse) => void;
  onSyncSuccess: () => void;
  t: TopicCenterTranslator;
};

export function ZhixunbaoBoardSetupDialog({
  connection,
  connectionId,
  initialSelectedKeys,
  open,
  onOpenChange,
  onRequestEdit,
  onRequestDelete,
  onSyncSuccess,
  t,
}: ZhixunbaoBoardSetupDialogProps) {
  const queryClient = useQueryClient();
  const discoverQuery = useQuery({
    queryKey: connectionId
      ? discoverBoardsQueryKey(connectionId)
      : ["topic-center", "data-connection-discover-boards", "none"],
    queryFn: () => discoverDataConnectionBoards(connectionId!),
    enabled: Boolean(open && connectionId),
    staleTime: 60 * 1000,
  });

  const items = discoverQuery.data?.items ?? [];
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const selectionInitRef = React.useRef<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    if (!open || !connectionId) {
      selectionInitRef.current = null;
      setSelectedKeys(new Set());
      return;
    }

    const list = discoverQuery.data?.items;
    if (!list) return;

    const signature = `${connectionId}:${list
      .map((item) => item.provider_board_key)
      .join(",")}:${initialSelectedKeys.join(",")}`;
    if (selectionInitRef.current === signature) return;

    selectionInitRef.current = signature;
    const availableKeySet = new Set(list.map((item) => item.provider_board_key));
    const nextSelected = initialSelectedKeys.filter((key) =>
      availableKeySet.has(key),
    );
    setSelectedKeys(new Set(nextSelected));
  }, [connectionId, discoverQuery.data, initialSelectedKeys, open]);

  const toggleKey = React.useCallback((key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleConfirm = React.useCallback(async () => {
    if (!connectionId) return;

    if (selectedKeys.size === 0) {
      toast.error(t("dataConnectors.boardSetupDialog.selectAtLeastOne"));
      return;
    }

    setSyncing(true);
    try {
      await syncDataConnectionBoards(connectionId, {
        provider_board_keys: Array.from(selectedKeys),
      });
      toast.success(t("dataConnectors.boardSetupDialog.syncSuccess"));
      void queryClient.invalidateQueries({
        queryKey: discoverBoardsQueryKey(connectionId),
      });
      onSyncSuccess();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, t("dataConnectors.boardSetupDialog.syncFailed")),
      );
    } finally {
      setSyncing(false);
    }
  }, [connectionId, onSyncSuccess, queryClient, selectedKeys, t]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (syncing) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent
        className="flex max-h-[min(95vh,860px)] max-w-[min(88vw,600px)] flex-col gap-0 p-0"
        closeLabel={t("dataConnectors.boardSetupDialog.close")}
      >
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-6 py-4">
          <DialogTitle>{t("dataConnectors.boardSetupDialog.title")}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {t("dataConnectors.boardSetupDialog.sectionMyTopics")}
          </h3>

          {discoverQuery.isPending && discoverQuery.data == null ? (
            <BoardDiscoverListSkeleton />
          ) : null}

          {discoverQuery.isError && discoverQuery.data == null ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
              <p className="text-center text-sm text-muted-foreground">
                {t("dataConnectors.boardSetupDialog.loadError")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void discoverQuery.refetch()}
              >
                {t("dataConnectors.retry")}
              </Button>
            </div>
          ) : null}

          {!discoverQuery.isPending &&
          !discoverQuery.isError &&
          items.length === 0 ? (
            <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
              {t("dataConnectors.boardSetupDialog.empty")}
            </div>
          ) : null}

          {!discoverQuery.isPending && !discoverQuery.isError && items.length > 0 ? (
            <ul className="max-h-[min(56vh,420px)] -mr-6 space-y-3 overflow-y-auto pr-6">
              {items.map((item: DataConnectionBoardCandidate) => {
                const selected = selectedKeys.has(item.provider_board_key);

                return (
                  <li key={item.provider_board_key}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleKey(item.provider_board_key)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleKey(item.provider_board_key);
                        }
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/30",
                      )}
                    >
                      <BoardIcon
                        iconUrl={item.icon_url}
                        name={item.name}
                        className="size-11 rounded-lg bg-muted/50"
                        imageClassName="object-contain"
                        textClassName="text-base"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm leading-6 font-semibold text-foreground">
                          {item.name}
                        </div>
                        {item.description ? (
                          <p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className="shrink-0 pt-0.5"
                        onClick={(event) => event.stopPropagation()}
                        onPointerDown={(event) => event.stopPropagation()}
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={(checked) => {
                            setSelectedKeys((prev) => {
                              const next = new Set(prev);
                              if (checked) next.add(item.provider_board_key);
                              else next.delete(item.provider_board_key);
                              return next;
                            });
                          }}
                          aria-label={item.name}
                        />
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <DialogFooter className="mt-0 shrink-0 border-t border-border px-6 py-5">
          {connection ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mr-auto gap-1.5 text-muted-foreground"
                    disabled={syncing}
                  >
                    <MoreHorizontalIcon className="size-4" />
                    {t("dataConnectors.configDialog.moreActions")}
                  </Button>
                }
              />
              <DropdownMenuContent align="start" sideOffset={6}>
                <DropdownMenuItem onClick={() => onRequestEdit(connection)}>
                  {t("dataConnectors.configDialog.editAction")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRequestDelete(connection)}
                >
                  {t("dataConnectors.configDialog.deleteAction")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          <Button
            type="button"
            variant="outline"
            disabled={syncing}
            onClick={() => onOpenChange(false)}
          >
            {t("dataConnectors.boardSetupDialog.cancel")}
          </Button>
          <Button
            type="button"
            disabled={
              syncing ||
              discoverQuery.isPending ||
              discoverQuery.isError ||
              items.length === 0 ||
              selectedKeys.size === 0
            }
            onClick={() => void handleConfirm()}
          >
            {syncing
              ? t("dataConnectors.boardSetupDialog.submitting")
              : t("dataConnectors.boardSetupDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
