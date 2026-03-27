import * as React from "react";
import {
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { formatDateShort } from "@/lib/date";
import * as accountsApi from "@/lib/api/accounts";
import * as accountGroupsApi from "@/lib/api/account-groups";
import type { Account, Group, PlatformId } from "./types";

function mapAccountResponseToAccount(a: accountsApi.AccountResponse): Account {
  const groupIds = (a.groups ?? []).map((g) => String(g.id));
  return {
    id: a.id,
    name: a.nickname || a.account,
    followers: a.follower_count ?? 0,
    platformId: a.platform as PlatformId,
    groupIds,
    status: a.status as "online" | "offline",
    updatedAt: formatDateShort(a.updated_at, "--"),
    avatarSeed: a.id,
    avatar: a.avatar ?? undefined,
  };
}

type UseAccountManagementDataArgs = {
  t: (
    key: string,
    values?: Record<string, string | number | Date>,
  ) => string;
  groupFilter: string;
  platformFilter: string | "all";
  statusFilter: "online" | "offline" | "all";
};

export function useAccountManagementData({
  t,
  groupFilter,
  platformFilter,
  statusFilter,
}: UseAccountManagementDataArgs) {
  const groupsQuery = useQuery({
    queryKey: ["account-management", "groups", t("account.groups.all")] as QueryKey,
    queryFn: async () => {
      const res = await accountGroupsApi.listAccountGroupsWithCounts();
      const list: Group[] = [
        { id: "all", name: t("account.groups.all") },
        { id: "ungrouped", name: t("account.groups.ungrouped") },
      ];
      const counts: Record<string, number> = { all: 0, ungrouped: 0 };
      for (const item of res.items) {
        counts.all += item.count;
        if (item.group_id == null) {
          counts.ungrouped = item.count;
        } else {
          list.push({ id: String(item.group_id), name: item.group_name });
          counts[String(item.group_id)] = item.count;
        }
      }
      return { list, counts };
    },
  });

  const accountsQuery = useQuery({
    queryKey: [
      "account-management",
      "accounts",
      groupFilter,
      platformFilter,
      statusFilter,
    ] as QueryKey,
    queryFn: async () => {
      let groupIdParam: number | undefined = undefined;
      if (groupFilter !== "all" && groupFilter !== "ungrouped") {
        const n = parseInt(groupFilter, 10);
        if (!Number.isNaN(n)) groupIdParam = n;
      }
      const res = await accountsApi.listAccounts({
        status: statusFilter === "all" ? undefined : statusFilter,
        platforms: platformFilter === "all" ? undefined : platformFilter,
        group_id: groupIdParam,
      });
      let items = res.items.map(mapAccountResponseToAccount);
      if (groupFilter === "ungrouped") {
        items = items.filter((a) => a.groupIds.length === 0);
      }
      return items;
    },
    // Keep previous list during filter refetch to avoid empty-state flicker.
    placeholderData: (previousData) => previousData,
  });

  const [groupsOverride, setGroupsOverride] = React.useState<Group[] | null>(null);
  React.useEffect(() => {
    setGroupsOverride(null);
  }, [groupsQuery.data]);

  const groups = groupsOverride ?? groupsQuery.data?.list ?? [];
  const groupCounts = groupsQuery.data?.counts ?? { all: 0, ungrouped: 0 };
  const accounts = accountsQuery.data ?? [];
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);

  React.useEffect(() => {
    if (!hasLoadedOnce && groupsQuery.isFetched && accountsQuery.isFetched) {
      setHasLoadedOnce(true);
    }
  }, [accountsQuery.isFetched, groupsQuery.isFetched, hasLoadedOnce]);

  const isInitialLoading =
    !hasLoadedOnce && (groupsQuery.isLoading || accountsQuery.isLoading);

  const fetchGroups = React.useCallback(async () => {
    await groupsQuery.refetch();
  }, [groupsQuery]);

  const refreshData = React.useCallback(async () => {
    await Promise.all([groupsQuery.refetch(), accountsQuery.refetch()]);
  }, [accountsQuery, groupsQuery]);

  const setGroups: React.Dispatch<React.SetStateAction<Group[]>> =
    React.useCallback((updater) => {
      setGroupsOverride((prev) => {
        const base = prev ?? groupsQuery.data?.list ?? [];
        if (typeof updater === "function") {
          const fn = updater as (prevState: Group[]) => Group[];
          return fn(base);
        }
        return updater;
      });
    }, [groupsQuery.data?.list]);

  return {
    groups,
    groupCounts,
    accounts,
    isInitialLoading,
    fetchGroups,
    refreshData,
    setGroups,
  };
}
