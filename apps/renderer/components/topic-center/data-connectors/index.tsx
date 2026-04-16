"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, PlugIcon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

import {
  createDataConnection,
  deleteDataConnection,
  listDataConnections,
  listDataConnectorProviders,
  listTopicCenterBoards,
  updateDataConnection,
  type DataConnectionListResponse,
  type DataConnectionResponse,
  type DataConnectorProviderDefinition,
  type TopicDataListItemResponse,
} from "@/lib/api/data-connectors";
import { getApiErrorMessage } from "@/lib/request";
import { stashPendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import { createThread } from "@/lib/langgraph-client";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { PageEmptyState } from "@/components/common/page-empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataConnectorBoardCard } from "./board-card";
import { BoardItemDetailSheet } from "./board-item-detail-sheet";
import { ConnectionConfigDialog } from "./connection-config-dialog";
import {
  CONNECTIONS_QUERY_KEY,
  PROVIDERS_QUERY_KEY,
} from "./constants";
import {
  CompactCenteredState,
  DataConnectorBoardsSkeleton,
  DataConnectorSectionSkeleton,
  ProviderListSkeleton,
} from "./skeletons";
import type {
  ConnectionDialogMode,
  ConnectionFormSubmitPayload,
} from "./types";
import {
  findProviderForConnection,
  getConnectionLogoSrc,
  getProviderLogoSrc,
  isZhixunbaoConnection,
} from "./utils";
import { ZhixunbaoBoardSetupDialog } from "./zhixunbao-board-setup-dialog";

export type TopicCenterDataConnectorsPanelProps = {
  toolbarAnchorEl?: HTMLElement | null;
};

export function TopicCenterDataConnectorsPanel({
  toolbarAnchorEl = null,
}: TopicCenterDataConnectorsPanelProps = {}) {
  const t = useTranslations("topicCenter");
  const appLocale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [settings] = useLocalSettings();
  const selectedPersonaId =
    typeof settings.context.persona_id === "string"
      ? settings.context.persona_id
      : null;
  const [createMenuOpen, setCreateMenuOpen] = React.useState(false);
  const [selectedProvider, setSelectedProvider] =
    React.useState<DataConnectorProviderDefinition | null>(null);
  const [dialogMode, setDialogMode] = React.useState<ConnectionDialogMode>("create");
  const [editingConnection, setEditingConnection] =
    React.useState<DataConnectionResponse | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
  const [savingConnection, setSavingConnection] = React.useState(false);
  const [pendingDeleteConnection, setPendingDeleteConnection] =
    React.useState<DataConnectionResponse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteDialogSnapshot, setDeleteDialogSnapshot] =
    React.useState<DataConnectionResponse | null>(null);
  const [deletingConnection, setDeletingConnection] = React.useState(false);
  const [boardSetupConnectionId, setBoardSetupConnectionId] = React.useState<
    string | null
  >(null);
  const [boardSetupConnection, setBoardSetupConnection] =
    React.useState<DataConnectionResponse | null>(null);
  const [boardSetupInitialKeys, setBoardSetupInitialKeys] = React.useState<string[]>(
    [],
  );
  const [detailBoardId, setDetailBoardId] = React.useState<string | null>(null);
  const [detailItem, setDetailItem] = React.useState<TopicDataListItemResponse | null>(
    null,
  );
  const [creatingFromDetail, setCreatingFromDetail] = React.useState(false);

  const connectionsQuery = useQuery({
    queryKey: CONNECTIONS_QUERY_KEY,
    queryFn: listDataConnections,
    staleTime: 60 * 1000,
  });

  const providersQuery = useQuery({
    queryKey: PROVIDERS_QUERY_KEY,
    queryFn: listDataConnectorProviders,
    staleTime: 5 * 60 * 1000,
    enabled: createMenuOpen || configDialogOpen || Boolean(boardSetupConnectionId),
  });

  const connections = React.useMemo(
    () => connectionsQuery.data?.items ?? [],
    [connectionsQuery.data?.items],
  );
  const boardCapableConnections = React.useMemo(
    () =>
      connections.filter((connection) =>
        isZhixunbaoConnection(connection.provider_key, connection.provider_name),
      ),
    [connections],
  );

  const boardsQuery = useQuery({
    queryKey: [
      "topic-center",
      "boards",
      boardCapableConnections.map((item) => item.id).sort().join(","),
    ],
    queryFn: async () => {
      const response = await listTopicCenterBoards();
      const idSet = new Set(boardCapableConnections.map((item) => item.id));
      return response.items.filter((board) => idSet.has(board.connection_id));
    },
    enabled: Boolean(boardCapableConnections.length > 0 && !boardSetupConnectionId),
    staleTime: 60 * 1000,
  });

  const handleOpenEditDialog = React.useCallback(
    async (connection: DataConnectionResponse) => {
      setDialogMode("edit");
      setEditingConnection(connection);

      try {
        const providersResponse = await queryClient.fetchQuery({
          queryKey: PROVIDERS_QUERY_KEY,
          queryFn: listDataConnectorProviders,
          staleTime: 5 * 60 * 1000,
        });
        const provider = findProviderForConnection(providersResponse.items, connection);

        if (!provider) {
          toast.error(t("dataConnectors.configDialog.providerNotFound"));
          return;
        }

        setSelectedProvider(provider);
        setConfigDialogOpen(true);
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, t("dataConnectors.providerDialog.loadError")),
        );
      }
    },
    [queryClient, t],
  );

  const handleOpenBoardSetupDialog = React.useCallback(
    (connection: DataConnectionResponse) => {
      const initialKeys = (connection.boards ?? [])
        .filter((board) => board.enabled !== false && Boolean(board.provider_board_key))
        .map((board) => board.provider_board_key!)
        .filter((key, index, list) => list.indexOf(key) === index);
      setBoardSetupConnection(connection);
      setBoardSetupInitialKeys(initialKeys);
      setBoardSetupConnectionId(connection.id);
    },
    [],
  );

  const handleSubmitConnection = React.useCallback(
    async (payload: ConnectionFormSubmitPayload) => {
      setSavingConnection(true);

      try {
        if (dialogMode === "edit" && editingConnection) {
          const updated = await updateDataConnection(editingConnection.id, {
            name: payload.name,
            enabled: payload.enabled,
            config: payload.config ?? {},
            secrets: payload.secrets ?? {},
            default_query: payload.default_query ?? editingConnection.default_query,
          });
          toast.success(t("dataConnectors.configDialog.updateSuccess"));

          queryClient.setQueryData<DataConnectionListResponse | undefined>(
            CONNECTIONS_QUERY_KEY,
            (previous) => {
              if (!previous) return previous;
              return {
                ...previous,
                items: previous.items.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              };
            },
          );
          void queryClient.invalidateQueries({ queryKey: ["topic-center", "boards"] });
        } else {
          const created = await createDataConnection({
            provider_key: payload.provider_key,
            name: payload.name,
            enabled: payload.enabled,
            config: payload.config,
            secrets: payload.secrets,
            default_query: payload.default_query,
          });
          toast.success(t("dataConnectors.configDialog.createSuccess"));

          queryClient.setQueryData<DataConnectionListResponse | undefined>(
            CONNECTIONS_QUERY_KEY,
            (previous) => {
              const items = previous?.items ?? [];
              const nextItems = [
                created,
                ...items.filter((item) => item.id !== created.id),
              ];
              return {
                items: nextItems,
                total: Math.max(previous?.total ?? 0, nextItems.length),
              };
            },
          );

          if (isZhixunbaoConnection(created.provider_key, created.provider_name)) {
            setBoardSetupInitialKeys([]);
            setBoardSetupConnectionId(created.id);
          } else {
            void queryClient.invalidateQueries({ queryKey: ["topic-center", "boards"] });
          }
        }

        setConfigDialogOpen(false);
        setSelectedProvider(null);
        setEditingConnection(null);
        setCreateMenuOpen(false);
        void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      } catch (error) {
        toast.error(
          getApiErrorMessage(
            error,
            dialogMode === "edit"
              ? t("dataConnectors.configDialog.updateFailed")
              : t("dataConnectors.configDialog.createFailed"),
          ),
        );
      } finally {
        setSavingConnection(false);
      }
    },
    [dialogMode, editingConnection, queryClient, t],
  );

  const handleDeleteConnection = React.useCallback(async () => {
    if (!pendingDeleteConnection) return;

    setDeletingConnection(true);
    try {
      await deleteDataConnection(pendingDeleteConnection.id);
      toast.success(t("dataConnectors.deleteDialog.success"));
      queryClient.setQueryData<DataConnectionListResponse | undefined>(
        CONNECTIONS_QUERY_KEY,
        (previous) => {
          if (!previous) return previous;
          const nextItems = previous.items.filter(
            (item) => item.id !== pendingDeleteConnection.id,
          );
          return {
            items: nextItems,
            total: nextItems.length,
          };
        },
      );
      setDeleteDialogOpen(false);
      setPendingDeleteConnection(null);
      setDeleteDialogSnapshot(null);

      if (editingConnection?.id === pendingDeleteConnection.id) {
        setConfigDialogOpen(false);
        setEditingConnection(null);
        setSelectedProvider(null);
      }

      if (boardSetupConnectionId === pendingDeleteConnection.id) {
        setBoardSetupConnectionId(null);
        setBoardSetupConnection(null);
        setBoardSetupInitialKeys([]);
      }

      void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["topic-center", "boards"] });
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("dataConnectors.deleteDialog.failed")));
    } finally {
      setDeletingConnection(false);
    }
  }, [boardSetupConnectionId, editingConnection?.id, pendingDeleteConnection, queryClient, t]);

  const dismissZhixunbaoBoardSetup = React.useCallback(() => {
    setBoardSetupConnectionId(null);
    setBoardSetupConnection(null);
    setBoardSetupInitialKeys([]);
    void queryClient.invalidateQueries({ queryKey: CONNECTIONS_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ["topic-center", "boards"] });
  }, [queryClient]);

  const closeDetailSheet = React.useCallback((open: boolean) => {
    if (open) return;
    setDetailBoardId(null);
    setDetailItem(null);
  }, []);

  const handleCreateFromDetail = React.useCallback(
    async (payload: {
      title: string;
      content_text: string;
      source_name: string;
      published_at: string;
      source_url: string;
      author: string;
      image_urls: string;
      cover_image_url: string;
    }) => {
      if (creatingFromDetail) return;
      setCreatingFromDetail(true);
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
            const withoutCurrent = oldData.filter(
              (thread) => thread.thread_id !== threadId,
            );
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: t("dataConnectors.board.createPrompt"),
          personaId: selectedPersonaId,
          additionalKwargs: {
            news_item: {
              ...payload,
              context_text: payload.content_text,
            },
          },
        });
        router.push(`/${appLocale}/creation-center/${threadId}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("actions.divergeFailed"),
        );
      } finally {
        setCreatingFromDetail(false);
      }
    },
    [appLocale, creatingFromDetail, queryClient, router, selectedPersonaId, t],
  );

  const showSectionSkeleton =
    connectionsQuery.isPending && connectionsQuery.data == null;

  const addConnectorMenu = (
    <DropdownMenu open={createMenuOpen} onOpenChange={setCreateMenuOpen}>
      <DropdownMenuTrigger
        render={
          <Button type="button" className="gap-2">
            <PlusIcon className="size-4" />
            {t("dataConnectors.create")}
            <ChevronDownIcon className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[220px] p-2">
        {connections.length > 0 ? (
          <>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
              {t("dataConnectors.connectedSectionTitle")}
            </div>
            {connections.map((connection) => (
              <DropdownMenuItem
                key={connection.id}
                className="flex items-center gap-2"
                onClick={() => {
                  if (
                    isZhixunbaoConnection(connection.provider_key, connection.provider_name)
                  ) {
                    handleOpenBoardSetupDialog(connection);
                    return;
                  }

                  void handleOpenEditDialog(connection);
                }}
              >
                <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                  {getConnectionLogoSrc(connection) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local static logo
                    <img
                      src={getConnectionLogoSrc(connection)!}
                      alt=""
                      className="size-full object-contain"
                      aria-hidden
                    />
                  ) : (
                    <PlugIcon className="size-3 text-muted-foreground" />
                  )}
                </div>
                <span className="truncate text-sm">{connection.name}</span>
              </DropdownMenuItem>
            ))}
            <div className="my-2 h-px bg-border" />
          </>
        ) : null}
        <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
          {t("dataConnectors.addConnectorSectionTitle")}
        </div>
        {providersQuery.isPending ? (
          <div className="px-2 py-2">
            <ProviderListSkeleton />
          </div>
        ) : providersQuery.isError ? (
          <div className="px-2 py-2 text-sm text-muted-foreground">
            {t("dataConnectors.providerDialog.loadError")}
          </div>
        ) : (
          (providersQuery.data?.items ?? []).map((provider) => (
            <DropdownMenuItem
              key={provider.key}
              className="flex items-center gap-2"
              onClick={() => {
                setDialogMode("create");
                setEditingConnection(null);
                setSelectedProvider(provider);
                setConfigDialogOpen(true);
              }}
            >
              <div className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">
                {getProviderLogoSrc(provider) ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local static logo
                  <img
                    src={getProviderLogoSrc(provider)!}
                    alt=""
                    className="size-full object-contain"
                    aria-hidden
                  />
                ) : (
                  <PlugIcon className="size-3 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 truncate text-sm font-medium">{provider.name}</div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const addConnectorPortal =
    toolbarAnchorEl != null ? createPortal(addConnectorMenu, toolbarAnchorEl) : null;
  const addConnectorInlineToolbar =
    toolbarAnchorEl == null && !showSectionSkeleton ? (
      <div className="flex flex-wrap items-center justify-end gap-3">
        {addConnectorMenu}
      </div>
    ) : null;

  return (
    <>
      <section className="flex min-h-full flex-1 flex-col gap-4">
        {addConnectorPortal}
        {showSectionSkeleton ? <DataConnectorSectionSkeleton /> : null}

        {!showSectionSkeleton ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {addConnectorInlineToolbar}

            {connectionsQuery.isError ? (
              <CompactCenteredState
                description={t("dataConnectors.loadErrorHint")}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void connectionsQuery.refetch()}
                  >
                    {t("dataConnectors.retry")}
                  </Button>
                }
              />
            ) : null}

            {!connectionsQuery.isError && connections.length === 0 ? (
              <div className="flex min-h-[calc(100vh-320px)] flex-1 items-center justify-center px-8">
                <PageEmptyState
                  title={t("dataConnectors.emptyTitle")}
                  description={t("dataConnectors.emptyDescription")}
                />
              </div>
            ) : null}

            {!connectionsQuery.isError &&
            connections.length > 0 &&
            boardCapableConnections.length === 0 ? (
              <CompactCenteredState
                title={t("dataConnectors.unsupportedTitle")}
                description={t("dataConnectors.unsupportedDescription")}
              />
            ) : null}

            {!connectionsQuery.isError &&
            connections.length > 0 &&
            boardCapableConnections.length > 0 &&
            boardsQuery.isError ? (
              <CompactCenteredState
                description={t("dataConnectors.loadErrorHint")}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void boardsQuery.refetch()}
                  >
                    {t("dataConnectors.retry")}
                  </Button>
                }
              />
            ) : null}

            {!connectionsQuery.isError &&
            connections.length > 0 &&
            boardCapableConnections.length > 0 &&
            boardsQuery.isLoading ? (
              <DataConnectorBoardsSkeleton />
            ) : null}

            {!connectionsQuery.isError &&
            connections.length > 0 &&
            boardCapableConnections.length > 0 &&
            !boardSetupConnectionId &&
            !boardsQuery.isPending &&
            !boardsQuery.isError &&
            (boardsQuery.data?.length ?? 0) === 0 ? (
              <div className="flex min-h-[calc(100vh-320px)] flex-1 items-center justify-center px-8">
                <PageEmptyState
                  title={t("dataConnectors.boardsEmptyTitle")}
                  description={t("dataConnectors.boardsEmptyDescription")}
                />
              </div>
            ) : null}

            {!connectionsQuery.isError &&
            connections.length > 0 &&
            boardCapableConnections.length > 0 &&
            !boardsQuery.isPending &&
            !boardsQuery.isError &&
            (boardsQuery.data?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {boardsQuery.data!.map((board) => (
                  <DataConnectorBoardCard
                    key={board.board_id}
                    board={board}
                    appLocale={appLocale}
                    t={t}
                    onPreviewItem={(boardId, item) => {
                      setDetailBoardId(boardId);
                      setDetailItem(item);
                    }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <ConnectionConfigDialog
        open={configDialogOpen}
        mode={dialogMode}
        provider={selectedProvider}
        connection={editingConnection}
        submitting={savingConnection}
        onOpenChange={(nextOpen) => {
          setConfigDialogOpen(nextOpen);
          if (!nextOpen) {
            setSelectedProvider(null);
            setEditingConnection(null);
          }
        }}
        onSubmit={handleSubmitConnection}
        t={t}
      />

      <ZhixunbaoBoardSetupDialog
        connection={boardSetupConnection}
        connectionId={boardSetupConnectionId}
        initialSelectedKeys={boardSetupInitialKeys}
        open={Boolean(boardSetupConnectionId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) dismissZhixunbaoBoardSetup();
        }}
        onRequestEdit={(connection) => {
          dismissZhixunbaoBoardSetup();
          void handleOpenEditDialog(connection);
        }}
        onRequestDelete={(connection) => {
          dismissZhixunbaoBoardSetup();
          setPendingDeleteConnection(connection);
          setDeleteDialogSnapshot(connection);
          setDeleteDialogOpen(true);
        }}
        onSyncSuccess={dismissZhixunbaoBoardSetup}
        t={t}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setPendingDeleteConnection(null);
            setDeleteDialogSnapshot(null);
          }
        }}
        onConfirm={handleDeleteConnection}
        closeLabel={t("dataConnectors.deleteDialog.close")}
        title={t("dataConnectors.deleteDialog.title")}
        description={t("dataConnectors.deleteDialog.description", {
          name: deleteDialogSnapshot?.name ?? "",
        })}
        cancelLabel={t("dataConnectors.deleteDialog.cancel")}
        confirmLabel={t("dataConnectors.deleteDialog.confirm")}
        isPending={deletingConnection}
      />

      <BoardItemDetailSheet
        open={Boolean(detailBoardId && detailItem)}
        boardId={detailBoardId}
        item={detailItem}
        onOpenChange={closeDetailSheet}
        onCreate={handleCreateFromDetail}
        creating={creatingFromDetail}
        t={t}
      />
    </>
  );
}
