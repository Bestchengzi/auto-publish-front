"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Cascader, type CascaderOption } from "@/components/ui/cascader";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { PROVINCE_CITY_CASCADER_OPTIONS } from "@/lib/data/province-city-cascader-options.generated";
import { Avatar } from "./avatar";
import { PlatformLogo } from "./platform-logo";
import type { Account, Group, Platform } from "./types";

type EditAccountDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  editableGroups: Group[];
  selectedGroupIds: string[];
  onSelectedGroupIdsChange: (ids: string[]) => void;
  proxyCityValue: string[];
  onProxyCityValueChange: (value: string[]) => void;
  onSave: () => void;
  platform: Platform | null;
};

const PROXY_CITY_OPTIONS: CascaderOption[] = PROVINCE_CITY_CASCADER_OPTIONS.map(
  (province) => ({
    value: province.provinceName,
    label: province.provinceName,
    children: province.cities.map((city) => ({
      value: city.cityName,
      label: city.cityName,
    })),
  }),
);

export function EditAccountDrawer({
  open,
  onOpenChange,
  account,
  editableGroups,
  selectedGroupIds,
  onSelectedGroupIdsChange,
  proxyCityValue,
  onProxyCityValueChange,
  onSave,
  platform,
}: EditAccountDrawerProps) {
  const t = useTranslations();

  function toggleGroup(groupId: string, checked: boolean) {
    if (groupId === "ungrouped") {
      if (checked) {
        onSelectedGroupIdsChange(["ungrouped"]);
      } else {
        onSelectedGroupIdsChange(selectedGroupIds.filter((id) => id !== "ungrouped"));
      }
      return;
    }
    if (checked) {
      onSelectedGroupIdsChange([
        ...selectedGroupIds.filter((id) => id !== "ungrouped"),
        groupId,
      ]);
    } else {
      onSelectedGroupIdsChange(selectedGroupIds.filter((id) => id !== groupId));
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} side="right">
      <SheetContent side="right" showCloseButton={true} closeLabel={t("account.groups.close")}>
        <SheetHeader>
          <SheetTitle>{t("account.editDrawer.title")}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-auto p-4">
          {account && platform && (
            <>
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <Avatar seed={account.avatarSeed} name={account.name} src={account.avatar} className="size-14 text-lg" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{account.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <PlatformLogo platformId={platform.id} size={20} />
                    <span>{platform.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  {t("account.editDrawer.groupLabel")}
                </h3>
                <div className="flex flex-col gap-2">
                  {editableGroups.map((g) => (
                    <label
                      key={g.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedGroupIds.includes(g.id)}
                        onCheckedChange={(v) => toggleGroup(g.id, Boolean(v))}
                        aria-label={g.name}
                      />
                      <span className="text-sm font-medium">{g.name}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("account.editDrawer.groupHint")}
                </p>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-medium text-foreground">
                  {t("account.editDrawer.proxyCityLabel")}
                </h3>
                <Cascader
                  options={PROXY_CITY_OPTIONS}
                  value={proxyCityValue}
                  onValueChange={onProxyCityValueChange}
                  placeholder={t("account.editDrawer.proxyCityPlaceholder")}
                  searchPlaceholder={t("account.editDrawer.proxyCitySearchPlaceholder")}
                  emptyText={t("account.editDrawer.proxyCityEmpty")}
                  clearText={t("account.editDrawer.proxyCityClear")}
                />
              </div>
            </>
          )}
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("account.groups.cancel")}
          </Button>
          <Button
            onClick={() => {
              onSave();
              onOpenChange(false);
            }}
          >
            {t("account.editDrawer.save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
