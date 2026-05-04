import * as React from "react";
import {
  useQuery,
  type QueryKey,
} from "@tanstack/react-query";
import { formatDateShort } from "@/lib/date";
import * as accountsApi from "@/lib/api/accounts";
import * as accountGroupsApi from "@/lib/api/account-groups";
import type { Account, Group, PlatformId } from "./types";

const ACCOUNT_QUERY_STALE_TIME_MS = 60 * 1000;
const ACCOUNT_QUERY_TIMEOUT_MS = 15 * 1000;

function createTimeoutSignal(parentSignal: AbortSignal | undefined) {
  const controller = new AbortController();
  const cleanupFns: Array<() => void> = [];

  if (parentSignal) {
    if (parentSignal.aborted) {
      controller.abort();
    } else {
      const abortFromParent = () => controller.abort();
      parentSignal.addEventListener("abort", abortFromParent, { once: true });
      cleanupFns.push(() =>
        parentSignal.removeEventListener("abort", abortFromParent),
      );
    }
  }

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, ACCOUNT_QUERY_TIMEOUT_MS);
  cleanupFns.push(() => clearTimeout(timeoutId));

  return {
    signal: controller.signal,
    cleanup: () => {
      for (const cleanup of cleanupFns) cleanup();
    },
  };
}

function mapAccountResponseToAccount(a: accountsApi.AccountResponse): Account {
  const groupIds = (a.groups ?? []).map((g) => String(g.id));
  const updatedAt = a.last_refreshed_at ?? a.updated_at;
  return {
    id: a.id,
    name: a.nickname || a.account,
    followers: a.follower_count ?? 0,
    platformId: a.platform as PlatformId,
    groupIds,
    status: a.status as "online" | "offline",
    updatedAt: formatDateShort(updatedAt, "--"),
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
  const allGroupsLabel = t("account.groups.allGroups");
  const groupsQuery = useQuery({
    queryKey: ["account-management", "groups", allGroupsLabel] as QueryKey,
    queryFn: async ({ signal }) => {
      const timeout = createTimeoutSignal(signal);
      try {
        const res = await accountGroupsApi.listAccountGroupsWithCounts({
          signal: timeout.signal,
        });
        const list: Group[] = [
          { id: "all", name: allGroupsLabel },
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
      } finally {
        timeout.cleanup();
      }
    },
    placeholderData: (previousData) => previousData,
    staleTime: ACCOUNT_QUERY_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
  });

  const accountsQuery = useQuery({
    queryKey: [
      "account-management",
      "accounts",
      groupFilter,
      platformFilter,
      statusFilter,
    ] as QueryKey,
    queryFn: async ({ signal }) => {
      const timeout = createTimeoutSignal(signal);
      try {
        let groupIdParam: number | undefined = undefined;
        if (groupFilter !== "all" && groupFilter !== "ungrouped") {
          const n = parseInt(groupFilter, 10);
          if (!Number.isNaN(n)) groupIdParam = n;
        }
        const res = await accountsApi.listAccounts(
          {
            status: statusFilter === "all" ? undefined : statusFilter,
            platforms: platformFilter === "all" ? undefined : platformFilter,
            group_id: groupIdParam,
          },
          {
            signal: timeout.signal,
          },
        );
        let items = res.items.map(mapAccountResponseToAccount);
        if (groupFilter === "ungrouped") {
          items = items.filter((a) => a.groupIds.length === 0);
        }
        return items;
      } finally {
        timeout.cleanup();
      }
    },
    // Keep previous list during filter refetch to avoid empty-state flicker.
    placeholderData: (previousData) => previousData,
    staleTime: ACCOUNT_QUERY_STALE_TIME_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false,
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
