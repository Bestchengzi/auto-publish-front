import { useTranslations } from "next-intl";

export type DynamicFieldValue = string | boolean;
export type DynamicFieldErrors = Record<string, string>;
export type DynamicFieldTouched = Record<string, boolean>;
export type TopicCenterTranslator = ReturnType<typeof useTranslations>;
export type ConnectionDialogMode = "create" | "edit";
export type FieldTarget = "config" | "secret";

export type ConnectionFormSubmitPayload = {
  provider_key: string;
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  default_query?: Record<string, unknown>;
};
