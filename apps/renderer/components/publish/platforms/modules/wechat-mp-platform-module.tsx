import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import type { PublishPlatformModule } from "../types";
import {
  FIELD_ID_TITLE,
  WECHAT_CLAIM_SOURCE_OPTIONS,
  getPublishFieldLabel,
  getTitleFieldError,
  toBooleanField,
} from "../utils";

const WECHAT_ALLOWED_FIELD_IDS = new Set([
  "enable_comment",
  "claim_source",
  "platform_recommend",
]);

export const wechatMpPlatformModule: PublishPlatformModule = {
  ids: ["wechat_mp"],
  getInlineFieldKeys: () => ["enable_comment", "platform_recommend"],
  getOptionKeys: (options) =>
    Array.from(
      new Set([
        ...Object.keys(options).filter((key) => WECHAT_ALLOWED_FIELD_IDS.has(key)),
        "claim_source",
        "enable_comment",
        "platform_recommend",
      ]),
    ),
  isOptionVisible: (fieldKey) => WECHAT_ALLOWED_FIELD_IDS.has(fieldKey),
  getFieldLabel: getPublishFieldLabel,
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("wechat_mp", value);
    }
    return "";
  },
  getTitleMaxLength: () => 64,
  normalizePlatformOptions: ({ formValues }) => ({
    enable_comment: toBooleanField(formValues.enable_comment),
    platform_recommend: toBooleanField(formValues.platform_recommend),
    claim_source:
      typeof formValues.claim_source === "string" && formValues.claim_source.trim()
        ? formValues.claim_source.trim()
        : "无需声明",
  }),
  renderField: ({ fieldKey, value, onChange }) => {
    if (fieldKey === "enable_comment" || fieldKey === "platform_recommend") {
      return (
        <Switch
          checked={toBooleanField(value)}
          onCheckedChange={onChange}
          aria-label={getPublishFieldLabel(fieldKey)}
        />
      );
    }

    if (fieldKey === "claim_source") {
      return (
        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          {WECHAT_CLAIM_SOURCE_OPTIONS.map((option) => (
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
