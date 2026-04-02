"use client";

import * as React from "react";
import {
  PlusIcon,
  SettingsIcon,
  Trash2Icon,
  LayoutGridIcon,
  Rows3Icon,
  MoreHorizontalIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getPlatformsWithNames } from "@/lib/platforms";
import type { PlatformId, Account } from "./types";
import { formatFollowers } from "./utils";
import { EditAccountDrawer } from "./edit-account-drawer";
import { Avatar } from "./avatar";
import { PlatformLogo } from "./platform-logo";
import { StatusPill } from "./status-pill";
import { GroupSidebar } from "./group-sidebar";
import { BulkBar } from "./bulk-bar";
import { GroupSettingsDialog } from "./group-settings-dialog";
import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import { AddAccountDialog } from "./add-account-dialog";
import { AccountEmptyState } from "./account-empty-state";
import { AccountManagementSkeleton } from "./account-management-skeleton";
import { useAccountFilterState, useAccountFilters } from "./use-account-filters";
import { useAccountSelection } from "./use-account-selection";
import { useAccountManagementData } from "./use-account-management-data";
import { useAccountManagementActions } from "./use-account-management-actions";
import { usePlatformAuthSync } from "./use-platform-auth-sync";
import { cn } from "@/lib/utils";

export function AccountManagement() {
  const t = useTranslations();

  const platforms = React.useMemo(
    () => getPlatformsWithNames((id) => t(`account.platforms.${id}`)),
    [t],
  );

  const [groupSettingsOpen, setGroupSettingsOpen] = React.useState(false);
  const [addAccountOpen, setAddAccountOpen] = React.useState(false);
  const [editingAccountId, setEditingAccountId] = React.useState<string | null>(
    null,
  );
  const [editingGroupIds, setEditingGroupIds] = React.useState<string[]>([]);
  const [pendingDeleteAccountId, setPendingDeleteAccountId] = React.useState<
    string | null
  >(null);
  const [pendingBatchDeleteOpen, setPendingBatchDeleteOpen] =
    React.useState(false);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [editingGroupId, setEditingGroupId] = React.useState<string | null>(
    null,
  );
  const [editingGroupName, setEditingGroupName] = React.useState("");

  const [view, setView] = React.useState<"table" | "card">("table");

  const {
    query,
    queryInput,
    setQueryInput,
    updateQuery,
    platformFilter,
    setPlatformFilter,
    statusFilter,
    setStatusFilter,
    groupFilter,
    setGroupFilter,
  } = useAccountFilterState();

  const {
    groups,
    groupCounts,
    accounts,
    isInitialLoading,
    fetchGroups,
    refreshData,
    setGroups,
  } = useAccountManagementData({
    t,
    groupFilter,
    platformFilter,
    statusFilter,
  });

  const { filteredAccounts } = useAccountFilters(accounts, query);

  const editableGroups = groups.filter(
    (g) => g.id !== "all" && g.id !== "ungrouped",
  );

  usePlatformAuthSync({ t, refreshData });

  const {
    selectedIds,
    setSelectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
  } = useAccountSelection(filteredAccounts);
  const {
    createGroup,
    startRename,
    saveRename,
    cancelRename,
    deleteGroup,
    moveSelectedToGroup,
    deleteSelected,
    openEditDrawer,
    saveEditAccount,
    deleteOne,
  } = useAccountManagementActions({
    t,
    selectedIds,
    setSelectedIds,
    editingAccountId,
    setEditingAccountId,
    editingGroupIds,
    setEditingGroupIds,
    newGroupName,
    setNewGroupName,
    editingGroupId,
    setEditingGroupId,
    editingGroupName,
    setEditingGroupName,
    setGroups,
    refreshData,
    fetchGroups,
  });

  const platformMap = React.useMemo(() => {
    const map = new Map(platforms.map((p) => [p.id, p]));
    return map;
  }, [platforms]);

  const activePlatform =
    platformFilter === "all"
      ? null
      : platformMap.get(platformFilter as PlatformId);
  const activeEditingAccount = React.useMemo(
    () =>
      editingAccountId
        ? (accounts.find((a) => a.id === editingAccountId) ?? null)
        : null,
    [accounts, editingAccountId],
  );
  const activeEditingPlatform = React.useMemo(
    () =>
      activeEditingAccount
        ? (platformMap.get(activeEditingAccount.platformId) ?? null)
        : null,
    [activeEditingAccount, platformMap],
  );
  const groupNameMap = React.useMemo(
    () => new Map(groups.map((g) => [g.id, g.name])),
    [groups],
  );
  const getAccountGroupName = React.useCallback(
    (account: Account) =>
      account.groupIds.length === 0
        ? "--"
        : account.groupIds
            .map((gid) => groupNameMap.get(gid) ?? gid)
            .filter(Boolean)
            .join(", "),
    [groupNameMap],
  );

  return (
    <div className="w-full h-full">
      <div className="h-full rounded-xl p-8 px-16 flex flex-col">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "table" | "card")}
          className="flex flex-1 min-h-0 flex-col gap-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xl font-semibold tracking-tight">
                {t("account.title")}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t("account.description")}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <div className="w-full sm:w-64">
                <Input
                  value={queryInput}
                  onChange={(e) => {
                    const next = e.target.value;
                    setQueryInput(next);
                    updateQuery(next);
                  }}
                  placeholder={t("account.search.placeholder")}
                  aria-label={t("account.search.ariaLabel")}
                />
              </div>
              <Select
                value={platformFilter}
                onValueChange={(v) =>
                  setPlatformFilter(v as PlatformId | "all")
                }
              >
                <SelectTrigger className="gap-1.5" size="default">
                  <span className="text-muted-foreground">
                    {t("account.filters.platform")}
                  </span>
                  <span className="inline-flex items-center gap-2 font-medium">
                    {activePlatform ? (
                      <PlatformLogo platformId={activePlatform.id} size={20} />
                    ) : null}
                    <span>
                      {activePlatform
                        ? activePlatform.name
                        : t("account.filters.all")}
                    </span>
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="end" className="w-56">
                  <SelectGroup>
                    <SelectLabel>{t("account.filters.platform")}</SelectLabel>
                    <SelectItem value="all">
                      <span className="inline-flex items-center gap-2">
                        <span className="grid size-5 place-items-center rounded-md bg-muted text-[10px] font-semibold text-foreground/70 ring-1 ring-border">
                          {t("account.filters.allShort")}
                        </span>
                        {t("account.filters.all")}
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
                  setStatusFilter(v as "online" | "offline" | "all")
                }
              >
                <SelectTrigger className="gap-1.5" size="default">
                  <span className="text-muted-foreground">
                    {t("account.filters.status")}
                  </span>
                  <span className="font-medium">
                    {statusFilter === "all"
                      ? t("account.filters.all")
                      : statusFilter === "online"
                        ? t("account.status.online")
                        : t("account.status.offline")}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="end" className="w-44">
                  <SelectGroup>
                    <SelectLabel>{t("account.filters.status")}</SelectLabel>
                    <SelectItem value="all">
                      {t("account.filters.all")}
                    </SelectItem>
                    <SelectItem value="online">
                      {t("account.status.online")}
                    </SelectItem>
                    <SelectItem value="offline">
                      {t("account.status.offline")}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              <TabsList className="hidden sm:flex rounded-lg border border-border p-1">
                <TabsTrigger value="table" className="gap-1.5">
                  <Rows3Icon className="size-4" />
                  {t("account.view.table")}
                </TabsTrigger>
                <TabsTrigger value="card" className="gap-1.5">
                  <LayoutGridIcon className="size-4" />
                  {t("account.view.card")}
                </TabsTrigger>
              </TabsList>

              <Button
                className="gap-1.5"
                onClick={() => setAddAccountOpen(true)}
              >
                <PlusIcon className="size-4" />
                {t("account.actions.add")}
              </Button>
            </div>
          </div>

          <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
            {isInitialLoading ? (
              <AccountManagementSkeleton />
            ) : (
              <>
                <GroupSidebar
                  groups={groups}
                  groupFilter={groupFilter}
                  groupCounts={groupCounts}
                  onGroupFilterChange={setGroupFilter}
                  onSettingsClick={() => setGroupSettingsOpen(true)}
                  title={t("account.groups.title")}
                  settingsTooltip={t("account.groups.settingsTooltip")}
                />

                <div className="min-w-0 flex-1 rounded-xl border border-border flex flex-col min-h-0 lg:self-stretch">
                  <BulkBar
                    selectedCount={selectedIds.size}
                    groups={groups}
                    onMoveToGroup={moveSelectedToGroup}
                    onDeleteSelected={() => setPendingBatchDeleteOpen(true)}
                    selectedCountLabel={t("account.bulk.selectedCount", {
                      count: selectedIds.size,
                    })}
                    moveToGroupLabel={t("account.bulk.moveToGroup")}
                    batchDeleteLabel={t("account.actions.batchDelete")}
                  />
                  <TabsContent
                    value="table"
                    className="flex flex-1 min-h-0 flex-col mt-0"
                  >
                    <div className="w-full flex flex-col min-h-0 flex-1">
                      <div className="flex flex-1 min-h-0 overflow-auto">
                        {filteredAccounts.length > 0 ? (
                          <Table className="min-w-[860px] table-fixed">
                            <TableHeader
                              className={cn(
                                "[&_tr]:border-border [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:relative [&_th]:h-[47px] [&_th]:py-0 [&_th]:before:content-[''] [&_th]:before:absolute [&_th]:before:inset-0 [&_th]:before:bg-inherit [&_th]:before:z-[-1] [&_th]:shadow-[inset_0_-1px_0_0_hsl(var(--border))] [&_tr]:py-0",
                                selectedIds.size > 0
                                  ? "[&_tr]:bg-background"
                                  : "[&_tr]:bg-muted/40",
                              )}
                            >
                              <TableRow
                                className={
                                  selectedIds.size > 0
                                    ? "hover:bg-background"
                                    : "hover:bg-muted/40"
                                }
                              >
                                <TableHead className="w-12 shrink-0 px-4">
                                  <Checkbox
                                    aria-label={t("account.table.selectAll")}
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    onCheckedChange={(v) =>
                                      toggleAll(Boolean(v))
                                    }
                                  />
                                </TableHead>
                                <TableHead className="w-52 min-w-0">
                                  {t("account.table.account")}
                                </TableHead>
                                <TableHead className="w-28 shrink-0">
                                  {t("account.table.platform")}
                                </TableHead>
                                <TableHead className="w-24 shrink-0">
                                  {t("account.table.followers")}
                                </TableHead>
                                <TableHead className="w-28 shrink-0">
                                  {t("account.table.group")}
                                </TableHead>
                                <TableHead className="w-20 shrink-0">
                                  {t("account.table.status")}
                                </TableHead>
                                <TableHead className="w-24 shrink-0">
                                  {t("account.table.updatedAt")}
                                </TableHead>
                                <TableHead className="w-12 shrink-0 text-right">
                                  <span className="sr-only">
                                    {t("account.table.actions")}
                                  </span>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredAccounts.map((a) => {
                                const platform = platformMap.get(a.platformId);
                                const groupName = getAccountGroupName(a);
                                const checked = selectedIds.has(a.id);
                                return (
                                  <TableRow
                                    key={a.id}
                                    className="[&_td]:py-0 [&_td]:h-[53px]"
                                  >
                                    <TableCell className="w-12 shrink-0 px-4">
                                      <Checkbox
                                        aria-label={t(
                                          "account.table.selectOne",
                                        )}
                                        checked={checked}
                                        onCheckedChange={(v) =>
                                          toggleOne(a.id, Boolean(v))
                                        }
                                      />
                                    </TableCell>
                                    <TableCell className="w-52 shrink-0 px-4 min-w-0">
                                      <div className="flex items-center gap-3">
                                        <Avatar
                                          seed={a.avatarSeed}
                                          name={a.name}
                                          src={a.avatar}
                                        />
                                        <div className="min-w-0 truncate text-sm">
                                          {a.name}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-28 shrink-0 px-4">
                                      <div className="inline-flex items-center text-sm">
                                        {platform ? (
                                          <span title={platform.name}>
                                            <PlatformLogo
                                              platformId={platform.id}
                                              size={28}
                                            />
                                          </span>
                                        ) : (
                                          <span className="text-muted-foreground">
                                            {a.platformId}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell className="w-24 shrink-0 px-4">
                                      {formatFollowers(a.followers)}
                                    </TableCell>
                                    <TableCell className="w-28 shrink-0 px-4 min-w-0">
                                      <span className="block min-w-0 truncate">
                                        {groupName}
                                      </span>
                                    </TableCell>
                                    <TableCell className="w-20 shrink-0 px-4">
                                      <StatusPill
                                        status={a.status}
                                        onlineLabel={t("account.status.online")}
                                        offlineLabel={t(
                                          "account.status.offline",
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell className="w-24 shrink-0 px-4">
                                      {a.updatedAt}
                                    </TableCell>
                                    <TableCell className="w-12 shrink-0 px-4 text-right">
                                      <div className="flex items-center justify-end">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger
                                            render={
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8"
                                                aria-label={t(
                                                  "account.table.actions",
                                                )}
                                              >
                                                <MoreHorizontalIcon className="size-4" />
                                              </Button>
                                            }
                                          />
                                          <DropdownMenuContent
                                            align="end"
                                            className="w-36"
                                          >
                                            <DropdownMenuItem
                                              onClick={() => openEditDrawer(a)}
                                            >
                                              <SettingsIcon className="size-4" />
                                              {t("account.actions.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              variant="destructive"
                                              onClick={() =>
                                                setPendingDeleteAccountId(a.id)
                                              }
                                            >
                                              <Trash2Icon className="size-4" />
                                              {t("account.actions.delete")}
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
                        ) : (
                          <div className="flex min-h-full w-full flex-1 items-center justify-center p-8">
                            <AccountEmptyState
                              title={t("account.emptyTitle")}
                              description={t("account.emptyDescription")}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent
                    value="card"
                    className="flex flex-1 min-h-0 flex-col mt-0"
                  >
                    <div className="flex flex-1 min-h-0 flex-col overflow-auto p-5">
                      {filteredAccounts.length > 0 ? (
                        <>
                          <div
                            className={cn(
                              "flex h-12 min-h-12 shrink-0 items-center gap-2 rounded-t-xl border-b border-border px-4 text-sm transition-colors -mx-5 -mt-5 mb-4",
                              selectedIds.size > 0
                                ? "bg-background"
                                : "bg-muted/40",
                            )}
                          >
                            <Checkbox
                              aria-label={t("account.table.selectAll")}
                              checked={allSelected}
                              indeterminate={someSelected}
                              onCheckedChange={(v) => toggleAll(Boolean(v))}
                            />
                            <span
                              className="cursor-pointer text-foreground font-medium"
                              onClick={() => toggleAll(!allSelected)}
                            >
                              {t("account.table.selectAll")}
                            </span>
                          </div>
                          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                            {filteredAccounts.map((a) => {
                              const platform = platformMap.get(a.platformId);
                              const groupName = getAccountGroupName(a);
                              const checked = selectedIds.has(a.id);
                              return (
                                <div
                                  key={a.id}
                                  className="relative rounded-2xl border border-border bg-card p-5 pb-3 shadow-sm transition hover:shadow-md"
                                >
                                  <div className="absolute left-3 top-3">
                                    <Checkbox
                                      aria-label={t("account.table.selectOne")}
                                      checked={checked}
                                      onCheckedChange={(v) =>
                                        toggleOne(a.id, Boolean(v))
                                      }
                                    />
                                  </div>
                                  <div className="absolute right-3 top-3">
                                    <StatusPill
                                      status={a.status}
                                      onlineLabel={t("account.status.online")}
                                      offlineLabel={t("account.status.offline")}
                                    />
                                  </div>
                                  <div className="pt-2 flex flex-col items-center text-center">
                                    <Avatar
                                      seed={a.avatarSeed}
                                      name={a.name}
                                      src={a.avatar}
                                      className="size-14 text-lg"
                                    />
                                    <div className="mt-3 w-full truncate text-base font-semibold text-foreground">
                                      {a.name}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      {t("account.card.followers")}：
                                      {formatFollowers(a.followers)}
                                    </div>
                                  </div>
                                  <div className="mt-4 grid gap-2 text-sm">
                                    <div className="flex items-center gap-4">
                                      <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
                                        {t("account.card.platform")}
                                      </span>
                                      <span className="min-w-0 truncate font-medium">
                                        {platform?.name ?? a.platformId}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="inline-flex min-w-10 items-center justify-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
                                        {t("account.card.group")}
                                      </span>
                                      <span className="min-w-0 truncate font-medium">
                                        {groupName}
                                      </span>
                                    </div>
                                  </div>
                                  <Separator className="mt-4" />
                                  <div className="mt-2 flex items-center justify-between">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1.5 px-2"
                                      onClick={() => openEditDrawer(a)}
                                    >
                                      <SettingsIcon className="size-4" />
                                      {t("account.actions.edit")}
                                    </Button>
                                    <Button
                                      variant="link"
                                      size="sm"
                                      className="h-8 gap-1.5 px-2 text-destructive hover:text-destructive/90 no-underline hover:no-underline"
                                      onClick={() =>
                                        setPendingDeleteAccountId(a.id)
                                      }
                                    >
                                      <Trash2Icon className="size-4" />
                                      {t("account.actions.delete")}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        <div className="flex min-h-[200px] flex-1 items-center justify-center">
                          <AccountEmptyState
                            title={t("account.emptyTitle")}
                            description={t("account.emptyDescription")}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </div>
              </>
            )}
          </div>
        </Tabs>

        <AddAccountDialog
          open={addAccountOpen}
          onOpenChange={setAddAccountOpen}
          platforms={platforms}
          closeLabel={t("account.groups.close")}
          title={t("account.addAccount.dialogTitle")}
          description={t("account.addAccount.dialogDescription")}
          onSelectPlatform={(platformId) => {
            const desktop =
              typeof window !== "undefined" ? window.desktop : undefined;
            if (!desktop?.openPlatformAuthInTab) {
              toast.error(t("account.addAccount.authNeedDesktop"), {
                duration: 2500,
              });
              return;
            }
            desktop.openPlatformAuthInTab(platformId);
          }}
        />

        <DeleteConfirmDialog
          open={pendingDeleteAccountId !== null}
          onOpenChange={(open) => !open && setPendingDeleteAccountId(null)}
          onConfirm={() => {
            if (pendingDeleteAccountId) {
              deleteOne(pendingDeleteAccountId);
              setPendingDeleteAccountId(null);
            }
          }}
          closeLabel={t("account.groups.close")}
          title={t("account.actions.delete")}
          description={t("account.actions.deleteAccountConfirm")}
          cancelLabel={t("account.groups.cancel")}
          confirmLabel={t("account.groups.confirm")}
        />

        <DeleteConfirmDialog
          open={pendingBatchDeleteOpen}
          onOpenChange={setPendingBatchDeleteOpen}
          onConfirm={() => {
            deleteSelected();
            setPendingBatchDeleteOpen(false);
          }}
          closeLabel={t("account.groups.close")}
          title={t("account.actions.batchDelete")}
          description={t("account.actions.batchDeleteConfirm", {
            count: selectedIds.size,
          })}
          cancelLabel={t("account.groups.cancel")}
          confirmLabel={t("account.groups.confirm")}
        />

        <GroupSettingsDialog
          open={groupSettingsOpen}
          onOpenChange={setGroupSettingsOpen}
          editableGroups={editableGroups}
          newGroupName={newGroupName}
          onNewGroupNameChange={setNewGroupName}
          onCreateGroup={createGroup}
          editingGroupId={editingGroupId}
          editingGroupName={editingGroupName}
          onEditingGroupNameChange={setEditingGroupName}
          onStartRename={startRename}
          onSaveRename={saveRename}
          onCancelRename={cancelRename}
          onDeleteGroup={deleteGroup}
          t={t}
        />

        <EditAccountDrawer
          open={editingAccountId !== null}
          onOpenChange={(open) => !open && setEditingAccountId(null)}
          account={activeEditingAccount}
          editableGroups={editableGroups}
          selectedGroupIds={editingGroupIds}
          onSelectedGroupIdsChange={setEditingGroupIds}
          onSave={saveEditAccount}
          platform={activeEditingPlatform}
        />
      </div>
    </div>
  );
}

export type { PlatformId, StatusId, Platform, Group, Account } from "./types";
