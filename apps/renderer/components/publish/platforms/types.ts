import type { ReactNode } from "react";

import type { PublishEditPlatform } from "@/lib/api/publish";

export type PublishPlatformKey =
  | "toutiao"
  | "rednote"
  | "xiaohongshu"
  | "zhihu"
  | "wechat_mp"
  | "csdn"
  | "baijiahao"
  | "douyin"
  | "wechat_channels"
  | "zhixunbao";

export type PublishFieldOptionItem = {
  key: string;
  value: unknown;
};

export type PublishPlatformMeta = {
  id: PublishPlatformKey;
  label: string;
  pickerLabel?: string;
  logoPath: string;
  optionOrder?: string[];
  pickerVisible?: boolean;
};

export type PublishFieldRenderProps = {
  platformKey: string;
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
  coverImages: string[];
  openCoverPickerForAdd: () => void;
  openCoverPickerForReplace: (index: number) => void;
  removeCoverImage: (index: number) => void;
};

export type PublishPlatformInitArgs = {
  platformData: PublishEditPlatform;
  orderedOptions: PublishFieldOptionItem[];
  title: string;
  contentImageUrls: string[];
};

export type PublishPlatformValidationArgs = {
  formValues: Record<string, unknown>;
  selectedAccountIds: string[];
  coverImages: string[];
  platformData: PublishEditPlatform;
};

export type PublishPlatformNormalizeArgs = {
  formValues: Record<string, unknown>;
  coverImages: string[];
  platformData: PublishEditPlatform;
};

export type PublishPlatformModule = {
  ids: PublishPlatformKey[];
  optionOrder?: string[];
  getOptionKeys?: (options: Record<string, unknown>) => string[];
  isOptionVisible?: (fieldKey: string) => boolean;
  getInlineFieldKeys?: () => string[];
  getFieldLabel?: (fieldKey: string) => string | undefined;
  getRequiredFields?: () => string[];
  getFieldError?: (fieldKey: string, value: unknown) => string;
  getTitleMaxLength?: () => number | undefined;
  getInitialFormValues?: (
    args: PublishPlatformInitArgs,
  ) => Record<string, unknown>;
  getInitialCoverImages?: (args: PublishPlatformInitArgs) => string[];
  getCoverSlotCount?: (formValues: Record<string, unknown>) => number;
  validateBeforePublish?: (args: PublishPlatformValidationArgs) => string | null;
  normalizePlatformOptions?: (
    args: PublishPlatformNormalizeArgs,
  ) => Record<string, unknown>;
  renderField?: (props: PublishFieldRenderProps) => ReactNode | null;
};
