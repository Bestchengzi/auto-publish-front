import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { PublishCoverImageField } from "../platform-cover-field";
import type { PublishPlatformModule } from "../types";
import { FIELD_ID_TITLE, getTitleFieldError } from "../utils";

const FIELD_ID_COVER_LAYOUT = "cover_layout";

const BAIJIAHAO_OPTION_ORDER = [FIELD_ID_COVER_LAYOUT] as const;
const BAIJIAHAO_ALLOWED_FIELD_IDS = new Set<string>(BAIJIAHAO_OPTION_ORDER);

function normalizeBaijiahaoCoverLayout(value: unknown): "one" | "three" {
  if (value === "one" || value === "single" || value === "单图") return "one";
  if (value === "three" || value === "三图") return "three";
  return "one";
}

function getBaijiahaoCoverImages(platformData: {
  platform_options?: Record<string, unknown>;
}): string[] {
  const rawCoverImages = platformData.platform_options?.cover_images;
  if (!Array.isArray(rawCoverImages)) return [];

  return rawCoverImages
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";

      const record = item as Record<string, unknown>;
      const src = record.src ?? record.origin_src;
      return typeof src === "string" ? src.trim() : "";
    })
    .filter(Boolean);
}

function getDefaultBaijiahaoCoverLayout(imageCount: number): "one" | "three" {
  if (imageCount >= 3) return "three";
  return "one";
}

function getBaijiahaoFieldLabel(fieldKey: string): string | undefined {
  if (fieldKey === FIELD_ID_COVER_LAYOUT) return "设置封面";
  return undefined;
}

function getBaijiahaoCoverImageError(
  coverLayout: unknown,
  coverImageCount: number,
): string {
  const layout = normalizeBaijiahaoCoverLayout(coverLayout);
  if (layout === "one" && coverImageCount < 1) {
    return "请选择一张展示封面";
  }
  if (layout === "three" && coverImageCount < 3) {
    return "请选择三张展示封面";
  }
  return "";
}

export const baijiahaoPlatformModule: PublishPlatformModule = {
  ids: ["baijiahao"],
  optionOrder: [...BAIJIAHAO_OPTION_ORDER],
  getOptionKeys: (options) =>
    Array.from(
      new Set([
        ...BAIJIAHAO_OPTION_ORDER,
        ...Object.keys(options).filter((key) =>
          BAIJIAHAO_ALLOWED_FIELD_IDS.has(key),
        ),
      ]),
    ),
  isOptionVisible: (fieldKey) => BAIJIAHAO_ALLOWED_FIELD_IDS.has(fieldKey),
  getFieldLabel: getBaijiahaoFieldLabel,
  getRequiredFields: () => [FIELD_ID_COVER_LAYOUT],
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("baijiahao", value);
    }
    if (fieldKey === FIELD_ID_COVER_LAYOUT) {
      return value ? "" : "请选择百家号设置封面";
    }
    return "";
  },
  getTitleMaxLength: () => 64,
  getInitialFormValues: ({ platformData, orderedOptions, title, contentImageUrls }) => {
    const initialCoverImages = getBaijiahaoCoverImages(platformData);
    const fallbackLayout = getDefaultBaijiahaoCoverLayout(
      initialCoverImages.length || contentImageUrls.length,
    );
    const defaults: Record<string, unknown> = {
      [FIELD_ID_TITLE]: title,
      [FIELD_ID_COVER_LAYOUT]: fallbackLayout,
    };

    for (const option of orderedOptions) {
      const hasOptionValue =
        typeof option.value === "string"
          ? option.value.trim().length > 0
          : option.value != null;
      defaults[option.key] =
        option.key === FIELD_ID_COVER_LAYOUT
          ? hasOptionValue
            ? normalizeBaijiahaoCoverLayout(option.value)
            : fallbackLayout
          : option.value;
    }

    return defaults;
  },
  getInitialCoverImages: ({ platformData, contentImageUrls }) => {
    const initialCoverImages = getBaijiahaoCoverImages(platformData);
    return (initialCoverImages.length ? initialCoverImages : contentImageUrls).slice(
      0,
      3,
    );
  },
  getCoverSlotCount: (formValues) => {
    const coverLayout = normalizeBaijiahaoCoverLayout(
      formValues[FIELD_ID_COVER_LAYOUT],
    );
    if (coverLayout === "one") return 1;
    return 3;
  },
  validateBeforePublish: ({ formValues, coverImages }) =>
    getBaijiahaoCoverImageError(
      formValues[FIELD_ID_COVER_LAYOUT],
      coverImages.length,
    ),
  normalizePlatformOptions: ({ formValues, coverImages }) => {
    const coverLayout = normalizeBaijiahaoCoverLayout(
      formValues[FIELD_ID_COVER_LAYOUT],
    );

    return {
      cover_layout: coverLayout,
      cover_images:
        coverLayout === "one"
            ? coverImages.slice(0, 1)
            : coverImages.slice(0, 3),
    };
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
    if (fieldKey !== FIELD_ID_COVER_LAYOUT) return null;

    const coverLayout = normalizeBaijiahaoCoverLayout(value);
    const coverSlotCount = coverLayout === "one" ? 1 : 3;

    return (
      <div className="space-y-3">
        <RadioGroup
          value={coverLayout}
          onValueChange={(nextValue: string) => onChange(nextValue)}
          onBlur={onBlur}
          className="h-9 items-center gap-6"
        >
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <RadioGroupItem value="one" />
            <span>单图</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-sm">
            <RadioGroupItem value="three" />
            <span>三图</span>
          </label>
        </RadioGroup>
        <PublishCoverImageField
          slotCount={coverSlotCount}
          coverImages={coverImages}
          helperText="优质的封面有利于推荐，格式支持 JPG、JPEG、PNG"
          onAdd={openCoverPickerForAdd}
          onReplace={openCoverPickerForReplace}
          onRemove={removeCoverImage}
        />
      </div>
    );
  },
};
