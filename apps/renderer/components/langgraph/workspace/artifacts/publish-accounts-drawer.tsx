"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LayoutGridIcon, Loader2Icon } from "lucide-react";
import { Avatar } from "@/components/account-management/avatar";
import { PlatformLogo } from "@/components/account-management/platform-logo";
import { StatusPill } from "@/components/account-management/status-pill";
import { useAccountSelection } from "@/components/account-management/use-account-selection";

import * as accountsApi from "@/lib/api/accounts";
import * as accountGroupsApi from "@/lib/api/account-groups";
import { getPlatformsWithNames, type PlatformId } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type PublishAccountsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (selectedAccountIds: string[]) => void;
};

type FilterGroupId = "all" | "ungrouped" | string;

type PublishAccount = {
  id: string;
  name: string;
  platformId: PlatformId;
  status: "online" | "offline";
  avatar: string | null | undefined;
  avatarSeed: string;
  groups: { id: number; name: string }[];
};

function getAccountGroupName(account: PublishAccount): string {
  if (account.groups.length === 0) return "--";
  return account.groups.map((g) => g.name).join(", ");
}

export function PublishAccountsDrawer({
  open,
  onOpenChange,
  onConfirm,
}: PublishAccountsDrawerProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = React.useMemo(() => {
    const first = pathname?.split("/").filter(Boolean)[0];
    return first || "zh-CN";
  }, [pathname]);
  const accountManagementUrl = React.useMemo(
    () => `/${locale}/account`,
    [locale],
  );
  const openAccountManagement = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.open(accountManagementUrl, "_blank");
  }, [accountManagementUrl]);

  const platformOptions = React.useMemo(
    () => getPlatformsWithNames((id) => t(`account.platforms.${id}`)),
    [t],
  );

  const [platformFilterId, setPlatformFilterId] = React.useState<
    PlatformId | "all"
  >("all");
  const [groupFilterId, setGroupFilterId] =
    React.useState<FilterGroupId>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: groupsAgg,
    isFetching: isFetchingGroups,
    isLoading: isLoadingGroups,
  } = useQuery({
    queryKey: ["publish-accounts-drawer", "groups"],
    queryFn: () => accountGroupsApi.listAccountGroupsWithCounts(),
    enabled: open,
  });

  const {
    data: accountsRes,
    isFetching: isFetchingAccounts,
    isLoading: isLoadingAccounts,
  } = useQuery({
    queryKey: ["publish-accounts-drawer", "accounts"],
    queryFn: () => accountsApi.listAccounts(),
    enabled: open,
  });

  const groups = React.useMemo(() => {
    const items = groupsAgg?.items ?? [];
    const list = items
      .filter((i) => i.group_id != null)
      .map((i) => ({
        id: String(i.group_id),
        name: i.group_name,
      }));
    return [
      { id: "all" as const, name: t("account.groups.allGroups") },
      { id: "ungrouped" as const, name: t("account.groups.ungrouped") },
      ...list,
    ];
  }, [groupsAgg, t]);

  const accounts = React.useMemo<PublishAccount[]>(() => {
    const items = accountsRes?.items ?? [];
    return items.map((a) => ({
      id: a.id,
      name: a.nickname || a.account,
      platformId: a.platform as PlatformId,
      status: a.status as "online" | "offline",
      avatar: a.avatar,
      avatarSeed: a.id,
      groups: (a.groups ?? []).map((g) => ({ id: g.id, name: g.name })),
    }));
  }, [accountsRes]);

  const filteredAccounts = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groupIdNumber =
      groupFilterId !== "all" && groupFilterId !== "ungrouped"
        ? Number.parseInt(groupFilterId, 10)
        : null;

    return accounts.filter((a) => {
      if (platformFilterId !== "all" && a.platformId !== platformFilterId)
        return false;

      if (groupFilterId === "ungrouped") {
        if (a.groups.length !== 0) return false;
      } else if (groupFilterId !== "all") {
        if (groupIdNumber == null || Number.isNaN(groupIdNumber)) return false;
        if (!a.groups.some((g) => g.id === groupIdNumber)) return false;
      }

      if (q) {
        const haystack = `${a.name}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [accounts, groupFilterId, searchQuery, platformFilterId]);

  const {
    selectedIds,
    setSelectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
  } = useAccountSelection(filteredAccounts, { selectionUniverse: accounts });

  // Reset filters and selection when the drawer opens.
  React.useEffect(() => {
    if (!open) return;
    setPlatformFilterId("all");
    setGroupFilterId("all");
    setSearchQuery("");
    setSelectedIds(new Set());
  }, [open, setSelectedIds]);

  const isLoading = isLoadingGroups || isLoadingAccounts || isFetchingGroups || isFetchingAccounts;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={true}
        closeLabel={t("account.groups.close")}
        maxWidth="900px"
        className="p-0"
      >
        <div className="flex h-full min-h-0 flex-col">
          <SheetHeader className="px-6">
            <SheetTitle>{t("account.table.selectOne")}</SheetTitle>
          </SheetHeader>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Left filters */}
            <div className="w-[280px] shrink-0 border-r border-border p-4 overflow-auto">
              <div className="text-sm font-medium text-foreground">
                {t("account.filters.platform")}
              </div>

              <div className="mt-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex flex-col gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className={cn(
                      "h-9 w-full justify-start gap-2 rounded-lg px-2 text-sm",
                      platformFilterId === "all"
                        ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground",
                    )}
                    onClick={() => setPlatformFilterId("all")}
                  >
                    <span className="flex h-[22px] w-[22px] items-center justify-center">
                      <LayoutGridIcon className="size-5" aria-hidden />
                    </span>
                    <span className="truncate">{t("account.filters.allPlatforms")}</span>
                  </Button>

                  {platformOptions.map((p) => {
                    const active = platformFilterId === p.id;
                    return (
                      <Button
                        key={p.id}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 w-full justify-start gap-2 rounded-lg px-2 text-sm",
                          active
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setPlatformFilterId(p.id)}
                      >
                        <span className="flex h-[22px] w-[22px] items-center justify-center">
                          <PlatformLogo platformId={p.id} size={22} />
                        </span>
                        <span className="truncate">{p.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 text-sm font-medium text-foreground">
                {t("account.groups.title")}
              </div>

              <div className="mt-3 rounded-xl border border-border bg-muted/10 p-3">
                <div className="flex flex-col gap-1">
                  {groups.map((g) => {
                    const active = groupFilterId === g.id;
                    return (
                      <Button
                        key={g.id}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 w-full justify-start gap-2 rounded-lg px-2 text-sm",
                          active
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setGroupFilterId(g.id)}
                      >
                        <span className="truncate">{g.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right accounts */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="p-4 border-b border-border">
                <div className="w-full flex items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(v) => toggleAll(Boolean(v))}
                    aria-label={t("account.table.selectAll")}
                  />
                  <div className="shrink-0 flex flex-col leading-tight">
                    <div className="text-sm font-medium">
                      {t("account.table.selectAll")}
                    </div>
                  </div>
                  <div className="shrink-0 w-[320px] ml-auto">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t("account.search.placeholder")}
                      aria-label={t("account.search.ariaLabel")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="overflow-auto h-full p-4">
                  {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                        <span>加载中...</span>
                      </div>
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div className="px-4">
                        <div className="text-base font-medium text-foreground">
                          {t("account.emptyTitle")}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {t("account.publishEmptyPrefix")}
                          <button
                            type="button"
                            className="cursor-pointer text-primary hover:underline"
                            onClick={openAccountManagement}
                          >
                            {t("account.publishEmptyActionLabel")}
                          </button>
                          {t("account.publishEmptySuffix")}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-3">
                      {filteredAccounts.map((a) => {
                        const checked = selectedIds.has(a.id);
                        const groupName = getAccountGroupName(a);
                        return (
                          <div
                            key={a.id}
                            className={cn(
                              "cursor-pointer flex items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm",
                              checked && "border-primary/50",
                            )}
                            onClick={() => toggleOne(a.id, !checked)}
                          >
                            <div
                              className="flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  toggleOne(a.id, Boolean(v))
                                }
                                aria-label={a.name}
                              />
                            </div>
                            <Avatar
                              seed={a.avatarSeed}
                              name={a.name}
                              src={a.avatar}
                              className="size-10 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">
                                    {a.name}
                                  </div>
                                </div>
                                <StatusPill
                                  status={a.status}
                                  onlineLabel="在线"
                                  offlineLabel="离线"
                                />
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground truncate">
                                {groupName}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="px-6 py-4 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-muted-foreground">
              {t("account.bulk.selectedCount", { count: selectedIds.size })}
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={() => {
                  onConfirm?.(Array.from(selectedIds));
                  onOpenChange(false);
                }}
              >
                确认添加
              </Button>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

