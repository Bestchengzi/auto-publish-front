import { useMemo, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import csdnTagsJson from "../data/csdn-tags.json";
import { PublishCoverImageField } from "../platform-cover-field";
import type { PublishPlatformModule } from "../types";
import { FIELD_ID_TITLE, getTitleFieldError } from "../utils";

const CSDN_OPTION_ORDER = [
  "tags",
  "cover_image",
  "description",
  "categories",
  "read_type",
] as const;

const CSDN_ALLOWED_FIELD_IDS = new Set<string>(CSDN_OPTION_ORDER);
const CSDN_MAX_TAG_COUNT = 7;
const CSDN_DESCRIPTION_MAX_LENGTH = 256;

const CSDN_READ_TYPE_OPTIONS = [
  { value: "public", label: "全部可见" },
  { value: "private", label: "仅我可见" },
  { value: "fans", label: "粉丝可见" },
  { value: "vip", label: "VIP可见" },
] as const;

function normalizeCsdnReadType(value: unknown): string {
  if (
    typeof value === "string" &&
    CSDN_READ_TYPE_OPTIONS.some((option) => option.value === value)
  ) {
    return value;
  }
  return "public";
}

type CsdnTagsPayload = {
  data?: {
    common?: string[];
    list?: Record<string, string[]>;
  };
};

const csdnTagsData = csdnTagsJson as CsdnTagsPayload;

const CSDN_TAG_GROUPS = csdnTagsData.data?.list ?? {};
const CSDN_COMMON_TAGS = csdnTagsData.data?.common ?? [];
const CSDN_TAG_GROUP_NAMES = Object.keys(CSDN_TAG_GROUPS);
const CSDN_ALL_TAGS = Array.from(
  new Set([
    ...CSDN_COMMON_TAGS,
    ...Object.values(CSDN_TAG_GROUPS).flat(),
  ]),
);

function normalizeCsdnTags(value: unknown): string[] {
  const rawTags = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return Array.from(
    new Set(
      rawTags
        .map((tag) => String(tag).trim())
        .filter(Boolean),
    ),
  ).slice(0, CSDN_MAX_TAG_COUNT);
}

function getStringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getCsdnFieldLabel(fieldKey: string): string | undefined {
  if (fieldKey === "tags") return "文章标签";
  if (fieldKey === "cover_image") return "添加封面";
  if (fieldKey === "description") return "文章摘要";
  if (fieldKey === "categories") return "分类专栏";
  if (fieldKey === "read_type") return "可见范围";
  return undefined;
}

function CsdnTagsField({
  value,
  onChange,
  onBlur,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const selectedTags = normalizeCsdnTags(value);
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState(
    CSDN_TAG_GROUP_NAMES[0] ?? "推荐",
  );
  const [searchValue, setSearchValue] = useState("");
  const remainingCount = CSDN_MAX_TAG_COUNT - selectedTags.length;

  const visibleTags = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();
    const sourceTags = keyword
      ? CSDN_ALL_TAGS.filter((tag) => tag.toLowerCase().includes(keyword))
      : activeGroup === "推荐"
        ? CSDN_COMMON_TAGS
        : CSDN_TAG_GROUPS[activeGroup] ?? [];

    return Array.from(new Set(sourceTags)).slice(0, 80);
  }, [activeGroup, searchValue]);

  const addTag = (rawTag: string) => {
    const nextTag = rawTag.trim();
    if (!nextTag || selectedTags.includes(nextTag) || remainingCount <= 0) {
      return;
    }
    onChange([...selectedTags, nextTag]);
    setSearchValue("");
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((item) => item !== tag));
  };

  return (
    <div className="flex min-h-8 flex-wrap items-center gap-2">
      {selectedTags.map((tag) => (
        <span
          key={tag}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 text-sm text-sky-700"
        >
          {tag}
          <button
            type="button"
            className="grid size-4 cursor-pointer place-items-center rounded-sm text-sky-500 transition-colors hover:bg-sky-100 hover:text-sky-700"
            onClick={() => removeTag(tag)}
            aria-label={`删除${tag}`}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) onBlur();
        }}
      >
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 rounded-md px-2 text-sm font-normal"
            >
              <PlusIcon className="size-3.5" />
              添加文章标签
            </Button>
          }
        />
        <PopoverContent
          side="bottom"
          align="center"
          sideOffset={8}
          className="w-[620px] rounded-none p-0"
        >
          <div className="flex h-[390px] flex-col bg-background">
            <div className="relative border-b border-border px-4 py-3 text-center text-base font-medium">
              标签
              <button
                type="button"
                className="absolute right-3 top-3 grid size-5 cursor-pointer place-items-center text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setOpen(false)}
                aria-label="关闭标签选择"
              >
                <XIcon className="size-4" />
              </button>
            </div>

            <div className="px-4 pt-3">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  addTag(searchValue);
                }}
                placeholder="请输入文字搜索，Enter键入可添加自定义标签"
                className="h-9"
              />
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-[150px_1fr] gap-4 px-4 py-4">
              <div className="min-h-0 overflow-y-auto border-r border-border pr-3">
                {CSDN_TAG_GROUP_NAMES.map((groupName) => (
                  <button
                    key={groupName}
                    type="button"
                    className={cn(
                      "block h-8 w-full cursor-pointer truncate text-left text-sm transition-colors hover:text-primary",
                      activeGroup === groupName
                        ? "font-medium text-primary"
                        : "text-muted-foreground",
                    )}
                    onClick={() => {
                      setActiveGroup(groupName);
                      setSearchValue("");
                    }}
                  >
                    {groupName}
                  </button>
                ))}
              </div>

              <div className="min-h-0 overflow-y-auto pr-1">
                <div className="mb-2 text-sm text-foreground">
                  {searchValue.trim() ? "搜索结果" : "添加标签"}
                </div>
                <div className="flex flex-wrap gap-3">
                  {visibleTags.map((tag) => {
                    const selected = selectedTags.includes(tag);
                    const disabled = selected || remainingCount <= 0;

                    return (
                      <button
                        key={tag}
                        type="button"
                        className={cn(
                          "h-6 cursor-pointer rounded-sm bg-sky-50 px-2 text-sm text-sky-700 transition-colors hover:bg-sky-100",
                          disabled && "cursor-not-allowed opacity-45 hover:bg-sky-50",
                        )}
                        disabled={disabled}
                        onClick={() => addTag(tag)}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="border-t border-border px-4 py-2 text-right text-xs text-muted-foreground">
              还可添加{remainingCount}个标签
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const csdnPlatformModule: PublishPlatformModule = {
  ids: ["csdn"],
  optionOrder: [...CSDN_OPTION_ORDER],
  getOptionKeys: (options) =>
    Array.from(
      new Set([
        ...CSDN_OPTION_ORDER,
        ...Object.keys(options).filter((key) => CSDN_ALLOWED_FIELD_IDS.has(key)),
      ]),
    ),
  isOptionVisible: (fieldKey) => CSDN_ALLOWED_FIELD_IDS.has(fieldKey),
  getFieldLabel: getCsdnFieldLabel,
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("csdn", value);
    }
    if (fieldKey === "tags") {
      return normalizeCsdnTags(value).length > 0 ? "" : "请选择文章标签";
    }
    if (fieldKey === "description") {
      return [...getStringValue(value)].length <= CSDN_DESCRIPTION_MAX_LENGTH
        ? ""
        : `文章摘要最多 ${CSDN_DESCRIPTION_MAX_LENGTH} 个字`;
    }
    return "";
  },
  getRequiredFields: () => ["tags"],
  getInitialFormValues: ({ orderedOptions, title }) => {
    const values: Record<string, unknown> = {
      [FIELD_ID_TITLE]: title,
      tags: [],
      read_type: "public",
    };

    for (const option of orderedOptions) {
      values[option.key] =
        option.key === "read_type"
          ? normalizeCsdnReadType(option.value)
          : option.key === "tags"
            ? normalizeCsdnTags(option.value)
          : option.value;
    }

    return values;
  },
  getInitialCoverImages: ({ platformData, contentImageUrls }) => {
    const coverImage =
      typeof platformData.platform_options?.cover_image === "string"
        ? platformData.platform_options.cover_image
        : "";
    return coverImage ? [coverImage] : contentImageUrls.slice(0, 1);
  },
  getCoverSlotCount: () => 1,
  normalizePlatformOptions: ({ formValues, coverImages }) => ({
    tags: normalizeCsdnTags(formValues.tags).join(","),
    cover_image: coverImages[0] ?? "",
    description:
      typeof formValues.description === "string"
        ? formValues.description.trim()
        : "",
    categories:
      typeof formValues.categories === "string"
        ? formValues.categories.trim()
        : "",
    read_type: normalizeCsdnReadType(formValues.read_type),
  }),
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
    if (fieldKey === "tags") {
      return (
        <CsdnTagsField value={value} onChange={onChange} onBlur={onBlur} />
      );
    }

    if (fieldKey === "cover_image") {
      return (
        <PublishCoverImageField
          slotCount={1}
          coverImages={coverImages}
          helperText="优质的封面有利于推荐，格式支持 JPG、JPEG、PNG"
          onAdd={openCoverPickerForAdd}
          onReplace={openCoverPickerForReplace}
          onRemove={removeCoverImage}
        />
      );
    }

    if (fieldKey === "description") {
      const textValue = getStringValue(value);
      return (
        <div className="relative">
          <Textarea
            value={textValue}
            maxLength={CSDN_DESCRIPTION_MAX_LENGTH}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            placeholder="请输入文章摘要"
            className="min-h-24 pb-7"
          />
          <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-muted-foreground">
            {[...textValue].length}/{CSDN_DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      );
    }

    if (fieldKey === "categories") {
      return (
        <Input
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder="请输入分类专栏，多个用英文逗号隔开"
        />
      );
    }

    if (fieldKey === "read_type") {
      return (
        <RadioGroup
          value={normalizeCsdnReadType(value)}
          onValueChange={onChange}
          onBlur={onBlur}
          className="h-9 items-center gap-6"
        >
          {CSDN_READ_TYPE_OPTIONS.map((option) => (
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

    return null;
  },
};
