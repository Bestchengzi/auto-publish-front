import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { PublishPlatformModule } from "../types";
import { PublishCoverImageField } from "../platform-cover-field";
import {
  FIELD_ID_COVER_MODE,
  FIELD_ID_ENABLE_AD,
  FIELD_ID_TITLE,
  TOUTIAO_WORK_STATEMENT_OPTIONS,
  getDefaultToutiaoCoverMode,
  getMissingFieldError,
  getPublishFieldLabel,
  getTitleFieldError,
  getToutiaoCoverImageError,
  toBooleanField,
} from "../utils";

const REMOVED_TOUTIAO_FIELD_IDS = new Set([
  "position",
  "collection_id",
  "sync_to_weitoutiao",
]);

export const toutiaoPlatformModule: PublishPlatformModule = {
  ids: ["toutiao"],
  isOptionVisible: (fieldKey) => !REMOVED_TOUTIAO_FIELD_IDS.has(fieldKey),
  getFieldLabel: getPublishFieldLabel,
  getRequiredFields: () => [FIELD_ID_COVER_MODE, FIELD_ID_ENABLE_AD],
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("toutiao", value);
    }
    if (fieldKey === FIELD_ID_COVER_MODE) {
      return typeof value === "string" && value ? "" : getMissingFieldError(fieldKey);
    }
    if (fieldKey === FIELD_ID_ENABLE_AD) {
      return typeof value === "boolean" ? "" : getMissingFieldError(fieldKey);
    }
    return "";
  },
  getTitleMaxLength: () => 30,
  getInitialFormValues: ({ orderedOptions, title, contentImageUrls }) => {
    const defaults: Record<string, unknown> = {
      [FIELD_ID_TITLE]: title,
    };
    const defaultCoverMode = getDefaultToutiaoCoverMode(contentImageUrls.length);

    for (const option of orderedOptions) {
      defaults[option.key] =
        option.key === FIELD_ID_COVER_MODE ? defaultCoverMode : option.value;
    }

    return defaults;
  },
  getInitialCoverImages: ({ contentImageUrls }) => contentImageUrls.slice(0, 3),
  getCoverSlotCount: (formValues) => {
    const coverMode = (formValues[FIELD_ID_COVER_MODE] as string) || "single";
    if (coverMode === "none") return 0;
    if (coverMode === "single") return 1;
    return 3;
  },
  validateBeforePublish: ({ formValues, coverImages }) => {
    const coverMode = formValues[FIELD_ID_COVER_MODE];
    if (!coverMode) {
      return "请选择头条号展示封面";
    }
    if (typeof formValues[FIELD_ID_ENABLE_AD] !== "boolean") {
      return "请选择头条号投放广告";
    }
    return getToutiaoCoverImageError(coverMode, coverImages.length);
  },
  normalizePlatformOptions: ({ formValues, coverImages }) => {
    const normalized: Record<string, unknown> = {};

    for (const [key, rawValue] of Object.entries(formValues)) {
      if (key === FIELD_ID_TITLE) continue;
      if (rawValue == null) continue;
      if (typeof rawValue === "string" && rawValue.trim() === "") continue;
      normalized[key] = rawValue;
    }

    if ("cover_mode" in normalized) {
      normalized.cover_mode = String(normalized.cover_mode);
    }
    if ("enable_ad" in normalized) {
      normalized.enable_ad = toBooleanField(normalized.enable_ad);
    }
    if ("first_publish" in normalized) {
      normalized.first_publish = toBooleanField(normalized.first_publish);
    }
    if ("sync_to_weitoutiao" in normalized) {
      normalized.sync_to_weitoutiao = toBooleanField(
        normalized.sync_to_weitoutiao,
      );
    }
    if ("work_statement" in normalized) {
      normalized.work_statement = String(normalized.work_statement);
    }

    const coverMode = String(formValues[FIELD_ID_COVER_MODE] ?? "");
    normalized.pgc_feed_covers =
      coverMode === "none"
        ? []
        : coverMode === "single"
          ? coverImages.slice(0, 1)
          : coverImages.slice(0, 3);

    return normalized;
  },
  renderField: ({
    fieldKey,
    value,
    onChange,
    onBlur,
    coverImages,
    openCoverPickerForAdd,
    openCoverPickerForReplace,
    removeCoverImage,
  }) => {
    if (fieldKey === FIELD_ID_COVER_MODE) {
      const coverMode = (value as string) || "single";
      const coverSlotCount =
        coverMode === "none" ? 0 : coverMode === "single" ? 1 : 3;

      return (
        <div className="space-y-3">
          <RadioGroup
            value={coverMode}
            onValueChange={(nextValue: string) => onChange(nextValue)}
            onBlur={onBlur}
            className="h-9 items-center gap-6"
          >
            <label className="flex cursor-pointer items-center gap-1.5 text-sm">
              <RadioGroupItem value="single" />
              <span>单图</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm">
              <RadioGroupItem value="three" />
              <span>三图</span>
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 text-sm">
              <RadioGroupItem value="none" />
              <span>无封面</span>
            </label>
          </RadioGroup>
          {coverMode !== "none" ? (
            <PublishCoverImageField
              slotCount={coverSlotCount}
              coverImages={coverImages}
              helperText="优质的封面有利于推荐，格式支持 JPG、JPEG、PNG"
              onAdd={openCoverPickerForAdd}
              onReplace={openCoverPickerForReplace}
              onRemove={removeCoverImage}
            />
          ) : null}
        </div>
      );
    }

    if (fieldKey === FIELD_ID_ENABLE_AD) {
      return (
        <RadioGroup
          value={toBooleanField(value) ? "true" : "false"}
          onValueChange={(nextValue: string) => onChange(nextValue === "true")}
          onBlur={onBlur}
          className="h-9 items-center gap-6"
        >
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <RadioGroupItem value="true" />
            <span>投放广告赚收益</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <RadioGroupItem value="false" />
            <span>不投放广告</span>
          </label>
        </RadioGroup>
      );
    }

    if (fieldKey === "first_publish") {
      return (
        <label className="inline-flex h-9 w-fit cursor-pointer items-center gap-2">
          <Checkbox
            checked={toBooleanField(value)}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
          <span className="text-sm">头条首发</span>
        </label>
      );
    }

    if (fieldKey === "sync_to_weitoutiao") {
      return (
        <label className="inline-flex h-9 w-fit cursor-pointer items-center gap-2">
          <Checkbox
            checked={toBooleanField(value)}
            onCheckedChange={(checked) => onChange(Boolean(checked))}
          />
          <span className="text-sm">发布得更多收益</span>
        </label>
      );
    }

    if (fieldKey === "work_statement") {
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          {TOUTIAO_WORK_STATEMENT_OPTIONS.map((option) => (
            <label
              key={option}
              className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={value === option}
                onCheckedChange={(checked) =>
                  onChange(Boolean(checked) ? option : "")
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      );
    }

    return null;
  },
};
