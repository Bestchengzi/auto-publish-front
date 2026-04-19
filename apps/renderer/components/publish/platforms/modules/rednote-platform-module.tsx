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

const REDNOTE_ALLOWED_FIELD_IDS = new Set([
  "privacy",
  "original",
  "note_copyable",
]);

export const rednotePlatformModule: PublishPlatformModule = {
  ids: ["rednote", "xiaohongshu"],
  getInlineFieldKeys: () => ["original", "note_copyable"],
  getOptionKeys: (options) =>
    Array.from(
      new Set([
        ...Object.keys(options).filter((key) => REDNOTE_ALLOWED_FIELD_IDS.has(key)),
        "privacy",
        "original",
        "note_copyable",
      ]),
    ),
  isOptionVisible: (fieldKey) => REDNOTE_ALLOWED_FIELD_IDS.has(fieldKey),
  getFieldLabel: getPublishFieldLabel,
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("rednote", value);
    }
    return "";
  },
  getTitleMaxLength: () => 20,
  validateBeforePublish: ({ platformData }) => {
    const contentLength = countVisibleTextCharsWithoutImageUrls(
      platformData.content,
    );
    return contentLength > 1000 ? "小红书正文最多 1000 字" : null;
  },
  normalizePlatformOptions: ({ formValues }) => ({
    privacy: normalizeRednotePrivacy(formValues.privacy),
    original: toBooleanField(formValues.original),
    note_copyable: toBooleanField(formValues.note_copyable),
  }),
  renderField: ({ fieldKey, value, onChange, onBlur }) => {
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
