import type { PublishPlatformModule } from "../types";
import { PublishCoverImageField } from "../platform-cover-field";
import { FIELD_ID_TITLE, getPublishFieldLabel, getTitleFieldError } from "../utils";

export const zhihuPlatformModule: PublishPlatformModule = {
  ids: ["zhihu"],
  getOptionKeys: (options) =>
    Array.from(new Set([...Object.keys(options).filter((key) => key === "cover_image"), "cover_image"])),
  isOptionVisible: (fieldKey) => fieldKey === "cover_image",
  getFieldLabel: getPublishFieldLabel,
  getFieldError: (fieldKey, value) => {
    if (fieldKey === FIELD_ID_TITLE) {
      return getTitleFieldError("zhihu", value);
    }
    return "";
  },
  getTitleMaxLength: () => 100,
  getInitialCoverImages: ({ platformData, contentImageUrls }) => {
    const coverImage =
      typeof platformData.platform_options?.cover_image === "string"
        ? platformData.platform_options.cover_image
        : "";
    return coverImage ? [coverImage] : contentImageUrls.slice(0, 1);
  },
  getCoverSlotCount: () => 1,
  normalizePlatformOptions: ({ coverImages }) => ({
    cover_image: coverImages[0] ?? "",
  }),
  renderField: ({
    fieldKey,
    coverImages,
    openCoverPickerForAdd,
    openCoverPickerForReplace,
    removeCoverImage,
  }) => {
    if (fieldKey !== "cover_image") return null;

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
  },
};
