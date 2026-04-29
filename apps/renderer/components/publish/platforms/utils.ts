import type { PublishPlatformKey } from "./types";

export const FIELD_ID_ACCOUNT = "__account__";
export const FIELD_ID_TITLE = "__title__";
export const FIELD_ID_COVER_MODE = "cover_mode";
export const FIELD_ID_ENABLE_AD = "enable_ad";

export const HIDDEN_PLATFORM_FIELD_IDS = new Set([
  "info_source",
  "source_author_uid",
]);

export const TOUTIAO_WORK_STATEMENT_OPTIONS = [
  "取材网络",
  "个人观点，仅供参考",
  "引用AI",
  "虚构演绎，故事经过",
  "投资观点，仅供参考",
  "健康医疗分享，仅供参考",
] as const;

export const WECHAT_CLAIM_SOURCE_OPTIONS = [
  "无需声明",
  "内容由AI生成",
  "素材来源官方媒体/网络新闻",
  "内容剧情演绎，仅供娱乐",
  "个人观点，仅供参考",
  "健康医疗分享，仅供参考",
  "投资观点，仅供参考",
] as const;

export const REDNOTE_PRIVACY_OPTIONS: Array<{
  value: "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE";
  label: string;
}> = [
  { value: "PUBLIC", label: "公开可见" },
  { value: "PRIVATE", label: "仅自己可见" },
  { value: "PARTIALLY_VISIBLE", label: "仅互关好友可见" },
];

const FIELD_LABELS: Record<string, string> = {
  article_id: "Article Id",
  description: "Description",
  tags: "Tags",
  categories: "Categories",
  cover_image: "添加封面",
  article_type: "Article Type",
  read_type: "Read Type",
  creation_statement: "Creation Statement",
  scheduled_at: "Scheduled At",
  scheduled_time: "Scheduled Time",
  abstract: "摘要",
  cover_layout: "展示封面",
  cover_images: "封面",
  feed_cat: "分类",
  activity_list: "活动投票",
  declare_aigc: "声明AIGC",
  auto_tts: "AI配音",
  creative_method: "创作方式",
  original_announce: "原创声明",
  event_spec: "事件来源说明",
  settings: "设置",
  cover_mode: "展示封面",
  enable_ad: "投放广告",
  first_publish: "声明首发",
  sync_to_weitoutiao: "同时发布微头条",
  work_statement: "作品声明",
  info_source: "信息来源",
  source_author_uid: "站内作者UID",
  privacy: "可见范围",
  note_copyable: "允许正文复制",
  original: "原创",
  enable_comment: "开启留言",
  claim_source: "创作来源",
  platform_recommend: "平台推荐",
};

export function getPublishFieldLabel(fieldKey: string): string {
  return (
    FIELD_LABELS[fieldKey] ??
    fieldKey.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())
  );
}

export function getRequiredFieldLabel(fieldId: string): string {
  if (fieldId === FIELD_ID_ACCOUNT) return "发布账号";
  if (fieldId === FIELD_ID_TITLE) return "标题";
  if (fieldId === FIELD_ID_ENABLE_AD) return "投放广告";
  return getPublishFieldLabel(fieldId);
}

export function getMissingFieldError(fieldId: string): string {
  const label = getRequiredFieldLabel(fieldId);
  if (fieldId === FIELD_ID_COVER_MODE || fieldId === FIELD_ID_ENABLE_AD) {
    return `请选择${label}`;
  }
  return `请输入${label}`;
}

export function getOptionFallbackValue(fieldKey: string): unknown {
  if (fieldKey === "enable_comment") return false;
  if (fieldKey === "platform_recommend") return true;
  if (fieldKey === "claim_source") return "无需声明";
  if (fieldKey === "enable_ad") return false;
  if (fieldKey === "cover_mode") return "single";
  if (fieldKey === "privacy") return "PUBLIC";
  return "";
}

export function extractTitleFromMarkdown(content: string): string {
  const lines = content.split("\n");
  const h1 = lines.find((line) => line.trim().startsWith("# "));
  if (h1) return h1.replace(/^#\s+/, "").trim();
  return "";
}

export function extractImageUrlsFromContent(content: string): string[] {
  const urls: string[] = [];
  const markdownImageRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlImageRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  while ((match = markdownImageRegex.exec(content))) {
    if (match[1]) urls.push(match[1]);
  }
  while ((match = htmlImageRegex.exec(content))) {
    if (match[1]) urls.push(match[1]);
  }

  return Array.from(new Set(urls));
}

export function countVisibleTextCharsWithoutImageUrls(content: string): number {
  const withoutMarkdownImages = content.replace(
    /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,
    "",
  );
  const withoutHtmlImageTags = withoutMarkdownImages.replace(
    /<img[^>]*src=["'][^"']+["'][^>]*>/gi,
    "",
  );
  const withoutHttpUrls = withoutHtmlImageTags.replace(/https?:\/\/\S+/g, "");
  return withoutHttpUrls.replace(/\s+/g, "").length;
}

export function getDefaultToutiaoCoverMode(
  imageCount: number,
): "single" | "three" | "none" {
  if (imageCount <= 0) return "none";
  if (imageCount === 1) return "single";
  return "three";
}

export function toBooleanField(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

export function normalizeRednotePrivacy(
  value: unknown,
): "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE" {
  if (value === "PUBLIC" || value === "公开") return "PUBLIC";
  if (value === "PRIVATE" || value === "私密") return "PRIVATE";
  if (value === "PARTIALLY_VISIBLE" || value === "关注可见") {
    return "PARTIALLY_VISIBLE";
  }
  return "PUBLIC";
}

export function toAccountPlatform(platform: string): string {
  if (platform === "xiaohongshu") return "rednote";
  return platform;
}

export function isZhihuPlatform(platform: string): boolean {
  return platform === "zhihu";
}

export function getToutiaoCoverImageError(
  coverMode: unknown,
  coverImageCount: number,
): string {
  const mode = typeof coverMode === "string" ? coverMode : "";
  if (mode === "single" && coverImageCount < 1) {
    return "请选择一张展示封面";
  }
  if (mode === "three" && coverImageCount < 3) {
    return "请选择三张展示封面";
  }
  return "";
}

export function getTitleMaxLengthByPlatform(
  platform: string,
): number | undefined {
  if (platform === "toutiao") return 30;
  if (platform === "rednote" || platform === "xiaohongshu") return 20;
  if (platform === "zhihu") return 100;
  if (platform === "wechat_mp") return 64;
  if (platform === "baijiahao") return 64;
  return undefined;
}

const TITLE_ERROR_PLATFORM_LABELS: Record<string, string> = {
  toutiao: "头条号",
  rednote: "小红书",
  xiaohongshu: "小红书",
  zhihu: "知乎",
  wechat_mp: "公众号",
  csdn: "CSDN",
  baijiahao: "百家号",
};

function getPlatformTitleRequiredError(platformKey: string): string {
  const platformLabel = TITLE_ERROR_PLATFORM_LABELS[platformKey];
  if (!platformLabel) {
    return getMissingFieldError(FIELD_ID_TITLE);
  }
  return `请输入${platformLabel}标题`;
}

export function getTitleFieldError(
  platformKey: string,
  value: unknown,
): string {
  const textValue = typeof value === "string" ? value.trim() : "";
  if (!textValue) {
    return getPlatformTitleRequiredError(platformKey);
  }

  const maxLength = getTitleMaxLengthByPlatform(platformKey);
  const length = [...textValue].length;
  if (platformKey === "toutiao" && (length < 2 || length > 30)) {
    return "标题需为 2-30 个字";
  }
  if (platformKey === "baijiahao" && (length < 2 || length > 64)) {
    return "标题需为 2-64 个字";
  }
  if (
    (platformKey === "rednote" || platformKey === "xiaohongshu") &&
    maxLength &&
    length > maxLength
  ) {
    return `标题最多 ${maxLength} 个字`;
  }
  if (platformKey === "zhihu" && maxLength && length > maxLength) {
    return `标题最多 ${maxLength} 个字`;
  }
  if (platformKey === "wechat_mp" && maxLength && length > maxLength) {
    return `标题最多 ${maxLength} 个字`;
  }
  return "";
}

export function getPickerLabel(
  platformKey: PublishPlatformKey,
  fallback: string,
): string {
  return fallback;
}
