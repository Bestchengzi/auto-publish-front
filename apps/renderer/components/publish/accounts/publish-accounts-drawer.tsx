"use client";

import * as React from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { LayoutGridIcon, Loader2Icon } from "lucide-react";

import { Avatar } from "@/components/account-management/avatar";
import { StatusPill } from "@/components/account-management/status-pill";
import { useAccountSelection } from "@/components/account-management/use-account-selection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import * as accountGroupsApi from "@/lib/api/account-groups";
import * as accountsApi from "@/lib/api/accounts";
import { cn } from "@/lib/utils";

import { getPublishAccountPlatformOptions } from "../platforms/registry";

type PublishAccountsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm?: (selectedAccountIds: string[]) => void;
};

type FilterGroupId = "all" | "ungrouped" | string;

type PublishAccount = {
  id: string;
  name: string;
  platformId: string;
  status: "online" | "offline";
  avatar: string | null | undefined;
  avatarSeed: string;
  groups: { id: number; name: string }[];
};

function getAccountGroupName(account: PublishAccount): string {
  if (account.groups.length === 0) return "--";
  return account.groups.map((group) => group.name).join(", ");
}

export function PublishAccountsDrawer({
  open,
  onOpenChange,
  onConfirm,
}: PublishAccountsDrawerProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const locale = React.useMemo(() => {
    const firstPathSegment = pathname?.split("/").filter(Boolean)[0];
    return firstPathSegment || "zh-CN";
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
    () => getPublishAccountPlatformOptions(),
    [],
  );

  const [platformFilterId, setPlatformFilterId] = React.useState<string | "all">(
    "all",
  );
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
      .filter((item) => item.group_id != null)
      .map((item) => ({
        id: String(item.group_id),
        name: item.group_name,
      }));

    return [
      { id: "all" as const, name: t("account.groups.allGroups") },
      { id: "ungrouped" as const, name: t("account.groups.ungrouped") },
      ...list,
    ];
  }, [groupsAgg, t]);

  const accounts = React.useMemo<PublishAccount[]>(() => {
    const items = accountsRes?.items ?? [];
    return items.map((account) => ({
      id: account.id,
      name: account.nickname || account.account,
      platformId: account.platform,
      status: account.status as "online" | "offline",
      avatar: account.avatar,
      avatarSeed: account.id,
      groups: (account.groups ?? []).map((group) => ({
        id: group.id,
        name: group.name,
      })),
    }));
  }, [accountsRes]);

  const filteredAccounts = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const groupIdNumber =
      groupFilterId !== "all" && groupFilterId !== "ungrouped"
        ? Number.parseInt(groupFilterId, 10)
        : null;

    return accounts.filter((account) => {
      if (platformFilterId !== "all" && account.platformId !== platformFilterId) {
        return false;
      }

      if (groupFilterId === "ungrouped") {
        if (account.groups.length !== 0) return false;
      } else if (groupFilterId !== "all") {
        if (groupIdNumber == null || Number.isNaN(groupIdNumber)) return false;
        if (!account.groups.some((group) => group.id === groupIdNumber)) {
          return false;
        }
      }

      if (!query) return true;
      return account.name.toLowerCase().includes(query);
    });
  }, [accounts, groupFilterId, platformFilterId, searchQuery]);

  const {
    selectedIds,
    setSelectedIds,
    allSelected,
    someSelected,
    toggleOne,
    toggleAll,
  } = useAccountSelection(filteredAccounts, { selectionUniverse: accounts });

  React.useEffect(() => {
    if (!open) return;
    setPlatformFilterId("all");
    setGroupFilterId("all");
    setSearchQuery("");
    setSelectedIds(new Set());
  }, [open, setSelectedIds]);

  const isLoading =
    isLoadingGroups ||
    isLoadingAccounts ||
    isFetchingGroups ||
    isFetchingAccounts;

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

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <div className="w-[280px] shrink-0 overflow-auto border-r border-border p-4">
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
                    <span className="truncate">
                      {t("account.filters.allPlatforms")}
                    </span>
                  </Button>

                  {platformOptions.map((platformOption) => {
                    const active = platformFilterId === platformOption.id;
                    return (
                      <Button
                        key={platformOption.id}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 w-full justify-start gap-2 rounded-lg px-2 text-sm",
                          active
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setPlatformFilterId(platformOption.id)}
                      >
                        <span className="flex h-[22px] w-[22px] items-center justify-center">
                          <Image
                            src={platformOption.logoPath}
                            alt={platformOption.name}
                            width={22}
                            height={22}
                            className="size-[22px] rounded-sm object-contain"
                          />
                        </span>
                        <span className="truncate">{platformOption.name}</span>
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
                  {groups.map((group) => {
                    const active = groupFilterId === group.id;
                    return (
                      <Button
                        key={group.id}
                        type="button"
                        variant="ghost"
                        className={cn(
                          "h-9 w-full justify-start gap-2 rounded-lg px-2 text-sm",
                          active
                            ? "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
                            : "text-foreground/80 hover:bg-muted hover:text-foreground",
                        )}
                        onClick={() => setGroupFilterId(group.id)}
                      >
                        <span className="truncate">{group.name}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-border p-4">
                <div className="flex w-full items-center gap-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                    aria-label={t("account.table.selectAll")}
                  />
                  <div className="shrink-0 leading-tight">
                    <div className="text-sm font-medium">
                      {t("account.table.selectAll")}
                    </div>
                  </div>
                  <div className="ml-auto w-[320px] shrink-0">
                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={t("account.search.placeholder")}
                      aria-label={t("account.search.ariaLabel")}
                    />
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden">
                <div className="h-full overflow-auto p-4">
                  {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2Icon className="size-4 animate-spin text-primary" />
                        <span>加载中...</span>
                      </div>
                    </div>
                  ) : filteredAccounts.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center">
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
                    <div className="grid w-full grid-cols-2 gap-3">
                      {filteredAccounts.map((account) => {
                        const checked = selectedIds.has(account.id);
                        const groupName = getAccountGroupName(account);
                        return (
                          <div
                            key={account.id}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3 hover:shadow-sm",
                              checked && "border-primary/50",
                            )}
                            onClick={() => toggleOne(account.id, !checked)}
                          >
                            <div
                              className="flex items-center justify-center"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(nextValue) =>
                                  toggleOne(account.id, Boolean(nextValue))
                                }
                                aria-label={account.name}
                              />
                            </div>
                            <Avatar
                              seed={account.avatarSeed}
                              name={account.name}
                              src={account.avatar}
                              className="size-10 text-sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">
                                    {account.name}
                                  </div>
                                </div>
                                <StatusPill
                                  status={account.status}
                                  onlineLabel="在线"
                                  offlineLabel="离线"
                                />
                              </div>
                              <div className="mt-1 truncate text-xs text-muted-foreground">
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

          <SheetFooter className="flex items-center justify-between gap-3 px-6 py-4">
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
