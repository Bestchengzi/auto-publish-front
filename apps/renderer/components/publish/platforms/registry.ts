import type { PickerPlatformItem } from "@/components/common/platform-picker-dialog";
import type { PublishEditPlatform } from "@/lib/api/publish";

import { CN_PUBLISH_PLATFORM_CATALOG } from "./catalogs/cn";
import { baijiahaoPlatformModule } from "./modules/baijiahao-platform-module";
import { csdnPlatformModule } from "./modules/csdn-platform-module";
import { genericPlatformModule } from "./modules/generic-platform-module";
import { rednotePlatformModule } from "./modules/rednote-platform-module";
import { toutiaoPlatformModule } from "./modules/toutiao-platform-module";
import { wechatMpPlatformModule } from "./modules/wechat-mp-platform-module";
import { zhihuPlatformModule } from "./modules/zhihu-platform-module";
import type {
  PublishFieldOptionItem,
  PublishPlatformInitArgs,
  PublishPlatformKey,
  PublishPlatformMeta,
  PublishPlatformModule,
  PublishPlatformNormalizeArgs,
  PublishPlatformValidationArgs,
} from "./types";
import {
  FIELD_ID_TITLE,
  HIDDEN_PLATFORM_FIELD_IDS,
  getOptionFallbackValue,
  getPublishFieldLabel,
  getRequiredFieldLabel,
  getTitleFieldError,
  toAccountPlatform,
} from "./utils";

const platformModules = [
  toutiaoPlatformModule,
  rednotePlatformModule,
  zhihuPlatformModule,
  csdnPlatformModule,
  baijiahaoPlatformModule,
  wechatMpPlatformModule,
];

const platformModuleMap = new Map<string, PublishPlatformModule>();

for (const platformModule of platformModules) {
  for (const id of platformModule.ids) {
    platformModuleMap.set(id, platformModule);
  }
}

const platformMetaMap = new Map<string, PublishPlatformMeta>();

for (const platformMeta of CN_PUBLISH_PLATFORM_CATALOG) {
  platformMetaMap.set(platformMeta.id, platformMeta);
}

export function getPublishPlatformModule(
  platformKey: string,
): PublishPlatformModule {
  return platformModuleMap.get(platformKey) ?? genericPlatformModule;
}

export function getPublishPlatformMeta(platformKey: string): PublishPlatformMeta {
  return (
    platformMetaMap.get(platformKey) ?? {
      id: platformKey as PublishPlatformKey,
      label: platformKey,
      pickerLabel: platformKey,
      logoPath: "/platform-logos/xiao-hong-shu.png",
      pickerVisible: false,
    }
  );
}

export function getPublishPlatformLabel(platformKey: string): string {
  return getPublishPlatformMeta(platformKey).label;
}

export function getPublishPlatformLogoPath(platformKey: string): string {
  return getPublishPlatformMeta(platformKey).logoPath;
}

export function getPublishPlatformPickerItems(): PickerPlatformItem[] {
  return CN_PUBLISH_PLATFORM_CATALOG.filter((item) => item.pickerVisible).map(
    (item) => ({
      id: item.id,
      name: item.pickerLabel ?? item.label,
      logo: item.logoPath,
    }),
  );
}

export function getPublishAccountPlatformOptions() {
  const seen = new Set<string>();
  return CN_PUBLISH_PLATFORM_CATALOG.filter((item) => item.pickerVisible)
    .map((item) => ({
      id: toAccountPlatform(item.id),
      name: item.label,
      logoPath: item.logoPath,
    }))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

export function getOrderedPlatformOptions(
  platformKey: string,
  platformData: PublishEditPlatform,
): PublishFieldOptionItem[] {
  const platformModule = getPublishPlatformModule(platformKey);
  const platformMeta = getPublishPlatformMeta(platformKey);
  const options = platformData.platform_options ?? {};
  const optionKeys = platformModule.getOptionKeys
    ? platformModule.getOptionKeys(options)
    : Object.keys(options);
  const optionOrder = platformModule.optionOrder ?? platformMeta.optionOrder ?? [];
  const orderedKeys = [
    ...optionOrder.filter((key) => optionKeys.includes(key)),
    ...optionKeys.filter((key) => !optionOrder.includes(key)).sort(),
  ];

  return orderedKeys
    .filter((fieldKey) => {
      if (fieldKey === "title") return false;
      if (HIDDEN_PLATFORM_FIELD_IDS.has(fieldKey)) return false;
      return platformModule.isOptionVisible
        ? platformModule.isOptionVisible(fieldKey)
        : true;
    })
    .map((fieldKey) => ({
      key: fieldKey,
      value: options[fieldKey] ?? getOptionFallbackValue(fieldKey),
    }));
}

export function getDefaultPlatformOptions(
  platformKey: string,
): Record<string, unknown> {
  const platformModule = getPublishPlatformModule(platformKey);
  const platformMeta = getPublishPlatformMeta(platformKey);
  const optionOrder = platformModule.optionOrder ?? platformMeta.optionOrder ?? [];

  return Object.fromEntries(
    optionOrder.map((fieldKey) => [fieldKey, getOptionFallbackValue(fieldKey)]),
  );
}

export function getPublishFieldLabelByPlatform(
  platformKey: string,
  fieldKey: string,
): string {
  return (
    getPublishPlatformModule(platformKey).getFieldLabel?.(fieldKey) ??
    getPublishFieldLabel(fieldKey)
  );
}

export function getRequiredFieldErrorMessage(
  platformKey: string,
  fieldKey: string,
  value: unknown,
): string {
  const fieldError =
    getPublishPlatformModule(platformKey).getFieldError?.(fieldKey, value) ?? "";

  if (fieldError) {
    return fieldError;
  }

  if (fieldKey === FIELD_ID_TITLE) {
    return getTitleFieldError(platformKey, value);
  }

  return "";
}

export function getTitleMaxLength(platformKey: string): number | undefined {
  return getPublishPlatformModule(platformKey).getTitleMaxLength?.();
}

export function getRequiredFields(platformKey: string): string[] {
  return getPublishPlatformModule(platformKey).getRequiredFields?.() ?? [];
}

export function isInlinePlatformField(
  platformKey: string,
  fieldKey: string,
): boolean {
  return (
    getPublishPlatformModule(platformKey).getInlineFieldKeys?.().includes(fieldKey) ??
    false
  );
}

export function createInitialFormValues(
  platformKey: string,
  args: PublishPlatformInitArgs,
): Record<string, unknown> {
  const platformModule = getPublishPlatformModule(platformKey);

  if (platformModule.getInitialFormValues) {
    return platformModule.getInitialFormValues(args);
  }

  const defaults: Record<string, unknown> = {
    [FIELD_ID_TITLE]: args.title,
  };

  for (const option of args.orderedOptions) {
    defaults[option.key] = option.value;
  }

  return defaults;
}

export function createInitialCoverImages(
  platformKey: string,
  args: PublishPlatformInitArgs,
): string[] {
  return (
    getPublishPlatformModule(platformKey).getInitialCoverImages?.(args) ??
    args.contentImageUrls.slice(0, 3)
  );
}

export function getCoverSlotCount(
  platformKey: string,
  formValues: Record<string, unknown>,
): number {
  return getPublishPlatformModule(platformKey).getCoverSlotCount?.(formValues) ?? 0;
}

export function validatePlatformBeforePublish(
  platformKey: string,
  args: PublishPlatformValidationArgs,
): string | null {
  return (
    getPublishPlatformModule(platformKey).validateBeforePublish?.(args) ?? null
  );
}

export function normalizePlatformOptions(
  platformKey: string,
  args: PublishPlatformNormalizeArgs,
): Record<string, unknown> {
  return (
    getPublishPlatformModule(platformKey).normalizePlatformOptions?.(args) ??
    Object.fromEntries(
      Object.entries(args.formValues).filter(([fieldKey, value]) => {
        if (fieldKey === FIELD_ID_TITLE) return false;
        if (value == null) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        return true;
      }),
    )
  );
}

export function getPublishPlatformTabCloseLabel(platformKey: string): string {
  return `关闭${getPublishPlatformLabel(platformKey)}`;
}

export function getAddPlatformDialogCopy() {
  return {
    title: "选择平台",
    description: "选择要添加发布的平台",
    closeLabel: "关闭",
  };
}

export function getPublishResultPlatformLabel(platformKey?: string | null): string {
  if (!platformKey) return "";
  return getPublishPlatformLabel(platformKey);
}

export function getPlatformRequiredAccountError(platformKey: string): string {
  return `请选择${getPublishPlatformLabel(platformKey)}发布账号`;
}

export function getPlatformRequiredTitleError(platformKey: string): string {
  return `请输入${getPublishPlatformLabel(platformKey)}${getRequiredFieldLabel(FIELD_ID_TITLE)}`;
}
