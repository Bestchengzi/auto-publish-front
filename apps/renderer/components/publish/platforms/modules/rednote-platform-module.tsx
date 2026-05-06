import { PlusIcon } from "lucide-react";
import Image from "next/image";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

import type { PublishPlatformModule } from "../types";
import {
  FIELD_ID_TITLE,
  REDNOTE_PRIVACY_OPTIONS,
  countVisibleTextCharsWithoutImageUrls,
  getPublishFieldLabel,
  getTitleFieldError,
  normalizeRednotePrivacy,
  toBooleanField,
} from "../utils";

const REDNOTE_IMAGE_CARDS_FIELD_ID = "image_cards";
const REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT = 18;
const REDNOTE_ALLOWED_FIELD_IDS = new Set([
  REDNOTE_IMAGE_CARDS_FIELD_ID,
  "privacy",
  "original",
  "note_copyable",
]);

function isRednoteImageCardsOptions(options: Record<string, unknown>) {
  return (
    options[REDNOTE_IMAGE_CARDS_FIELD_ID] === true ||
    Array.isArray(options.images)
  );
}

function getRednoteImageCardsImages(platformData: {
  platform_options?: Record<string, unknown>;
}) {
  const rawImages = platformData.platform_options?.images;
  if (!Array.isArray(rawImages)) return [];

  return rawImages
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT);
}

function RednoteImageCardsImageField({
  images,
  onAdd,
  onReplace,
  onRemove,
}: {
  images: string[];
  onAdd: () => void;
  onReplace: (index: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-3">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="group relative aspect-square w-full overflow-hidden rounded-md border border-border bg-muted"
          >
            <Image
              src={image}
              alt={`图片${index + 1}`}
              fill
              unoptimized
              className="object-cover"
              sizes="92px"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
              <div className="flex items-center rounded-md bg-black/55 px-2 py-1 text-xs text-white shadow-sm">
                <button
                  type="button"
                  className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                  onClick={() => onReplace(index)}
                >
                  替换
                </button>
                <span className="mx-1.5 text-white/80" aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                  onClick={() => onRemove(index)}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        ))}
        {images.length < REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT ? (
          <button
            type="button"
            className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
            onClick={onAdd}
            aria-label="添加图片"
          >
            <PlusIcon className="size-7" />
          </button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        已选 {images.length}/{REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT}，最多支持{" "}
        {REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT} 张图片
      </p>
    </div>
  );
}

export const rednotePlatformModule: PublishPlatformModule = {
  ids: ["rednote", "xiaohongshu"],
  optionOrder: [
    REDNOTE_IMAGE_CARDS_FIELD_ID,
    "privacy",
    "original",
    "note_copyable",
  ],
  getInlineFieldKeys: () => ["original", "note_copyable"],
  getOptionKeys: (options) =>
    Array.from(
      new Set([
        REDNOTE_IMAGE_CARDS_FIELD_ID,
        ...Object.keys(options).filter((key) => REDNOTE_ALLOWED_FIELD_IDS.has(key)),
        "privacy",
        "original",
        "note_copyable",
      ]),
    ),
  isOptionVisible: (fieldKey) => REDNOTE_ALLOWED_FIELD_IDS.has(fieldKey),
  getFieldLabel: (fieldKey) =>
    fieldKey === REDNOTE_IMAGE_CARDS_FIELD_ID
      ? "展示封面"
      : getPublishFieldLabel(fieldKey),
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("rednote", value);
    }
    return "";
  },
  getTitleMaxLength: () => 20,
  getInitialFormValues: ({ platformData, orderedOptions, title }) => {
    const defaults: Record<string, unknown> = {
      [FIELD_ID_TITLE]: title,
    };
    const hasImageCards = isRednoteImageCardsOptions(
      platformData.platform_options ?? {},
    );

    for (const option of orderedOptions) {
      defaults[option.key] =
        option.key === REDNOTE_IMAGE_CARDS_FIELD_ID
          ? hasImageCards || option.value !== false
          : option.value;
    }

    return defaults;
  },
  getInitialCoverImages: ({ platformData, contentImageUrls }) => {
    const optionImages = getRednoteImageCardsImages(platformData);
    return optionImages.length > 0
      ? optionImages
      : contentImageUrls.slice(0, REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT);
  },
  getCoverSlotCount: (formValues) =>
    formValues[REDNOTE_IMAGE_CARDS_FIELD_ID] === false
      ? 0
      : REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT,
  validateBeforePublish: ({ formValues, coverImages, platformData }) => {
    if (
      formValues[REDNOTE_IMAGE_CARDS_FIELD_ID] !== false &&
      coverImages.length === 0
    ) {
      return "请至少添加 1 张小红书图片";
    }

    const contentLength = countVisibleTextCharsWithoutImageUrls(
      platformData.content,
    );
    return contentLength > 1000 ? "小红书正文最多 1000 字" : null;
  },
  normalizePlatformOptions: ({ formValues, coverImages }) => {
    const normalized: Record<string, unknown> = {
      privacy: normalizeRednotePrivacy(formValues.privacy),
      original: toBooleanField(formValues.original),
      note_copyable: toBooleanField(formValues.note_copyable),
    };

    normalized[REDNOTE_IMAGE_CARDS_FIELD_ID] =
      formValues[REDNOTE_IMAGE_CARDS_FIELD_ID] !== false;
    normalized.images = coverImages.slice(0, REDNOTE_IMAGE_CARDS_MAX_IMAGE_COUNT);

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
    if (fieldKey === REDNOTE_IMAGE_CARDS_FIELD_ID) {
      return (
        <RednoteImageCardsImageField
          images={coverImages}
          onAdd={openCoverPickerForAdd}
          onReplace={openCoverPickerForReplace}
          onRemove={removeCoverImage}
        />
      );
    }

    if (fieldKey === "privacy") {
      return (
        <RadioGroup
          value={normalizeRednotePrivacy(value)}
          onValueChange={(nextValue: string) =>
            onChange(
              nextValue as "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE",
            )
          }
          onBlur={onBlur}
          className="h-9 items-center gap-6"
        >
          {REDNOTE_PRIVACY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <RadioGroupItem value={option.value} />
              <span>{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      );
    }

    if (fieldKey === "original" || fieldKey === "note_copyable") {
      return (
        <Switch
          checked={toBooleanField(value)}
          onCheckedChange={onChange}
          aria-label={getPublishFieldLabel(fieldKey)}
        />
      );
    }

    return null;
  },
};
