import {
  CheckIcon,
  ChevronLeftIcon,
  FilesIcon,
  Loader2Icon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { GroupImperativeHandle } from "react-resizable-panels";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConversationEmptyState } from "@/components/langgraph/ai-elements/conversation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlatformPickerDialog,
  type PickerPlatformItem,
} from "@/components/common/platform-picker-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  parsePublishThreadResponse,
  publishThreadArticle,
  type PublishEditAccount,
  type PublishEditPlatform,
  type PublishPlatformRequest,
  type PublishSummary,
} from "@/lib/api/publish";
import * as accountsApi from "@/lib/api/accounts";
import * as mediaApi from "@/lib/api/media";
import { getPlatformsWithNames } from "@/lib/platforms";
import { getApiErrorMessage } from "@/lib/request";
import { getBackendBaseURL } from "@/lib/langgraph/core/config";
import { uploadFiles } from "@/lib/langgraph/core/uploads/api";
import { cn } from "@/lib/utils";

import {
  ArtifactFileDetail,
  ArtifactFileList,
  useArtifacts,
} from "../artifacts";
import { useThread } from "../messages/context";

const CLOSE_MODE = { chat: 100, artifacts: 0 };
const OPEN_MODE = { chat: 50, artifacts: 50 };

const PLATFORM_LABELS: Record<string, string> = {
  toutiao: "头条号",
  csdn: "CSDN",
  baijiahao: "百家号",
  rednote: "小红书",
  xiaohongshu: "小红书",
  zhihu: "知乎",
  wechat_mp: "公众号",
  douyin: "抖音",
};

const PLATFORM_LOGO_PATHS: Record<string, string> = {
  toutiao: "/platform-logos/jin-ri-tou-tiao.png",
  csdn: "/platform-logos/CSDN.png",
  baijiahao: "/platform-logos/bai-jia-hao.png",
  rednote: "/platform-logos/xiao-hong-shu.png",
  xiaohongshu: "/platform-logos/xiao-hong-shu.png",
  zhihu: "/platform-logos/zhihu.png",
  wechat_mp: "/platform-logos/wei-xin-gong-zhong-hao.png",
  douyin: "/platform-logos/dou-yin.png",
};

const PLATFORM_OPTIONS_ORDER: Record<string, string[]> = {
  toutiao: [
    "cover_mode",
    "enable_ad",
    "first_publish",
    "work_statement",
    "info_source",
    "source_author_uid",
  ],
  csdn: [
    "article_id",
    "description",
    "tags",
    "categories",
    "cover_image",
    "article_type",
    "read_type",
    "creation_statement",
    "scheduled_at",
    "scheduled_time",
  ],
  baijiahao: [
    "abstract",
    "cover_layout",
    "cover_images",
    "feed_cat",
    "activity_list",
    "declare_aigc",
    "auto_tts",
    "creative_method",
    "original_announce",
    "event_spec",
    "settings",
  ],
  xiaohongshu: [
    "privacy",
    "original",
    "note_copyable",
  ],
  rednote: [
    "privacy",
    "original",
    "note_copyable",
  ],
  zhihu: ["cover_image"],
  wechat_mp: ["claim_source", "enable_comment", "platform_recommend"],
};

function prettyFieldName(field: string): string {
  const map: Record<string, string> = {
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
    activity_list: "活动投稿",
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
  return map[field] ?? field.replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase());
}

const TOUTIAO_WORK_STATEMENT_OPTIONS = [
  "取材网络",
  "个人观点，仅供参考",
  "引用AI",
  "虚构演绎，故事经历",
  "投资观点，仅供参考",
  "健康医疗分享，仅供参考",
] as const;
function extractTitleFromMarkdown(content: string): string {
  const lines = content.split("\n");
  const h1 = lines.find((line) => line.trim().startsWith("# "));
  if (h1) return h1.replace(/^#\s+/, "").trim();
  return "";
}

function extractImageUrlsFromContent(content: string): string[] {
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

function countVisibleTextCharsWithoutImageUrls(content: string): number {
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

function getDefaultToutiaoCoverMode(imageCount: number): "single" | "three" | "none" {
  if (imageCount <= 0) return "none";
  if (imageCount === 1) return "single";
  return "three";
}

const FIELD_ID_ACCOUNT = "__account__";
const FIELD_ID_TITLE = "__title__";
const FIELD_ID_COVER_MODE = "cover_mode";
const FIELD_ID_ENABLE_AD = "enable_ad";
const HIDDEN_PLATFORM_FIELD_IDS = new Set(["info_source", "source_author_uid"]);
const REMOVED_TOUTIAO_FIELD_IDS = new Set([
  "position",
  "collection_id",
  "sync_to_weitoutiao",
]);
const REDNOTE_ALLOWED_FIELD_IDS = new Set(["privacy", "original", "note_copyable"]);
const ZHIHU_ALLOWED_FIELD_IDS = new Set(["cover_image"]);
const WECHAT_ALLOWED_FIELD_IDS = new Set([
  "enable_comment",
  "claim_source",
  "platform_recommend",
]);
const COVER_PICKER_TAB_UPLOAD = "upload";
const COVER_PICKER_TAB_LIBRARY = "library";

const WECHAT_CLAIM_SOURCE_OPTIONS = [
  "无需声明",
  "内容由AI生成",
  "素材来源官方媒体/网络新闻",
  "内容剧情演绎，仅供娱乐",
  "个人观点，仅供参考",
  "健康医疗分享，仅供参考",
  "投资观点，仅供参考",
] as const;

const PLATFORM_PICKER_LABELS: Record<string, string> = {
  toutiao: "今日头条",
  rednote: "小红书",
  wechat_mp: "微信公众号",
  zhixunbao: "知讯宝",
  zhihu: "知乎",
  csdn: "CSDN",
  baijiahao: "百家号",
};

function getUploadPreviewUrl(file: { artifact_url?: string; virtual_path?: string; path?: string }): string | null {
  const artifactUrl = typeof file.artifact_url === "string" ? file.artifact_url : "";
  if (artifactUrl) {
    if (artifactUrl.startsWith("http://") || artifactUrl.startsWith("https://")) {
      return artifactUrl;
    }
    return `${getBackendBaseURL()}${artifactUrl.startsWith("/") ? "" : "/"}${artifactUrl}`;
  }
  const virtualPath = typeof file.virtual_path === "string" ? file.virtual_path : "";
  if (virtualPath) {
    return `${getBackendBaseURL()}/api/threads${virtualPath.startsWith("/") ? "" : "/"}${virtualPath}`;
  }
  const path = typeof file.path === "string" ? file.path : "";
  if (path && (path.startsWith("http://") || path.startsWith("https://"))) {
    return path;
  }
  return null;
}

function toAccountPlatform(platform: string): string {
  if (platform === "xiaohongshu") return "rednote";
  return platform;
}

function getRequiredFieldLabel(fieldId: string): string {
  if (fieldId === FIELD_ID_ACCOUNT) return "发布账号";
  if (fieldId === FIELD_ID_TITLE) return "标题";
  if (fieldId === FIELD_ID_ENABLE_AD) return "投放广告";
  return prettyFieldName(fieldId);
}

function getRequiredFieldError(platform: string, fieldId: string, value: unknown): string {
  const textValue = typeof value === "string" ? value.trim() : "";
  const isEmpty =
    value == null ||
    (typeof value === "string" && textValue === "");
  if (isEmpty) {
    const label = getRequiredFieldLabel(fieldId);
    const selectionFields = new Set<string>();
    if (platform === "toutiao") {
      selectionFields.add(FIELD_ID_COVER_MODE);
      selectionFields.add(FIELD_ID_ENABLE_AD);
    }
    if (selectionFields.has(fieldId)) {
      return `请选择${label}`;
    }
    return `请输入${label}`;
  }
  if (platform === "toutiao" && fieldId === FIELD_ID_TITLE) {
    const length = [...textValue].length;
    if (length < 2 || length > 30) {
      return "标题需为2-30个字";
    }
  }
  if ((platform === "rednote" || platform === "xiaohongshu") && fieldId === FIELD_ID_TITLE) {
    const length = [...textValue].length;
    if (length > 20) {
      return "标题最多20个字";
    }
  }
  if (platform === "zhihu" && fieldId === FIELD_ID_TITLE) {
    const length = [...textValue].length;
    if (length > 100) {
      return "标题最多100个字";
    }
  }
  if (platform === "wechat_mp" && fieldId === FIELD_ID_TITLE) {
    const length = [...textValue].length;
    if (length > 64) {
      return "标题最多64个字";
    }
  }
  return "";
}

function toBooleanField(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  return false;
}

function getTitleMaxLength(platform: string): number | undefined {
  if (platform === "toutiao") return 30;
  if (platform === "rednote" || platform === "xiaohongshu") return 20;
  if (platform === "zhihu") return 100;
  if (platform === "wechat_mp") return 64;
  return undefined;
}

const REDNOTE_PRIVACY_OPTIONS: Array<{ value: "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE"; label: string }> = [
  { value: "PUBLIC", label: "公开可见" },
  { value: "PRIVATE", label: "仅自己可见" },
  { value: "PARTIALLY_VISIBLE", label: "仅互关好友可见" },
];

function normalizeRednotePrivacy(value: unknown): "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE" {
  if (value === "PUBLIC" || value === "公开") return "PUBLIC";
  if (value === "PRIVATE" || value === "私密") return "PRIVATE";
  if (value === "PARTIALLY_VISIBLE" || value === "关注可见") return "PARTIALLY_VISIBLE";
  return "PUBLIC";
}

function isZhihuPlatform(platform: string): boolean {
  return platform === "zhihu";
}

function getToutiaoCoverImageError(coverMode: unknown, coverImageCount: number): string {
  const mode = typeof coverMode === "string" ? coverMode : "";
  if (mode === "single" && coverImageCount < 1) {
    return "请选择一张展示封面";
  }
  if (mode === "three" && coverImageCount < 3) {
    return "请选择三张展示封面";
  }
  return "";
}

function getDefaultPlatformOptions(platformKey: string): Record<string, unknown> {
  const keys = PLATFORM_OPTIONS_ORDER[platformKey] ?? [];
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    if (key === "enable_comment") result[key] = false;
    else if (key === "platform_recommend") result[key] = true;
    else if (key === "claim_source") result[key] = "无需声明";
    else if (key === "enable_ad") result[key] = false;
    else if (key === "cover_mode") result[key] = "single";
    else if (key === "privacy") result[key] = "PUBLIC";
    else result[key] = "";
  }
  return result;
}

/** 发布预览面板中按「会话文档」隔离的草稿（避免多文档共用同一 platform 键导致串数据） */
type PublishPanelDraftSnapshot = {
  activePublishPlatform: string;
  formValuesByPlatform: Record<string, Record<string, unknown>>;
  formTouchedByPlatform: Record<string, Record<string, boolean>>;
  formErrorsByPlatform: Record<string, Record<string, string>>;
  selectedAccountIdsByPlatform: Record<string, string[]>;
  coverImagesByPlatform: Record<string, string[]>;
  dismissedPublishPlatforms: string[];
  addedPlatformDataById: Record<string, PublishEditPlatform>;
};

function publishDraftKey(threadId: string, artifactsPath: string) {
  return `${threadId}\u001f${artifactsPath}`;
}

const ChatBox: React.FC<{ children: React.ReactNode; threadId: string }> = ({
  children,
  threadId,
}) => {
  const { thread } = useThread();
  const threadIdRef = useRef(threadId);
  const layoutRef = useRef<GroupImperativeHandle>(null);

  const {
    open: artifactsOpen,
    setOpen: setArtifactsOpen,
    setArtifacts,
    select: selectArtifact,
    deselect,
    selectedArtifact,
    publishPreview,
    closePublishPreview,
  } = useArtifacts();

  const [activePublishPlatform, setActivePublishPlatform] = useState("");
  const [formValuesByPlatform, setFormValuesByPlatform] = useState<
    Record<string, Record<string, unknown>>
  >({});
  const [formTouchedByPlatform, setFormTouchedByPlatform] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const [formErrorsByPlatform, setFormErrorsByPlatform] = useState<
    Record<string, Record<string, string>>
  >({});
  const [selectedAccountIdsByPlatform, setSelectedAccountIdsByPlatform] = useState<
    Record<string, string[]>
  >({});
  const [coverImagesByPlatform, setCoverImagesByPlatform] = useState<
    Record<string, string[]>
  >({});
  const [coverDrawerOpen, setCoverDrawerOpen] = useState(false);
  const [coverDrawerTab, setCoverDrawerTab] = useState<
    typeof COVER_PICKER_TAB_UPLOAD | typeof COVER_PICKER_TAB_LIBRARY
  >(COVER_PICKER_TAB_UPLOAD);
  const [coverReplaceIndex, setCoverReplaceIndex] = useState<number | null>(null);
  const [coverUploadCandidates, setCoverUploadCandidates] = useState<string[]>([]);
  const [coverLibraryCandidates, setCoverLibraryCandidates] = useState<string[]>([]);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverReuploadTargetIndex, setCoverReuploadTargetIndex] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishResultSummary, setPublishResultSummary] =
    useState<PublishSummary | null>(null);
  const publishFailedDetails = useMemo(
    () =>
      publishResultSummary?.details.filter(
        (d) => d.publish_status === "failed",
      ) ?? [],
    [publishResultSummary],
  );
  const [addPlatformOpen, setAddPlatformOpen] = useState(false);
  const [publishPanelAnimatedIn, setPublishPanelAnimatedIn] = useState(false);
  const [dismissedPublishPlatforms, setDismissedPublishPlatforms] = useState<Set<string>>(
    new Set(),
  );
  const [addedPlatformDataById, setAddedPlatformDataById] = useState<
    Record<string, PublishEditPlatform>
  >({});
  const coverUploadInputRef = useRef<HTMLInputElement>(null);
  const coverReuploadInputRef = useRef<HTMLInputElement>(null);
  const publishPanelStateRef = useRef<PublishPanelDraftSnapshot>({
    activePublishPlatform: "",
    formValuesByPlatform: {},
    formTouchedByPlatform: {},
    formErrorsByPlatform: {},
    selectedAccountIdsByPlatform: {},
    coverImagesByPlatform: {},
    dismissedPublishPlatforms: [],
    addedPlatformDataById: {},
  });
  const publishDraftsRef = useRef(
    new Map<string, PublishPanelDraftSnapshot>(),
  );
  const publishDraftSessionKeyRef = useRef<string>("");
  const suppressPublishDraftSaveRef = useRef(false);
  const prevMarkdownArtifactsRef = useRef<Set<string>>(new Set());
  const markdownArtifactsInitializedRef = useRef(false);
  const markdownArtifacts = useMemo(
    () =>
      (thread.values.artifacts ?? []).filter((file) =>
        file.toLowerCase().endsWith(".md"),
      ),
    [thread.values.artifacts],
  );

  useEffect(() => {
    publishPanelStateRef.current = {
      activePublishPlatform,
      formValuesByPlatform,
      formTouchedByPlatform,
      formErrorsByPlatform,
      selectedAccountIdsByPlatform,
      coverImagesByPlatform,
      dismissedPublishPlatforms: Array.from(dismissedPublishPlatforms),
      addedPlatformDataById,
    };
  }, [
    activePublishPlatform,
    formValuesByPlatform,
    formTouchedByPlatform,
    formErrorsByPlatform,
    selectedAccountIdsByPlatform,
    coverImagesByPlatform,
    dismissedPublishPlatforms,
    addedPlatformDataById,
  ]);

  useEffect(() => {
    const edit = publishPreview?.publishEdit;
    const nextKey =
      edit?.artifacts && publishPreview
        ? publishDraftKey(edit.thread_id, edit.artifacts)
        : "";

    if (nextKey === publishDraftSessionKeyRef.current) {
      return;
    }

    const prevKey = publishDraftSessionKeyRef.current;
    if (prevKey && !suppressPublishDraftSaveRef.current) {
      publishDraftsRef.current.set(
        prevKey,
        { ...publishPanelStateRef.current },
      );
    }
    suppressPublishDraftSaveRef.current = false;

    publishDraftSessionKeyRef.current = nextKey;

    if (!nextKey) {
      setActivePublishPlatform("");
      setFormValuesByPlatform({});
      setFormTouchedByPlatform({});
      setFormErrorsByPlatform({});
      setSelectedAccountIdsByPlatform({});
      setCoverImagesByPlatform({});
      setDismissedPublishPlatforms(new Set());
      setAddedPlatformDataById({});
      return;
    }

    const snap = publishDraftsRef.current.get(nextKey);
    if (snap) {
      setActivePublishPlatform(snap.activePublishPlatform);
      setFormValuesByPlatform(snap.formValuesByPlatform);
      setFormTouchedByPlatform(snap.formTouchedByPlatform);
      setFormErrorsByPlatform(snap.formErrorsByPlatform);
      setSelectedAccountIdsByPlatform(snap.selectedAccountIdsByPlatform);
      setCoverImagesByPlatform(snap.coverImagesByPlatform);
      setDismissedPublishPlatforms(new Set(snap.dismissedPublishPlatforms ?? []));
      setAddedPlatformDataById(snap.addedPlatformDataById ?? {});
    } else {
      setActivePublishPlatform("");
      setFormValuesByPlatform({});
      setFormTouchedByPlatform({});
      setFormErrorsByPlatform({});
      setSelectedAccountIdsByPlatform({});
      setCoverImagesByPlatform({});
      setDismissedPublishPlatforms(new Set());
      setAddedPlatformDataById({});
    }
  }, [publishPreview]);

  useEffect(() => {
    if (threadIdRef.current !== threadId) {
      threadIdRef.current = threadId;
      publishDraftsRef.current.clear();
      publishDraftSessionKeyRef.current = "";
      prevMarkdownArtifactsRef.current = new Set();
      markdownArtifactsInitializedRef.current = false;
      deselect();
    }

    // Temporarily only show markdown artifacts.
    setArtifacts(markdownArtifacts);

    // DO NOT automatically deselect the artifact when switching threads, because the artifacts auto discovering is not work now.
    // if (
    //   selectedArtifact &&
    //   !thread.values.artifacts?.includes(selectedArtifact)
    // ) {
    //   deselect();
    // }
  }, [threadId, deselect, setArtifacts, markdownArtifacts]);

  useEffect(() => {
    const nextSet = new Set(markdownArtifacts);
    if (!markdownArtifactsInitializedRef.current) {
      prevMarkdownArtifactsRef.current = nextSet;
      markdownArtifactsInitializedRef.current = true;
      return;
    }

    const prevSet = prevMarkdownArtifactsRef.current;
    const newlyAdded = markdownArtifacts.filter((file) => !prevSet.has(file));
    if (newlyAdded.length > 0) {
      const latestMarkdown = newlyAdded[newlyAdded.length - 1]!;
      selectArtifact(latestMarkdown);
      setArtifactsOpen(true);
    }

    prevMarkdownArtifactsRef.current = nextSet;
  }, [markdownArtifacts, selectArtifact, setArtifactsOpen]);

  useEffect(() => {
    if (layoutRef.current) {
      if (artifactsOpen) {
        layoutRef.current.setLayout(OPEN_MODE);
      } else {
        layoutRef.current.setLayout(CLOSE_MODE);
      }
    }
  }, [artifactsOpen]);

  const publishPlatformMap = useMemo(
    () => ({
      ...(publishPreview?.publishEdit?.platform ?? {}),
      ...addedPlatformDataById,
    }),
    [publishPreview, addedPlatformDataById],
  );
  const publishPlatformEntries = useMemo(
    () => Object.entries(publishPlatformMap),
    [publishPlatformMap],
  );
  const visiblePublishPlatformEntries = useMemo(
    () => publishPlatformEntries.filter(([platformKey]) => !dismissedPublishPlatforms.has(platformKey)),
    [publishPlatformEntries, dismissedPublishPlatforms],
  );
  const visiblePublishPlatformIdSet = useMemo(
    () => new Set(visiblePublishPlatformEntries.map(([platformKey]) => platformKey)),
    [visiblePublishPlatformEntries],
  );
  const pickerPlatforms = useMemo<PickerPlatformItem[]>(
    () =>
      getPlatformsWithNames(
        (id) => PLATFORM_PICKER_LABELS[id] ?? PLATFORM_LABELS[id] ?? id,
      ).map((p) => ({
        id: p.id,
        name: p.name,
        logo: `/platform-logos/${p.logo}`,
      })),
    [],
  );

  const { data: allAccountsRes } = useQuery({
    queryKey: ["publish-panel", "all-accounts"],
    queryFn: () => accountsApi.listAccounts(),
    enabled: !!publishPreview,
  });

  useEffect(() => {
    if (!publishPreview) {
      setPublishPanelAnimatedIn(false);
      return;
    }
    setPublishPanelAnimatedIn(false);
    const raf = requestAnimationFrame(() => setPublishPanelAnimatedIn(true));
    return () => cancelAnimationFrame(raf);
  }, [publishPreview]);

  useEffect(() => {
    if (visiblePublishPlatformEntries.length === 0) {
      setActivePublishPlatform("");
      return;
    }
    setActivePublishPlatform((prev) => {
      if (prev && visiblePublishPlatformEntries.some(([key]) => key === prev)) {
        return prev;
      }
      return visiblePublishPlatformEntries[0]?.[0] ?? "";
    });
  }, [visiblePublishPlatformEntries]);

  const activePlatformData = useMemo<PublishEditPlatform | null>(() => {
    if (!activePublishPlatform) {
      return null;
    }
    return publishPlatformMap[activePublishPlatform] ?? null;
  }, [activePublishPlatform, publishPlatformMap]);

  const availableAccountsForActivePlatform = useMemo(() => {
    const items = allAccountsRes?.items ?? [];
    const platform = toAccountPlatform(activePublishPlatform);
    return items.filter((a) => a.platform === platform);
  }, [activePublishPlatform, allAccountsRes]);

  const publishTitle = useMemo(() => {
    if (!activePlatformData) return "";
    return extractTitleFromMarkdown(activePlatformData.content);
  }, [activePlatformData]);

  const orderedPlatformOptions = useMemo(() => {
    if (!activePlatformData) return [];
    const options = activePlatformData.platform_options ?? {};
    const keys =
      activePublishPlatform === "wechat_mp"
        ? Array.from(
            new Set([
              ...Object.keys(options).filter((k) => WECHAT_ALLOWED_FIELD_IDS.has(k)),
              ...PLATFORM_OPTIONS_ORDER.wechat_mp,
            ]),
          )
        : Object.keys(options);
    const baseOrder = PLATFORM_OPTIONS_ORDER[activePublishPlatform] ?? [];
    const ordered = baseOrder.filter((k) => keys.includes(k));
    const extra = keys.filter((k) => !baseOrder.includes(k)).sort();
    return [...ordered, ...extra]
      .filter((key) => {
        if (key === "title") return false;
        if (HIDDEN_PLATFORM_FIELD_IDS.has(key)) return false;
        if (activePublishPlatform === "toutiao" && REMOVED_TOUTIAO_FIELD_IDS.has(key)) {
          return false;
        }
        if (
          (activePublishPlatform === "rednote" || activePublishPlatform === "xiaohongshu") &&
          !REDNOTE_ALLOWED_FIELD_IDS.has(key)
        ) {
          return false;
        }
        if (activePublishPlatform === "zhihu" && !ZHIHU_ALLOWED_FIELD_IDS.has(key)) {
          return false;
        }
        if (activePublishPlatform === "wechat_mp" && !WECHAT_ALLOWED_FIELD_IDS.has(key)) {
          return false;
        }
        return true;
      })
      .map((key) => ({
        key,
        value:
          options[key] ??
          (key === "enable_comment"
            ? false
            : key === "platform_recommend"
              ? true
              : key === "claim_source"
                ? "无需声明"
                : ""),
      }));
  }, [activePlatformData, activePublishPlatform]);

  const activeFormValues = formValuesByPlatform[activePublishPlatform] ?? {};
  const activeFormTouched = formTouchedByPlatform[activePublishPlatform] ?? {};
  const activeFormErrors = formErrorsByPlatform[activePublishPlatform] ?? {};
  const activeSelectedAccountIds =
    selectedAccountIdsByPlatform[activePublishPlatform] ?? [];
  const activeCoverImages = coverImagesByPlatform[activePublishPlatform] ?? [];
  const titleMaxLength = getTitleMaxLength(activePublishPlatform);
  const coverModeValue = (activeFormValues[FIELD_ID_COVER_MODE] as string) || "single";
  const coverSlotCount = isZhihuPlatform(activePublishPlatform)
    ? 1
    : coverModeValue === "none"
      ? 0
      : coverModeValue === "single"
        ? 1
        : 3;
  const remainingCoverSlots = Math.max(coverSlotCount - activeCoverImages.length, 0);
  const coverSelectableCount = coverReplaceIndex != null ? 1 : remainingCoverSlots;

  const { data: coverLibraryItems = [], isFetching: isFetchingCoverLibrary } = useQuery({
    queryKey: ["publish-panel", "cover-library-images"],
    queryFn: async () => {
      const res = await mediaApi.listMedia({ media_type: "image" });
      return res.items.map((item) => ({
        id: item.id,
        name: item.name,
        // url: mediaApi.getMediaDownloadUrl(item.id),
        url: item.file_path,
      }));
    },
    enabled: coverDrawerOpen,
  });

  useEffect(() => {
    if (!activePublishPlatform || !activePlatformData) return;
    const contentImageUrls = extractImageUrlsFromContent(activePlatformData.content).slice(0, 3);
    const defaultToutiaoCoverMode = getDefaultToutiaoCoverMode(contentImageUrls.length);

    setFormValuesByPlatform((prev) => {
      const current = prev[activePublishPlatform];
      if (current) return prev;
      const init: Record<string, unknown> = {
        [FIELD_ID_TITLE]: publishTitle,
      };
      for (const item of orderedPlatformOptions) {
        if (activePublishPlatform === "toutiao" && item.key === FIELD_ID_COVER_MODE) {
          init[item.key] = defaultToutiaoCoverMode;
          continue;
        }
        init[item.key] = item.value;
      }
      return {
        ...prev,
        [activePublishPlatform]: init,
      };
    });
    setSelectedAccountIdsByPlatform((prev) => {
      if (prev[activePublishPlatform]) return prev;
      return {
        ...prev,
        [activePublishPlatform]: activePlatformData.accounts.map((a) => a.id),
      };
    });
    setCoverImagesByPlatform((prev) => {
      if (prev[activePublishPlatform]) return prev;
      const zhihuCoverFromOption =
        isZhihuPlatform(activePublishPlatform) &&
        typeof activePlatformData.platform_options?.cover_image === "string"
          ? activePlatformData.platform_options.cover_image
          : "";
      const initialCoverImages = isZhihuPlatform(activePublishPlatform)
        ? (zhihuCoverFromOption ? [zhihuCoverFromOption] : contentImageUrls.slice(0, 1))
        : contentImageUrls;
      return {
        ...prev,
        [activePublishPlatform]: initialCoverImages,
      };
    });
  }, [
    activePlatformData,
    activePublishPlatform,
    orderedPlatformOptions,
    publishTitle,
  ]);

  const handleFieldChange = (fieldId: string, value: unknown) => {
    if (!activePublishPlatform) return;
    setFormValuesByPlatform((prev) => ({
      ...prev,
      [activePublishPlatform]: {
        ...(prev[activePublishPlatform] ?? {}),
        [fieldId]: value,
      },
    }));
  };

  const handleFieldBlur = (fieldId: string) => {
    if (!activePublishPlatform) return;
    setFormTouchedByPlatform((prev) => ({
      ...prev,
      [activePublishPlatform]: {
        ...(prev[activePublishPlatform] ?? {}),
        [fieldId]: true,
      },
    }));
    const isRequired =
      fieldId === FIELD_ID_ACCOUNT ||
      fieldId === FIELD_ID_TITLE ||
      (activePublishPlatform === "toutiao" &&
        (fieldId === FIELD_ID_COVER_MODE || fieldId === FIELD_ID_ENABLE_AD));
    if (!isRequired) return;
    const nextError =
      fieldId === FIELD_ID_ACCOUNT
        ? (activeSelectedAccountIds.length > 0 ? "" : `请选择${getRequiredFieldLabel(fieldId)}`)
        : getRequiredFieldError(
            activePublishPlatform,
            fieldId,
            activeFormValues[fieldId],
          );
    setFormErrorsByPlatform((prev) => ({
      ...prev,
      [activePublishPlatform]: {
        ...(prev[activePublishPlatform] ?? {}),
        [fieldId]: nextError,
      },
    }));
  };

  const handleAccountSelectionChange = (next: string[]) => {
    if (!activePublishPlatform) return;
    setSelectedAccountIdsByPlatform((prev) => ({
      ...prev,
      [activePublishPlatform]: next,
    }));
    if (activeFormTouched[FIELD_ID_ACCOUNT]) {
      const nextError = next.length > 0 ? "" : `请选择${getRequiredFieldLabel(FIELD_ID_ACCOUNT)}`;
      setFormErrorsByPlatform((prev) => ({
        ...prev,
        [activePublishPlatform]: {
          ...(prev[activePublishPlatform] ?? {}),
          [FIELD_ID_ACCOUNT]: nextError,
        },
      }));
    }
  };

  const handleRemoveCoverImage = (index: number) => {
    if (!activePublishPlatform) return;
    setCoverImagesByPlatform((prev) => {
      const current = prev[activePublishPlatform] ?? [];
      if (index < 0 || index >= current.length) return prev;
      const next = current.filter((_, i) => i !== index);
      if (isZhihuPlatform(activePublishPlatform)) {
        handleFieldChange("cover_image", next[0] ?? "");
      }
      return {
        ...prev,
        [activePublishPlatform]: next,
      };
    });
  };

  const resetCoverDrawerSelection = () => {
    setCoverDrawerTab(COVER_PICKER_TAB_UPLOAD);
    setCoverUploadCandidates([]);
    setCoverLibraryCandidates([]);
    setCoverReuploadTargetIndex(null);
  };

  const openCoverDrawerForAdd = () => {
    if (coverSelectableCount <= 0) {
      toast.error("当前封面数量已达上限");
      return;
    }
    setCoverReplaceIndex(null);
    resetCoverDrawerSelection();
    setCoverDrawerOpen(true);
  };

  const openCoverDrawerForReplace = (index: number) => {
    setCoverReplaceIndex(index);
    resetCoverDrawerSelection();
    setCoverDrawerOpen(true);
  };

  const applyCoverSelection = (urls: string[]) => {
    if (!activePublishPlatform || urls.length === 0) return;
    if (coverReplaceIndex != null) {
      const replacement = urls[0];
      if (!replacement) return;
      setCoverImagesByPlatform((prev) => {
        const current = prev[activePublishPlatform] ?? [];
        if (coverReplaceIndex < 0 || coverReplaceIndex >= current.length) return prev;
        const next = [...current];
        next[coverReplaceIndex] = replacement;
        if (isZhihuPlatform(activePublishPlatform)) {
          handleFieldChange("cover_image", replacement);
        }
        return {
          ...prev,
          [activePublishPlatform]: next,
        };
      });
      setCoverDrawerOpen(false);
      return;
    }
    const canAppend = Math.max(coverSlotCount - activeCoverImages.length, 0);
    const appendUrls = urls.slice(0, canAppend);
    if (appendUrls.length === 0) return;
    setCoverImagesByPlatform((prev) => {
      const current = prev[activePublishPlatform] ?? [];
      const next =
        isZhihuPlatform(activePublishPlatform)
          ? (appendUrls.length > 0 ? [appendUrls[0]!] : current.slice(0, 1))
          : [...current, ...appendUrls];
      if (isZhihuPlatform(activePublishPlatform)) {
        handleFieldChange("cover_image", next[0] ?? "");
      }
      return {
        ...prev,
        [activePublishPlatform]: next,
      };
    });
    setCoverDrawerOpen(false);
  };

  const onPickLocalUploadFiles = async (files: FileList | null) => {
    const threadId = publishPreview?.publishEdit?.thread_id;
    if (!files?.length || !threadId) return;
    const maxCount = coverReplaceIndex != null ? 1 : Math.max(coverSelectableCount - coverUploadCandidates.length, 0);
    if (maxCount <= 0) {
      toast.error("可选择封面数量已达上限");
      return;
    }
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, maxCount);
    if (selected.length === 0) {
      toast.error("请选择图片文件");
      return;
    }
    setCoverUploading(true);
    try {
      const res = await uploadFiles(threadId, selected);
      const urls = (res.files ?? [])
        .map((f) => getUploadPreviewUrl(f))
        .filter((u): u is string => typeof u === "string" && u.length > 0);
      if (urls.length === 0) {
        toast.error("上传成功，但未获取到图片地址");
        return;
      }
      if (coverReuploadTargetIndex != null) {
        const nextUrl = urls[0];
        if (!nextUrl) return;
        setCoverUploadCandidates((prev) => {
          const next = [...prev];
          if (coverReuploadTargetIndex < 0 || coverReuploadTargetIndex >= next.length) {
            return prev;
          }
          next[coverReuploadTargetIndex] = nextUrl;
          return next;
        });
        setCoverReuploadTargetIndex(null);
      } else if (coverReplaceIndex != null) {
        setCoverUploadCandidates([urls[0]!]);
      } else {
        setCoverUploadCandidates((prev) => [...prev, ...urls].slice(0, coverSelectableCount));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "上传失败"));
    } finally {
      setCoverUploading(false);
    }
  };

  const toggleCoverLibraryCandidate = (url: string) => {
    setCoverLibraryCandidates((prev) => {
      const exists = prev.includes(url);
      if (exists) return prev.filter((item) => item !== url);
      if (coverReplaceIndex != null) return [url];
      if (prev.length >= coverSelectableCount) return prev;
      return [...prev, url];
    });
  };

  const handlePublish = async () => {
    const publishEdit = publishPreview?.publishEdit;
    if (!publishEdit?.thread_id || visiblePublishPlatformEntries.length === 0) {
      return;
    }
    if (isPublishing) return;

    const payloadPlatforms: Record<string, PublishPlatformRequest> = {};

    for (const [platformKey, platformData] of visiblePublishPlatformEntries) {
      const rawFormValues = formValuesByPlatform[platformKey];
      const contentImageUrls = extractImageUrlsFromContent(platformData.content).slice(0, 3);
      const defaultToutiaoCoverMode = getDefaultToutiaoCoverMode(contentImageUrls.length);
      const defaultTitle = extractTitleFromMarkdown(platformData.content);
      const formValues: Record<string, unknown> = rawFormValues ?? {
        [FIELD_ID_TITLE]: defaultTitle,
        ...Object.fromEntries(
          Object.entries(platformData.platform_options ?? {}).map(([key, value]) => {
            if (platformKey === "toutiao" && key === FIELD_ID_COVER_MODE) {
              return [key, defaultToutiaoCoverMode];
            }
            return [key, value];
          }),
        ),
      };
      const accountIds =
        selectedAccountIdsByPlatform[platformKey] ?? platformData.accounts.map((a) => a.id);
      if (accountIds.length === 0) {
        toast.error(`请选择${PLATFORM_LABELS[platformKey] ?? platformKey}发布账号`);
        return;
      }
      const titleValue = String(formValues[FIELD_ID_TITLE] ?? "").trim();
      if (!titleValue) {
        toast.error(`请输入${PLATFORM_LABELS[platformKey] ?? platformKey}标题`);
        return;
      }
      const titleError = getRequiredFieldError(platformKey, FIELD_ID_TITLE, titleValue);
      if (titleError) {
        toast.error(`${PLATFORM_LABELS[platformKey] ?? platformKey}${titleError}`);
        return;
      }
      if (platformKey === "toutiao") {
        const coverMode = String(formValues[FIELD_ID_COVER_MODE] ?? "");
        if (!coverMode) {
          toast.error("请选择头条号展示封面");
          return;
        }
        const enableAd = formValues[FIELD_ID_ENABLE_AD];
        if (typeof enableAd !== "boolean") {
          toast.error("请选择头条号投放广告");
          return;
        }
        const coverImages =
          coverImagesByPlatform[platformKey] ?? contentImageUrls;
        const coverImageError = getToutiaoCoverImageError(coverMode, coverImages.length);
        if (coverImageError) {
          toast.error(coverImageError);
          return;
        }
      }
      if (platformKey === "rednote" || platformKey === "xiaohongshu") {
        const contentTextLength =
          countVisibleTextCharsWithoutImageUrls(platformData.content);
        if (contentTextLength > 1000) {
          toast.error(
            `${PLATFORM_LABELS[platformKey] ?? platformKey}正文最多1000字`,
          );
          return;
        }
      }
      const baseOrder = PLATFORM_OPTIONS_ORDER[platformKey] ?? [];
      const optionKeys = Object.keys(platformData.platform_options ?? {});
      const orderedOptionKeys = [
        ...baseOrder.filter((k) => optionKeys.includes(k)),
        ...optionKeys.filter((k) => !baseOrder.includes(k)).sort(),
      ].filter((key) => {
        if (key === "title") return false;
        if (HIDDEN_PLATFORM_FIELD_IDS.has(key)) return false;
        if (platformKey === "toutiao" && REMOVED_TOUTIAO_FIELD_IDS.has(key)) return false;
        if (
          (platformKey === "rednote" || platformKey === "xiaohongshu") &&
          !REDNOTE_ALLOWED_FIELD_IDS.has(key)
        ) {
          return false;
        }
        if (platformKey === "zhihu" && !ZHIHU_ALLOWED_FIELD_IDS.has(key)) return false;
        if (platformKey === "wechat_mp" && !WECHAT_ALLOWED_FIELD_IDS.has(key)) {
          return false;
        }
        return true;
      });

      const platformOptions: Record<string, unknown> = {};
      for (const key of orderedOptionKeys) {
        const inputValue = formValues[key];
        if (typeof inputValue === "string" && inputValue.trim() === "") continue;
        if (inputValue == null) continue;
        platformOptions[key] = inputValue;
      }

      if (platformKey === "toutiao") {
        if ("cover_mode" in platformOptions) {
          platformOptions.cover_mode = String(platformOptions.cover_mode);
        }
        if ("enable_ad" in platformOptions) {
          platformOptions.enable_ad = toBooleanField(platformOptions.enable_ad);
        }
        if ("first_publish" in platformOptions) {
          platformOptions.first_publish = toBooleanField(platformOptions.first_publish);
        }
        if ("sync_to_weitoutiao" in platformOptions) {
          platformOptions.sync_to_weitoutiao = toBooleanField(platformOptions.sync_to_weitoutiao);
        }
        if ("work_statement" in platformOptions) {
          platformOptions.work_statement = String(platformOptions.work_statement);
        }
        const coverMode = String(formValues[FIELD_ID_COVER_MODE] ?? "");
        const toutiaoCoverImages = (coverImagesByPlatform[platformKey] ?? contentImageUrls)
          .filter((url): url is string => typeof url === "string" && url.trim().length > 0);
        platformOptions.pgc_feed_covers =
          coverMode === "none"
            ? []
            : coverMode === "single"
              ? toutiaoCoverImages.slice(0, 1)
              : toutiaoCoverImages.slice(0, 3);
      }

      if (platformKey === "rednote" || platformKey === "xiaohongshu") {
        const normalized: Record<string, unknown> = {
          privacy: normalizeRednotePrivacy(platformOptions.privacy),
          original: toBooleanField(platformOptions.original),
          note_copyable: toBooleanField(platformOptions.note_copyable),
        };
        for (const key of Object.keys(platformOptions)) {
          delete platformOptions[key];
        }
        Object.assign(platformOptions, normalized);
      }

      if (platformKey === "zhihu") {
        const normalized: Record<string, unknown> = {};
        if (typeof platformOptions.cover_image === "string") {
          normalized.cover_image = platformOptions.cover_image;
        }
        for (const key of Object.keys(platformOptions)) {
          delete platformOptions[key];
        }
        Object.assign(platformOptions, normalized);
      }

      if (platformKey === "wechat_mp") {
        const normalized: Record<string, unknown> = {
          enable_comment: toBooleanField(
            platformOptions.enable_comment ?? formValues.enable_comment,
          ),
          platform_recommend: toBooleanField(
            platformOptions.platform_recommend ?? formValues.platform_recommend,
          ),
        };
        const claimSourceRaw = platformOptions.claim_source ?? formValues.claim_source;
        if (typeof claimSourceRaw === "string" && claimSourceRaw.trim()) {
          normalized.claim_source = claimSourceRaw.trim();
        } else {
          normalized.claim_source = "无需声明";
        }
        for (const key of Object.keys(platformOptions)) {
          delete platformOptions[key];
        }
        Object.assign(platformOptions, normalized);
      }

      if (titleValue) {
        platformOptions.title = titleValue;
      }

      payloadPlatforms[platformKey] = {
        account_ids: accountIds,
        content: platformData.content,
        draft: platformData.draft,
        dry_run: false,
        skip_image_upload: platformData.skip_image_upload,
        timeout: platformData.timeout,
        platform_options: platformOptions,
      };
    }

    setIsPublishing(true);
    try {
      const res = await publishThreadArticle({
        threadId: publishEdit.thread_id,
        source: "renderer.publish-panel",
        payload: {
          platforms: payloadPlatforms,
        },
      });
      const summary = parsePublishThreadResponse(res);
      if (summary) {
        suppressPublishDraftSaveRef.current = true;
        publishDraftsRef.current.delete(
          publishDraftKey(publishEdit.thread_id, publishEdit.artifacts),
        );
        setPublishResultSummary(summary);
      } else {
        toast.error("发布结果格式异常，请稍后重试");
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "发布失败"));
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="relative size-full">
      <ResizablePanelGroup
        orientation="horizontal"
        defaultLayout={{ chat: 100, artifacts: 0 }}
        groupRef={layoutRef}
      >
        <ResizablePanel className="relative" defaultSize={100} id="chat">
          {children}
        </ResizablePanel>
        <ResizablePanel
          className={cn(
            "transition-all duration-300 ease-in-out",
            !artifactsOpen && "opacity-0",
          )}
          id="artifacts"
        >
          <div
            className={cn(
              "h-full transition-transform duration-300 ease-in-out",
              selectedArtifact ? "p-0" : "p-4",
              artifactsOpen
                ? "translate-x-0 border-l border-border"
                : "translate-x-full border-l-0",
            )}
          >
            {selectedArtifact ? (
              <ArtifactFileDetail
                className="size-full rounded-none border-0 shadow-none"
                filepath={selectedArtifact}
                threadId={threadId}
              />
            ) : (
              <div className="relative flex size-full justify-center">
                <div className="absolute top-1 right-1 z-30">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                      setArtifactsOpen(false);
                    }}
                  >
                    <XIcon />
                  </Button>
                </div>
                {markdownArtifacts.length === 0 ? (
                  <ConversationEmptyState
                    icon={<FilesIcon />}
                    title="No artifact selected"
                    description="Select an artifact to view its details"
                  />
                ) : (
                  <div className="flex size-full max-w-(--container-width-sm) flex-col justify-center p-4 pt-8">
                    <header className="shrink-0">
                      <h2 className="text-lg font-medium">Artifacts</h2>
                    </header>
                    <main className="min-h-0 grow">
                      <ArtifactFileList
                        className="max-w-(--container-width-sm) p-4 pt-12"
                        files={markdownArtifacts}
                        threadId={threadId}
                      />
                    </main>
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      {publishPreview && (
        <div
          className={cn(
            "absolute inset-0 z-50 flex bg-background transition-opacity duration-300 ease-out",
            publishPanelAnimatedIn ? "opacity-100" : "opacity-0",
          )}
        >
          {isPublishing && (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-3 bg-background/65 backdrop-blur-[2px]"
            >
              <Loader2Icon className="size-10 shrink-0 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">发布中…</span>
            </div>
          )}
          <div className="relative flex w-[50%] shrink-0 items-center justify-center bg-background p-6">
            <div className="absolute top-6 left-6">
              <Button
                type="button"
                variant="outline"
                className="h-8 gap-1.5 px-2.5 text-xs"
                onClick={closePublishPreview}
              >
                <ChevronLeftIcon className="size-3.5" />
                返回对话
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="mb-5 text-lg font-semibold text-foreground">
                发布预览
              </h2>
              <div className="w-[312px] rounded-[36px] border border-border bg-card p-4 shadow-lg">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-muted-foreground/20" />
                <div className="publish-preview-scrollbar-none h-[640px] overflow-auto rounded-3xl border border-border bg-background px-4 py-5">
                  <div
                    className="publish-preview-typography prose prose-sm max-w-none break-words"
                    dangerouslySetInnerHTML={{
                      __html: publishPreview.contentHtml,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <aside className="flex h-full w-[50%] flex-col border-l border-border bg-background">
            <div className="flex h-14 shrink-0 items-center justify-between px-6">
              <h2 className="text-base font-semibold">发布面板配置</h2>
              <Button
                type="button"
                size="lg"
                className="shrink-0"
                disabled={isPublishing || visiblePublishPlatformEntries.length === 0}
                onClick={() => {
                  void handlePublish();
                }}
              >
                开始发布
              </Button>
            </div>
            <div className="shrink-0 border-b border-border" />
            <div className="min-h-0 flex-1 p-6">
              {visiblePublishPlatformEntries.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-base text-muted-foreground">
                    暂无待发布平台，
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto cursor-pointer p-0 align-baseline text-base text-primary"
                      onClick={() => setAddPlatformOpen(true)}
                    >
                      添加平台
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col">
                  <Tabs
                    value={activePublishPlatform}
                    onValueChange={setActivePublishPlatform}
                    className="gap-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <TabsList
                        variant="line"
                        className="h-auto w-full justify-start p-0"
                      >
                        {visiblePublishPlatformEntries.map(
                          ([platformKey]) => (
                            <TabsTrigger
                              key={platformKey}
                              value={platformKey}
                              className="h-8 px-2 text-sm first:pl-0 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:bottom-[-1px] group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:left-0 group-data-[variant=line]/tabs-list:group-data-horizontal/tabs:after:right-0"
                            >
                              <span className="inline-flex items-center gap-1.5">
                                <Image
                                  src={
                                    PLATFORM_LOGO_PATHS[platformKey] ??
                                    "/platform-logos/xiao-hong-shu.png"
                                  }
                                  alt={
                                    PLATFORM_LABELS[platformKey] ?? platformKey
                                  }
                                  width={20}
                                  height={20}
                                  className="size-5 rounded-sm object-contain"
                                />
                                <span>
                                  {PLATFORM_LABELS[platformKey] ?? platformKey}
                                </span>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="inline-flex size-5 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                  aria-label={`关闭${PLATFORM_LABELS[platformKey] ?? platformKey}`}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDismissedPublishPlatforms((prev) => {
                                      const next = new Set(prev);
                                      next.add(platformKey);
                                      return next;
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key !== "Enter" && e.key !== " ") return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDismissedPublishPlatforms((prev) => {
                                      const next = new Set(prev);
                                      next.add(platformKey);
                                      return next;
                                    });
                                  }}
                                >
                                  <XIcon className="size-3.5 cursor-pointer" />
                                </span>
                              </span>
                            </TabsTrigger>
                          ),
                        )}
                      </TabsList>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        className="shrink-0 cursor-pointer"
                        aria-label="添加平台"
                        onClick={() => setAddPlatformOpen(true)}
                      >
                        <PlusIcon className="size-4" />
                      </Button>
                    </div>
                  </Tabs>
                  {activePlatformData && (
                    <div className="mt-6 min-h-0 flex-1 space-y-8 overflow-auto pl-2 pr-6 -mr-6">
                      <div className="flex items-start gap-4 mt-2">
                        <div className="w-[7.5rem] shrink-0 pt-2 text-sm font-medium">
                          发布账号<span className="ml-0.5 text-red-500">*</span>
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <MultiSelect
                            options={availableAccountsForActivePlatform.map(
                              (account) => ({
                              value: account.id,
                              label: account.nickname || account.account,
                              avatarUrl: account.avatar,
                            }))}
                            values={activeSelectedAccountIds}
                            onValuesChange={handleAccountSelectionChange}
                            placeholder="请选择发布账号"
                            searchPlaceholder="搜索账号..."
                            onBlur={() => handleFieldBlur(FIELD_ID_ACCOUNT)}
                          />
                          {activeFormTouched[FIELD_ID_ACCOUNT] &&
                            activeFormErrors[FIELD_ID_ACCOUNT] && (
                              <p className="pointer-events-none absolute top-full left-0 mt-1 text-xs text-red-500">
                                {activeFormErrors[FIELD_ID_ACCOUNT]}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-[7.5rem] shrink-0 pt-2 text-sm font-medium">
                          标题<span className="ml-0.5 text-red-500">*</span>
                        </div>
                        <div className="relative min-w-0 flex-1">
                          <Input
                            value={(activeFormValues[FIELD_ID_TITLE] as string) ?? ""}
                            placeholder="请输入标题"
                            maxLength={titleMaxLength}
                            showCount={Boolean(titleMaxLength)}
                            onChange={(e) =>
                              handleFieldChange(FIELD_ID_TITLE, e.target.value)
                            }
                            onBlur={() => handleFieldBlur(FIELD_ID_TITLE)}
                          />
                          {activeFormTouched[FIELD_ID_TITLE] &&
                            activeFormErrors[FIELD_ID_TITLE] && (
                              <p className="pointer-events-none absolute top-full left-0 mt-1 text-xs text-red-500">
                                {activeFormErrors[FIELD_ID_TITLE]}
                              </p>
                            )}
                        </div>
                      </div>

                      <div className="space-y-7">
                        {orderedPlatformOptions.map((item) => {
                          const isRednoteSwitchField =
                            (activePublishPlatform === "rednote" ||
                              activePublishPlatform === "xiaohongshu") &&
                            (item.key === "original" || item.key === "note_copyable");
                          const isWechatSwitchField =
                            activePublishPlatform === "wechat_mp" &&
                            (item.key === "enable_comment" ||
                              item.key === "platform_recommend");
                          const isInlineSwitchField =
                            isRednoteSwitchField || isWechatSwitchField;
                          return (
                          <div
                            key={item.key}
                            className={cn(
                              "flex gap-4",
                              isInlineSwitchField ? "items-center" : "items-start",
                            )}
                          >
                            <div
                              className={cn(
                                "w-[7.5rem] shrink-0 text-sm text-foreground",
                                isInlineSwitchField ? "pt-0" : "pt-2",
                              )}
                            >
                              {prettyFieldName(item.key)}
                              {activePublishPlatform === "toutiao" &&
                                (item.key === FIELD_ID_COVER_MODE ||
                                  item.key === FIELD_ID_ENABLE_AD) && (
                                  <span className="ml-0.5 text-red-500">*</span>
                                )}
                            </div>
                            <div className="relative min-w-0 flex-1">
                              {activePublishPlatform === "toutiao" &&
                              item.key === "cover_mode" ? (
                                <div className="space-y-3">
                                  <RadioGroup
                                    value={(activeFormValues[item.key] as string) || "single"}
                                    onValueChange={(v: string) =>
                                      handleFieldChange(item.key, v)
                                    }
                                    onBlur={() => handleFieldBlur(item.key)}
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
                                  {activeFormValues[item.key] !== "none" && (
                                    <div className="space-y-2">
                                      <div
                                        className={cn(
                                          "flex gap-3 overflow-x-auto pb-1",
                                          activeFormValues[item.key] === "single"
                                            ? "max-w-[150px]"
                                            : "",
                                        )}
                                      >
                                        {(activeFormValues[item.key] === "single"
                                          ? [0]
                                          : [0, 1, 2]
                                        ).map((index) => {
                                          const imageSrc = activeCoverImages[index];
                                          return imageSrc ? (
                                            <div
                                              key={`cover-${index}`}
                                              className="group relative h-[115px] w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-muted"
                                            >
                                              <Image
                                                src={imageSrc}
                                                alt={`封面${index + 1}`}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                                sizes="150px"
                                              />
                                              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                                <div className="flex items-center rounded-md bg-black/55 px-2 py-1 text-sm text-white shadow-sm">
                                                  <button
                                                    type="button"
                                                    className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                                                    onClick={() => openCoverDrawerForReplace(index)}
                                                  >
                                                    替换
                                                  </button>
                                                  <span className="mx-1.5 text-white/80" aria-hidden>
                                                    |
                                                  </span>
                                                  <button
                                                    type="button"
                                                    className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                                                    onClick={() => handleRemoveCoverImage(index)}
                                                  >
                                                    删除
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <button
                                              key={`cover-${index}`}
                                              type="button"
                                              className="flex h-[115px] w-[150px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
                                              onClick={openCoverDrawerForAdd}
                                            >
                                              <PlusIcon className="size-7" />
                                            </button>
                                          );
                                        })}
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        优质的封面有利于推荐，格式支持 JPG、JPEG、PNG
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : isZhihuPlatform(activePublishPlatform) &&
                                item.key === "cover_image" ? (
                                <div className="space-y-2">
                                  <div className="flex gap-3 overflow-x-auto pb-1 max-w-[150px]">
                                    {(() => {
                                      const imageSrc = activeCoverImages[0];
                                      return imageSrc ? (
                                        <div
                                          className="group relative h-[115px] w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-muted"
                                        >
                                          <Image
                                            src={imageSrc}
                                            alt="封面"
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            sizes="150px"
                                          />
                                          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                                            <div className="flex items-center rounded-md bg-black/55 px-2 py-1 text-sm text-white shadow-sm">
                                              <button
                                                type="button"
                                                className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                                                onClick={() => openCoverDrawerForReplace(0)}
                                              >
                                                替换
                                              </button>
                                              <span className="mx-1.5 text-white/80" aria-hidden>
                                                |
                                              </span>
                                              <button
                                                type="button"
                                                className="cursor-pointer px-0.5 font-medium text-white/85 transition-colors hover:text-white"
                                                onClick={() => handleRemoveCoverImage(0)}
                                              >
                                                删除
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          className="flex h-[115px] w-[150px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
                                          onClick={openCoverDrawerForAdd}
                                        >
                                          <PlusIcon className="size-7" />
                                        </button>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    优质的封面有利于推荐，格式支持 JPG、JPEG、PNG
                                  </p>
                                </div>
                              ) : activePublishPlatform === "toutiao" &&
                                item.key === "enable_ad" ? (
                                <RadioGroup
                                  value={
                                    toBooleanField(activeFormValues[item.key])
                                      ? "true"
                                      : "false"
                                  }
                                  onValueChange={(v: string) =>
                                    handleFieldChange(item.key, v === "true")
                                  }
                                  onBlur={() => handleFieldBlur(item.key)}
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
                              ) : activePublishPlatform === "toutiao" &&
                                item.key === "first_publish" ? (
                                <label className="inline-flex h-9 w-fit cursor-pointer items-center gap-2">
                                  <Checkbox
                                    checked={toBooleanField(activeFormValues[item.key])}
                                    onCheckedChange={(v) =>
                                      handleFieldChange(
                                        item.key,
                                        Boolean(v),
                                      )
                                    }
                                  />
                                  <span className="text-sm">头条首发</span>
                                </label>
                              ) : activePublishPlatform === "toutiao" &&
                                item.key === "sync_to_weitoutiao" ? (
                                <label className="inline-flex h-9 w-fit cursor-pointer items-center gap-2">
                                  <Checkbox
                                    checked={toBooleanField(activeFormValues[item.key])}
                                    onCheckedChange={(v) =>
                                      handleFieldChange(
                                        item.key,
                                        Boolean(v),
                                      )
                                    }
                                  />
                                  <span className="text-sm">发布得更多收益</span>
                                </label>
                              ) : activePublishPlatform === "toutiao" &&
                                item.key === "work_statement" ? (
                                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                  {TOUTIAO_WORK_STATEMENT_OPTIONS.map((opt) => (
                                    <label
                                      key={opt}
                                      className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm"
                                    >
                                      <Checkbox
                                        checked={activeFormValues[item.key] === opt}
                                        onCheckedChange={(v) =>
                                          handleFieldChange(
                                            item.key,
                                            Boolean(v) ? opt : "",
                                          )
                                        }
                                      />
                                      <span>{opt}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (activePublishPlatform === "rednote" || activePublishPlatform === "xiaohongshu") &&
                                item.key === "privacy" ? (
                                <RadioGroup
                                  value={normalizeRednotePrivacy(activeFormValues[item.key])}
                                  onValueChange={(v: string) =>
                                    handleFieldChange(
                                      item.key,
                                      v as "PUBLIC" | "PRIVATE" | "PARTIALLY_VISIBLE",
                                    )
                                  }
                                  onBlur={() => handleFieldBlur(item.key)}
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
                              ) : (activePublishPlatform === "rednote" || activePublishPlatform === "xiaohongshu") &&
                                (item.key === "original" || item.key === "note_copyable") ? (
                                <Switch
                                  checked={toBooleanField(activeFormValues[item.key])}
                                  onCheckedChange={(checked) =>
                                    handleFieldChange(item.key, checked)
                                  }
                                  aria-label={prettyFieldName(item.key)}
                                />
                              ) : activePublishPlatform === "wechat_mp" &&
                                item.key === "enable_comment" ? (
                                <Switch
                                  checked={toBooleanField(activeFormValues[item.key])}
                                  onCheckedChange={(checked) =>
                                    handleFieldChange(item.key, checked)
                                  }
                                  aria-label={prettyFieldName(item.key)}
                                />
                              ) : activePublishPlatform === "wechat_mp" &&
                                item.key === "platform_recommend" ? (
                                <Switch
                                  checked={toBooleanField(activeFormValues[item.key])}
                                  onCheckedChange={(checked) =>
                                    handleFieldChange(item.key, checked)
                                  }
                                  aria-label={prettyFieldName(item.key)}
                                />
                              ) : activePublishPlatform === "wechat_mp" &&
                                item.key === "claim_source" ? (
                                <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                                  {WECHAT_CLAIM_SOURCE_OPTIONS.map((option) => (
                                    <label
                                      key={option}
                                      className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm"
                                    >
                                      <Checkbox
                                        checked={activeFormValues[item.key] === option}
                                        onCheckedChange={(v) =>
                                          handleFieldChange(
                                            item.key,
                                            Boolean(v) ? option : "",
                                          )
                                        }
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              ) : (
                                <Input
                                  value={(activeFormValues[item.key] as string) ?? ""}
                                  onChange={(e) =>
                                    handleFieldChange(item.key, e.target.value)
                                  }
                                  onBlur={() => handleFieldBlur(item.key)}
                                />
                              )}
                              {activeFormTouched[item.key] &&
                                activeFormErrors[item.key] && (
                                  <p className="pointer-events-none absolute top-full left-0 mt-1 text-xs text-red-500">
                                    {activeFormErrors[item.key]}
                                  </p>
                                )}
                            </div>
                          </div>
                        );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <PlatformPickerDialog
                open={addPlatformOpen}
                onOpenChange={setAddPlatformOpen}
                platforms={pickerPlatforms}
                disabledPlatformIds={Array.from(visiblePublishPlatformIdSet)}
                closeLabel="关闭"
                title="选择平台"
                description="选择要添加发布的平台"
                onSelectPlatform={(platformId) => {
                  if (!publishPlatformMap[platformId]) {
                    const template =
                      publishPlatformEntries[0]?.[1] ?? null;
                    const platformAccounts = (allAccountsRes?.items ?? [])
                      .filter(
                        (a) => a.platform === toAccountPlatform(platformId),
                      )
                      .map(
                        (a): PublishEditAccount => ({
                          id: a.id,
                          avatar: a.avatar,
                          nickname: a.nickname,
                          account: a.account,
                          platform: a.platform,
                        }),
                      );
                    const nextPlatformData: PublishEditPlatform = {
                      accounts: platformAccounts,
                      content: template?.content ?? "",
                      draft: template?.draft ?? false,
                      skip_image_upload: template?.skip_image_upload ?? false,
                      timeout: template?.timeout ?? 60,
                      platform_options: getDefaultPlatformOptions(platformId),
                    };
                    setAddedPlatformDataById((prev) => ({
                      ...prev,
                      [platformId]: nextPlatformData,
                    }));
                  }
                  setDismissedPublishPlatforms((prev) => {
                    const next = new Set(prev);
                    next.delete(platformId);
                    return next;
                  });
                  setActivePublishPlatform(platformId);
                }}
              />
            </div>
          </aside>
          <Sheet
            open={coverDrawerOpen}
            onOpenChange={(open) => {
              setCoverDrawerOpen(open);
              if (!open) {
                setCoverReplaceIndex(null);
                resetCoverDrawerSelection();
              }
            }}
          >
            <SheetContent side="right" maxWidth="860px" className="p-0">
              <div className="flex h-full min-h-0 flex-col px-8 pt-6 pb-5">
                <Tabs
                  value={coverDrawerTab}
                  onValueChange={(v) =>
                    setCoverDrawerTab(v as typeof COVER_PICKER_TAB_UPLOAD | typeof COVER_PICKER_TAB_LIBRARY)
                  }
                  className="min-h-0 flex-1"
                >
                  <TabsList variant="line" className="h-auto w-full justify-start p-0">
                    <TabsTrigger value={COVER_PICKER_TAB_UPLOAD} className="h-9 px-1.5 text-base">
                      上传图片
                    </TabsTrigger>
                    <TabsTrigger value={COVER_PICKER_TAB_LIBRARY} className="h-9 px-1.5 text-base">
                      我的素材
                    </TabsTrigger>
                  </TabsList>

                  {coverDrawerTab === COVER_PICKER_TAB_UPLOAD ? (
                    <div className="mt-6 min-h-0 flex-1 overflow-auto pr-8 -mr-8">
                      <input
                        ref={coverUploadInputRef}
                        type="file"
                        accept="image/*"
                        multiple={coverReplaceIndex == null}
                        className="hidden"
                        onChange={(e) => {
                          void onPickLocalUploadFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />
                      <input
                        ref={coverReuploadInputRef}
                        type="file"
                        accept="image/*"
                        multiple={false}
                        className="hidden"
                        onChange={(e) => {
                          void onPickLocalUploadFiles(e.target.files);
                          e.target.value = "";
                        }}
                      />

                      {coverUploadCandidates.length === 0 ? (
                        <div className="flex h-full min-h-[420px] items-center justify-center">
                          <Button
                            type="button"
                            className="h-10 px-10 text-base"
                            onClick={() => coverUploadInputRef.current?.click()}
                            disabled={coverUploading || coverSelectableCount <= 0}
                          >
                            <PlusIcon className="size-5" />
                            {coverUploading ? "上传中..." : "本地上传"}
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {coverUploadCandidates.map((url, idx) => (
                            <div
                              key={`${url}-${idx}`}
                              className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-muted"
                              onClick={() => {
                                setCoverReuploadTargetIndex(idx);
                                coverReuploadInputRef.current?.click();
                              }}
                            >
                              <Image
                                src={url}
                                alt={`上传封面${idx + 1}`}
                                width={300}
                                height={230}
                                unoptimized
                                className="aspect-[150/115] w-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                                <div className="flex flex-col items-center gap-1.5 text-white">
                                  <PlusIcon className="size-7" />
                                  <span className="text-base font-medium">重新上传</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {coverReplaceIndex == null &&
                            coverUploadCandidates.length < coverSelectableCount && (
                              <button
                                type="button"
                                className="flex aspect-[150/115] w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-muted-foreground transition-colors hover:bg-muted/40"
                                onClick={() => coverUploadInputRef.current?.click()}
                                disabled={coverUploading}
                              >
                                <div className="flex flex-col items-center gap-1.5">
                                  <PlusIcon className="size-5" />
                                  <span className="text-sm">
                                    {coverUploading ? "上传中..." : "继续上传"}
                                  </span>
                                </div>
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-6 min-h-0 flex-1 overflow-auto pr-8 -mr-8">
                      {isFetchingCoverLibrary ? (
                        <p className="py-8 text-sm text-muted-foreground">素材加载中...</p>
                      ) : coverLibraryItems.length === 0 ? (
                        <p className="py-8 text-sm text-muted-foreground">暂无图片素材</p>
                      ) : (
                        <div className="columns-2 gap-3 md:columns-3">
                          {coverLibraryItems.map((item) => {
                            const selected = coverLibraryCandidates.includes(item.url);
                            const disabled =
                              !selected &&
                              coverReplaceIndex == null &&
                              coverLibraryCandidates.length >= coverSelectableCount;
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                  "group relative mb-3 break-inside-avoid cursor-pointer overflow-hidden rounded-lg border bg-muted",
                                  selected ? "border-primary ring-2 ring-primary/40" : "border-border",
                                  disabled && "cursor-not-allowed opacity-60",
                                )}
                                onClick={() => {
                                  if (disabled) return;
                                  toggleCoverLibraryCandidate(item.url);
                                }}
                              >
                                <Image
                                  src={item.url}
                                  alt={item.name}
                                  width={800}
                                  height={600}
                                  unoptimized
                                  className="h-auto w-full object-cover"
                                />
                                <div
                                  className={cn(
                                    "pointer-events-none absolute inset-0 transition-colors",
                                    selected ? "bg-black/20" : "bg-black/0 group-hover:bg-black/15",
                                  )}
                                />
                                <div
                                  className={cn(
                                    "pointer-events-none absolute top-3 left-3 flex size-7 items-center justify-center rounded-full border transition-all",
                                    selected
                                      ? "border-primary bg-primary text-primary-foreground opacity-100"
                                      : "border-white/85 bg-black/30 text-transparent opacity-0 backdrop-blur-[1px] group-hover:opacity-100",
                                  )}
                                >
                                  <CheckIcon className="size-4" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </Tabs>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    最多可选 {coverSelectableCount} 张
                    {coverReplaceIndex != null ? "（替换模式仅支持单选）" : ""}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-5 text-base"
                      onClick={() => setCoverDrawerOpen(false)}
                    >
                      取消
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-10 px-5 text-base"
                      disabled={
                        coverDrawerTab === COVER_PICKER_TAB_UPLOAD
                          ? coverUploadCandidates.length === 0
                          : coverLibraryCandidates.length === 0
                      }
                      onClick={() =>
                        applyCoverSelection(
                          coverDrawerTab === COVER_PICKER_TAB_UPLOAD
                            ? coverUploadCandidates
                            : coverLibraryCandidates,
                        )
                      }
                    >
                      {coverReplaceIndex != null ? "替换封面" : "确认"}
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      <Dialog
        open={publishResultSummary !== null}
        onOpenChange={(open) => {
          if (!open) setPublishResultSummary(null);
        }}
      >
        <DialogContent
          className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden sm:max-w-lg"
          closeLabel="关闭"
        >
          {publishResultSummary && (
            <>
              <DialogHeader className="shrink-0">
                <DialogTitle>发布结果</DialogTitle>
              </DialogHeader>
              <p className="shrink-0 text-sm text-muted-foreground">
                成功 {publishResultSummary.success}，失败{" "}
                {publishResultSummary.failed}
                {publishResultSummary.total > 0
                  ? `（共 ${publishResultSummary.total} 个账号）`
                  : ""}
              </p>
              <div className="mt-4 min-h-0 max-h-[min(52vh,28rem)] flex-1 overflow-y-auto overscroll-y-contain pr-1">
                <ul className="space-y-2">
                  {publishFailedDetails.map((d, index) => {
                    const platformLabel =
                      PLATFORM_LABELS[d.account_platform ?? ""] ??
                      d.account_platform ??
                      "";
                    return (
                      <li
                        key={`${d.account_id}-${index}`}
                        className="rounded-lg border border-destructive/35 bg-destructive/5 px-3 py-2.5 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-medium text-foreground">
                            {d.account_name || d.account_id}
                          </span>
                          {platformLabel ? (
                            <span className="text-xs text-muted-foreground">
                              {platformLabel}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 text-xs text-destructive">
                          发布失败
                        </div>
                        {d.failure_reason ? (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {d.failure_reason}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                {publishFailedDetails.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    {publishResultSummary.failed === 0
                      ? "全部账号发布成功"
                      : "暂无失败明细"}
                  </p>
                ) : null}
              </div>
              <DialogFooter className="mt-4 shrink-0 border-t border-border pt-4 sm:justify-end">
                <Button
                  type="button"
                  onClick={() => setPublishResultSummary(null)}
                >
                  知道了
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { ChatBox };
