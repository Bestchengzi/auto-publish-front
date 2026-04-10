import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/request";
import * as accountsApi from "@/lib/api/accounts";
import * as accountGroupsApi from "@/lib/api/account-groups";
import type { Account, Group } from "./types";

type TFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

type UseAccountManagementActionsArgs = {
  t: TFn;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingAccountId: string | null;
  setEditingAccountId: React.Dispatch<React.SetStateAction<string | null>>;
  editingGroupIds: string[];
  setEditingGroupIds: React.Dispatch<React.SetStateAction<string[]>>;
  newGroupName: string;
  setNewGroupName: React.Dispatch<React.SetStateAction<string>>;
  editingGroupId: string | null;
  setEditingGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  editingGroupName: string;
  setEditingGroupName: React.Dispatch<React.SetStateAction<string>>;
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  refreshData: () => Promise<void>;
  fetchGroups: () => Promise<void>;
};

export function useAccountManagementActions({
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
}: UseAccountManagementActionsArgs) {
  const queryClient = useQueryClient();
  const invalidateAccountManagementQueries = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["account-management"] });
  }, [queryClient]);

  const createGroup = React.useCallback(async () => {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      await accountGroupsApi.createAccountGroup(name);
      setNewGroupName("");
      await fetchGroups();
    } catch (e) {
      console.error("Failed to create group:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }, [fetchGroups, newGroupName, setNewGroupName, t]);

  const startRename = React.useCallback(
    (g: Group) => {
      setEditingGroupId(g.id);
      setEditingGroupName(g.name);
    },
    [setEditingGroupId, setEditingGroupName],
  );

  const saveRename = React.useCallback(() => {
    if (!editingGroupId) return;
    const isApiGroup = /^\d+$/.test(editingGroupId);
    if (isApiGroup) {
      toast.error(t("account.groups.renameNotSupported"));
    } else {
      const name = editingGroupName.trim();
      if (name) {
        setGroups((prev) =>
          prev.map((g) => (g.id === editingGroupId ? { ...g, name } : g)),
        );
      }
    }
    setEditingGroupId(null);
    setEditingGroupName("");
  }, [
    editingGroupId,
    editingGroupName,
    setEditingGroupId,
    setEditingGroupName,
    setGroups,
    t,
  ]);

  const cancelRename = React.useCallback(() => {
    setEditingGroupId(null);
    setEditingGroupName("");
  }, [setEditingGroupId, setEditingGroupName]);

  const deleteGroup = React.useCallback(
    async (groupId: string) => {
      if (groupId === "all" || groupId === "ungrouped") return;
      const numId = parseInt(groupId, 10);
      if (Number.isNaN(numId)) return;
      try {
        await accountGroupsApi.deleteAccountGroup(numId);
        await invalidateAccountManagementQueries();
        await refreshData();
      } catch (e) {
        console.error("Failed to delete group:", e);
        toast.error(getApiErrorMessage(e, t("common.error")));
      }
    },
    [invalidateAccountManagementQueries, refreshData, t],
  );

  const moveSelectedToGroup = React.useCallback(
    async (targetGroupId: string) => {
      const ids = Array.from(selectedIds);
      if (!ids.length) return;
      const groupId =
        targetGroupId === "ungrouped" ? null : parseInt(targetGroupId, 10);
      const groupIds =
        targetGroupId === "ungrouped" || Number.isNaN(groupId as number)
          ? []
          : [groupId as number];
      try {
        const results = await Promise.allSettled(
          ids.map((accountId) =>
            accountsApi.updateAccount(accountId, { group_ids: groupIds }),
          ),
        );
        const failed = results.filter((r) => r.status === "rejected");
        setSelectedIds(new Set());
        await invalidateAccountManagementQueries();
        await refreshData();
        if (failed.length > 0) {
          toast.error(
            `${t("common.error")} (${ids.length - failed.length}/${ids.length})`,
          );
        }
      } catch (e) {
        console.error("Failed to move accounts:", e);
        toast.error(getApiErrorMessage(e, t("common.error")));
      }
    },
    [
      invalidateAccountManagementQueries,
      refreshData,
      selectedIds,
      setSelectedIds,
      t,
    ],
  );

  const deleteSelected = React.useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    try {
      const results = await Promise.allSettled(
        ids.map((id) => accountsApi.deleteAccount(id)),
      );
      const failed = results.filter((r) => r.status === "rejected");
      setSelectedIds(new Set());
      await invalidateAccountManagementQueries();
      await refreshData();
      if (failed.length > 0) {
        toast.error(
          `${t("common.error")} (${ids.length - failed.length}/${ids.length})`,
        );
      }
    } catch (e) {
      console.error("Failed to delete accounts:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }, [
    invalidateAccountManagementQueries,
    refreshData,
    selectedIds,
    setSelectedIds,
    t,
  ]);

  const openEditDrawer = React.useCallback(
    (account: Account) => {
      setEditingAccountId(account.id);
      setEditingGroupIds([...account.groupIds]);
    },
    [setEditingAccountId, setEditingGroupIds],
  );

  const saveEditAccount = React.useCallback(async () => {
    if (!editingAccountId) return;
    try {
      const groupIds = editingGroupIds
        .map((id) => parseInt(id, 10))
        .filter((n) => !Number.isNaN(n));
      await accountsApi.updateAccount(editingAccountId, { group_ids: groupIds });
      setEditingAccountId(null);
      await invalidateAccountManagementQueries();
      await refreshData();
    } catch (e) {
      console.error("Failed to update account:", e);
      toast.error(getApiErrorMessage(e, t("common.error")));
    }
  }, [
    editingAccountId,
    editingGroupIds,
    invalidateAccountManagementQueries,
    refreshData,
    setEditingAccountId,
    t,
  ]);

  const deleteOne = React.useCallback(
    async (id: string) => {
      try {
        await accountsApi.deleteAccount(id);
        setSelectedIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        setEditingAccountId((prev) => (prev === id ? null : prev));
        await invalidateAccountManagementQueries();
        await refreshData();
      } catch (e) {
        console.error("Failed to delete account:", e);
        toast.error(getApiErrorMessage(e, t("common.error")));
      }
    },
    [
      invalidateAccountManagementQueries,
      refreshData,
      setEditingAccountId,
      setSelectedIds,
      t,
    ],
  );

  return {
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
  };
}
