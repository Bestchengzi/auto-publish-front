"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenTextIcon,
  FileTextIcon,
  ImageIcon,
  LayersIcon,
  NewspaperIcon,
  PenLineIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/common/delete-confirm-dialog";
import type { PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import { InputBox } from "@/components/langgraph/workspace/input-box";
import { usePromptInputController } from "@/components/langgraph/ai-elements/prompt-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ThreadContext,
  type ThreadContextType,
} from "@/components/langgraph/workspace/messages/context";
import {
  createThread,
  THREAD_METADATA_PLATFORM_REDNOTE,
} from "@/lib/langgraph-client";
import {
  clearPendingCreationDraft,
  peekPendingCreationDraft,
  stashPendingInitialMessage,
  type PendingCreationDraft,
} from "@/lib/creation-center/pending-initial-message";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import type { AgentThread } from "@/lib/langgraph/core/threads/types";
import {
  deletePersona,
  listPersonas,
  type PersonaResponse,
} from "@/lib/api/personas";
import { cn } from "@/lib/utils";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";
import type { FileUIPart } from "ai";
import {
  getRednoteExampleReferenceImages,
  RednotePublicExamples,
} from "./rednote-public-examples";
import type { PublicImageTaskResponse } from "@/lib/api/image-tasks";
import styles from "./creation-center-new-chat.module.css";

const HIGHLIGHTED_PARTS = [
  {
    text: "小红书爆款图文",
    gradient: "linear-gradient(135deg,#f43f5e,#ec4899)",
  },
  {
    text: "头条热点爆文",
    gradient: "linear-gradient(135deg,#ff2442,#e11d48)",
  },
  {
    text: "知乎深度文章",
    gradient: "linear-gradient(135deg,#0ea5e9,#2563eb)",
  },
  {
    text: "公众号精品文章",
    gradient: "linear-gradient(135deg,#10b981,#059669)",
  },
  {
    text: "CSDN高质量技术教程",
    gradient: "linear-gradient(135deg,#ea580c,#f97316,#f59e0b)",
  },
  { text: "\u5185\u5bb9", gradient: "linear-gradient(135deg,#f97316,#ec4899)" },
  { text: "AI", gradient: "linear-gradient(135deg,#6366f1,#8b5cf6,#d946ef)" },
  {
    text: "\u521b\u4f5c\u4e13\u5bb6",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
  {
    text: "Creation Expert",
    gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
  },
];

type ContentAgentId =
  | "rednote"
  | "news"
  | "longform"
  | "wechat"
  | "csdn";

type ImageModeId = "ai" | "search" | "library" | "none";

type RednoteStyleId =
  | "cute"
  | "fresh"
  | "warm"
  | "bold"
  | "minimal"
  | "retro"
  | "pop"
  | "notion"
  | "chalkboard"
  | "study-notes"
  | "screen-print"
  | "sketch-notes";

type RednoteContentStrategyId =
  | "information-dense"
  | "visual-first"
  | "story-driven";

type RednoteAspectRatio = "1:1" | "2:3" | "3:4" | "4:3" | "9:16" | "16:9";

type AgentOption = {
  id: ContentAgentId;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  logoSrc?: string;
};

type ImageModeOption = {
  id: ImageModeId;
  label: string;
  icon: LucideIcon;
};

type RednoteStyleOption = {
  id: RednoteStyleId;
  label: string;
  description: string;
  logoSrc: string;
};

type RednoteContentStrategyOption = {
  id: RednoteContentStrategyId;
  label: string;
};

type AgentHeroCopy = {
  title: string;
  subtitle: string;
  placeholders: string[];
};

const CONTENT_AGENTS: AgentOption[] = [
  {
    id: "rednote",
    label: "\u5c0f\u7ea2\u4e66\u56fe\u6587Agent",
    description: "\u79cd\u8349\u3001\u653b\u7565\u3001\u6d4b\u8bc4\u3001\u751f\u6d3b\u65b9\u5f0f\u5206\u4eab",
    icon: PenLineIcon,
    accent: "from-rose-500 to-orange-400",
    logoSrc: "/platform-logos/xiao-hong-shu.png",
  },
  {
    id: "news",
    label: "\u5934\u6761Agent",
    description: "\u70ed\u70b9\u89e3\u8bfb\u3001\u5feb\u8baf\u8ffd\u8e2a\u3001\u8d8b\u52bf\u5206\u6790",
    icon: NewspaperIcon,
    accent: "from-red-500 to-rose-500",
    logoSrc: "/platform-logos/jin-ri-tou-tiao.png",
  },
  {
    id: "longform",
    label: "\u77e5\u4e4eAgent",
    description: "\u6df1\u5ea6\u79d1\u666e\u3001\u7ecf\u9a8c\u5206\u4eab\u3001\u95ee\u9898\u89e3\u7b54",
    icon: BookOpenTextIcon,
    accent: "from-violet-500 to-indigo-500",
    logoSrc: "/platform-logos/zhihu.png",
  },
  {
    id: "wechat",
    label: "\u516c\u4f17\u53f7Agent",
    description: "\u54c1\u724c\u63a8\u6587\u3001\u6df1\u5ea6\u5e72\u8d27\u3001\u4e2a\u4eba\u4e13\u680f\uff0c\u652f\u6301 HTML \u683c\u5f0f\u751f\u6210",
    icon: FileTextIcon,
    accent: "from-emerald-500 to-teal-400",
    logoSrc: "/platform-logos/wei-xin-gong-zhong-hao.png",
  },
  {
    id: "csdn",
    label: "CSDN Agent",
    description: "\u6280\u672f\u6559\u7a0b\u3001\u5b9e\u6218\u7b14\u8bb0\u3001\u95ee\u9898\u590d\u76d8",
    icon: LayersIcon,
    accent: "from-blue-600 to-slate-500",
    logoSrc: "/platform-logos/CSDN.png",
  },
];

const IMAGE_MODE_OPTIONS: ImageModeOption[] = [
  { id: "ai", label: "AI\u751f\u56fe", icon: SparklesIcon },
  { id: "search", label: "\u7f51\u7edc\u641c\u56fe", icon: ImageIcon },
  { id: "library", label: "\u7d20\u6750\u5e93", icon: LayersIcon },
  { id: "none", label: "\u4e0d\u914d\u56fe", icon: FileTextIcon },
];

const IMAGE_COUNT_OPTIONS = Array.from({ length: 18 }, (_, index) =>
  String(index + 1),
);

const REDNOTE_ASPECT_RATIO_OPTIONS: RednoteAspectRatio[] = [
  "1:1",
  "2:3",
  "3:4",
  "4:3",
  "9:16",
  "16:9",
];

const REDNOTE_STYLE_OPTIONS: RednoteStyleOption[] = [
  {
    id: "cute",
    label: "甜美可爱",
    description: "甜美、可爱、少女感美学",
    logoSrc: "/rednote-style-logos/cute.png",
  },
  {
    id: "fresh",
    label: "干净清爽",
    description: "干净、清爽、自然",
    logoSrc: "/rednote-style-logos/fresh.png",
  },
  {
    id: "warm",
    label: "温馨友好",
    description: "温馨、友好、易接近",
    logoSrc: "/rednote-style-logos/warm.png",
  },
  {
    id: "bold",
    label: "高冲击力",
    description: "高冲击力、吸引注意",
    logoSrc: "/rednote-style-logos/bold.png",
  },
  {
    id: "minimal",
    label: "极简精致",
    description: "极简、精致",
    logoSrc: "/rednote-style-logos/minimal.png",
  },
  {
    id: "retro",
    label: "复古怀旧",
    description: "复古、怀旧、流行感",
    logoSrc: "/rednote-style-logos/retro.png",
  },
  {
    id: "pop",
    label: "鲜艳活力",
    description: "鲜艳、活力、醒目",
    logoSrc: "/rednote-style-logos/pop.png",
  },
  {
    id: "notion",
    label: "手绘知识",
    description: "极简手绘线稿、知识感",
    logoSrc: "/rednote-style-logos/notion.png",
  },
  {
    id: "chalkboard",
    label: "黑板粉笔",
    description: "黑板彩色粉笔风、教育感",
    logoSrc: "/rednote-style-logos/chalkboard.png",
  },
  {
    id: "study-notes",
    label: "手写笔记",
    description: "真实手写照片风，蓝笔 + 红色批注 + 黄色荧光标记",
    logoSrc: "/rednote-style-logos/study-notes.png",
  },
  {
    id: "screen-print",
    label: "海报艺术",
    description: "强烈海报艺术、半调纹理、有限色彩、象征性叙事",
    logoSrc: "/rednote-style-logos/screen-print.png",
  },
  {
    id: "sketch-notes",
    label: "手绘信息",
    description: "手绘教育信息图，暖奶油底上的马卡龙色，线条轻微抖动",
    logoSrc: "/rednote-style-logos/sketch-notes.png",
  },
];

const REDNOTE_CONTENT_STRATEGY_OPTIONS: RednoteContentStrategyOption[] = [
  {
    id: "information-dense",
    label: "信息密集",
  },
  {
    id: "visual-first",
    label: "视觉优先",
  },
  {
    id: "story-driven",
    label: "故事驱动",
  },
];

const REDNOTE_RUN_OPTIONS = {
  assistantId: "image_cards",
  streamMode: ["values", "updates"],
};

const PLACEHOLDER_ROTATION_MS = 4000;

const REDNOTE_CONTEXT_OVERRIDES = {
  model_name: "qwen3.6-plus",
};

type StartThreadOptions = {
  additionalKwargs?: Record<string, unknown>;
  agentId?: ContentAgentId;
  personaId?: string | null;
};

function normalizeConfigValue(value: string) {
  return value.replace(/\s+/g, "").trim();
}

function trimEmptyEdgeLines(lines: string[]) {
  const next = [...lines];
  while (next.length > 0 && next[0]?.trim() === "") {
    next.shift();
  }
  while (next.length > 0 && next.at(-1)?.trim() === "") {
    next.pop();
  }
  return next;
}

function parseRednoteExampleUserInput(userInput: string) {
  let aspectRatio: RednoteAspectRatio | null = null;
  let styleId: RednoteStyleId | "" | null = null;
  let contentStrategyId: RednoteContentStrategyId | "" | null = null;
  let imageCount: string | null = null;
  const contentLines: string[] = [];

  for (const line of userInput.split(/\r?\n/)) {
    const trimmed = line.trim();

    const aspectRatioMatch = trimmed.match(/^(?:图片比例|比例)\s*[:：]\s*(.+)$/);
    if (aspectRatioMatch) {
      const value = normalizeConfigValue(aspectRatioMatch[1] ?? "");
      const matchedRatio = REDNOTE_ASPECT_RATIO_OPTIONS.find(
        (ratio) => normalizeConfigValue(ratio) === value,
      );
      if (matchedRatio) {
        aspectRatio = matchedRatio;
      }
      continue;
    }

    const styleMatch = trimmed.match(/^(?:风格要求|风格)\s*[:：]\s*(.+)$/);
    if (styleMatch) {
      const value = normalizeConfigValue(styleMatch[1] ?? "");
      const matchedStyle = REDNOTE_STYLE_OPTIONS.find((style) => {
        const label = normalizeConfigValue(style.label);
        const description = normalizeConfigValue(style.description);
        return label === value || description === value || description.includes(value);
      });
      styleId = matchedStyle?.id ?? "";
      continue;
    }

    const strategyMatch = trimmed.match(/^内容策略\s*[:：]\s*(.+)$/);
    if (strategyMatch) {
      const value = normalizeConfigValue(strategyMatch[1] ?? "");
      const matchedStrategy = REDNOTE_CONTENT_STRATEGY_OPTIONS.find(
        (strategy) => normalizeConfigValue(strategy.label) === value,
      );
      contentStrategyId = matchedStrategy?.id ?? "";
      continue;
    }

    const imageCountMatch = trimmed.match(/^(?:生成图片张数|图片张数)\s*[:：]\s*(.+)$/);
    if (imageCountMatch) {
      const value = imageCountMatch[1]?.trim() ?? "";
      const count = value.match(/\d+/)?.[0] ?? "";
      imageCount = IMAGE_COUNT_OPTIONS.includes(count) ? count : "";
      continue;
    }

    contentLines.push(line);
  }

  return {
    text: trimEmptyEdgeLines(contentLines).join("\n"),
    aspectRatio,
    styleId,
    contentStrategyId,
    imageCount,
  };
}

const AGENT_ACTIVE_STYLES: Record<
  ContentAgentId,
  {
    button: string;
    dot: string;
  }
> = {
  rednote: {
    button:
      "border-pink-300 bg-white text-foreground ring-2 ring-pink-200/80 dark:border-pink-400/55 dark:bg-white/10 dark:ring-pink-500/25",
    dot: "bg-pink-500",
  },
  news: {
    button:
      "border-red-300 bg-white text-foreground ring-2 ring-red-200/80 dark:border-red-400/55 dark:bg-white/10 dark:ring-red-500/25",
    dot: "bg-red-500",
  },
  longform: {
    button:
      "border-sky-300 bg-white text-foreground ring-2 ring-sky-200/80 dark:border-sky-400/55 dark:bg-white/10 dark:ring-sky-500/25",
    dot: "bg-sky-500",
  },
  wechat: {
    button:
      "border-emerald-300 bg-white text-foreground ring-2 ring-emerald-200/80 dark:border-emerald-400/55 dark:bg-white/10 dark:ring-emerald-500/25",
    dot: "bg-emerald-500",
  },
  csdn: {
    button:
      "border-orange-300 bg-white text-foreground ring-2 ring-orange-200/80 dark:border-orange-400/55 dark:bg-white/10 dark:ring-orange-500/25",
    dot: "bg-orange-400",
  },
};

const AGENT_HERO_COPY: Record<ContentAgentId, AgentHeroCopy> = {
  rednote: {
    title: "一句话生成小红书爆款图文",
    subtitle: "适合种草、攻略、测评、生活方式分享，自动生成标题正文和图文提示词。",
    placeholders: [
      "夏季清爽防晒推荐，通勤日常必备，水印设置为@米酱呀",
      "网红爆款唇釉实测，平价替代巨划算",
      "小个子穿搭技巧，显高显瘦公式分享",
    ],
  },
  news: {
    title: "协同生成头条热点爆文",
    subtitle: "适合热点解读、快讯追踪、趋势分析，自动生成更适合信息流传播的爆款文章。",
    placeholders: [
      "科技产业最新突破，哪些领域将迎来爆发",
      "楼市最新行情深度分析，刚需买房看准这几点",
      "国内重大工程进展速览，带动多地就业与发展",
    ],
  },
  longform: {
    title: "协同生成知乎深度文章",
    subtitle: "适合深度科普、经验分享、问题解答，自动生成专业长文和逻辑严谨的观点论述。",
    placeholders: [
      "为什么很多人工作几年后，会陷入 “越忙越穷” 的困境？",
      "月薪 5k 和月薪 2w 的职场人，核心差距到底在哪里？",
      "想自学编程转行，怎么规划学习路线才能不走弯路？",
    ],
  },
  wechat: {
    title: "协同生成公众号精品文章",
    subtitle: "适合品牌推文、深度干货、个人专栏，自动生成排版友好和适配公众号生态的内容。",
    placeholders: [
      "避开人潮！这几个小众春日旅行地，治愈感拉满",
      "品牌公众号运营避坑指南：这些错误很多人都在犯",
      "当代年轻人的消费观：从超前消费到理性存钱",
    ],
  },
  csdn: {
    title: "协同生成CSDN高质量技术教程",
    subtitle: "适合技术教程、实战笔记、问题复盘，自动生成结构清晰的技术文章和代码说明。",
    placeholders: [
      "Python 零基础入门：从环境搭建到项目实战完整路线",
      "新手快速上手 Docker：容器部署入门教程",
      "算法入门必备：十大经典排序算法详解",
    ],
  },
};

const EditPersonaDialog = dynamic(
  () =>
    import("@/components/creation-center/edit-persona-dialog").then(
      (module) => module.EditPersonaDialog,
    ),
  {
    ssr: false,
  },
);

function HighlightedTitle({ title }: { title: string }) {
  const segments: { text: string; highlight?: string }[] = [];
  let remaining = title;

  for (const { text } of HIGHLIGHTED_PARTS) {
    const idx = remaining.indexOf(text);
    if (idx >= 0) {
      if (idx > 0) {
        segments.push({ text: remaining.slice(0, idx) });
      }
      segments.push({ text, highlight: text });
      remaining = remaining.slice(idx + text.length);
    }
  }

  if (remaining) {
    segments.push({ text: remaining });
  }

  return (
    <h1 className="flex flex-wrap items-center justify-center gap-0 text-[32px] font-bold leading-tight tracking-tight text-foreground">
      {segments.map((segment, index) => {
        const isHighlight = segment.highlight != null;
        const config = HIGHLIGHTED_PARTS.find((part) => part.text === segment.text);

        return (
          <span
            key={index}
            className={isHighlight ? "inline-block bg-clip-text" : ""}
            style={
              isHighlight && config
                ? {
                    backgroundImage: config.gradient,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }
                : undefined
            }
          >
            {segment.text}
          </span>
        );
      })}
    </h1>
  );
}

function RednoteStyleLogo({
  option,
  className,
}: {
  option: RednoteStyleOption;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative block size-5.5 shrink-0 overflow-hidden rounded-sm bg-muted shadow-sm ring-1 ring-foreground/10",
        className,
      )}
    >
      <Image
        src={option.logoSrc}
        alt=""
        width={40}
        height={40}
        className="size-full object-cover"
      />
    </span>
  );
}

export function CreationCenterNewChat() {
  const t = useTranslations("creationCenter.new");
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const promptInput = usePromptInputController();
  const locale = pathname?.split("/").filter(Boolean)[0] ?? "zh-CN";

  const [settings, setSettings] = useLocalSettings();
  const { ready: authReady, isLoggedIn } = useAuthLoggedIn();
  const canUseAuthFeatures = authReady && isLoggedIn;
  const { context } = settings;

  const fakeThread = useMemo(() => ({ messages: [] }), []);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<ContentAgentId>("rednote");
  const [articleLength, setArticleLength] = useState("");
  const [imageModeId, setImageModeId] = useState<ImageModeId>("ai");
  const [rednoteStyleId, setRednoteStyleId] =
    useState<RednoteStyleId | "">("");
  const [rednoteContentStrategyId, setRednoteContentStrategyId] =
    useState<RednoteContentStrategyId | "">("");
  const [rednoteAspectRatio, setRednoteAspectRatio] =
    useState<RednoteAspectRatio>("3:4");
  const [generatedImageCount, setGeneratedImageCount] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [pendingCreationDraft, setPendingCreationDraft] =
    useState<PendingCreationDraft | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(() =>
    typeof context.persona_id === "string" ? context.persona_id : null,
  );
  const [pendingDeletePersona, setPendingDeletePersona] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const hydratedCreationDraftRef = useRef(false);
  const [deletePersonaDialogOpen, setDeletePersonaDialogOpen] = useState(false);
  const [deletePersonaDialogSnapshot, setDeletePersonaDialogSnapshot] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingPersona, setEditingPersona] = useState<PersonaResponse | null>(null);

  const { data: personasData, isFetched: personasFetched } = useQuery({
    queryKey: ["personas", "list"],
    queryFn: () => listPersonas(),
    staleTime: 60_000,
    enabled: canUseAuthFeatures,
  });
  const personas = useMemo(
    () => (canUseAuthFeatures ? (personasData?.items ?? []) : []),
    [canUseAuthFeatures, personasData],
  );
  const personaOptions = useMemo(
    () => personas.map((persona) => ({ id: persona.id, name: persona.name })),
    [personas],
  );
  const personaById = useMemo(
    () => new Map(personas.map((persona) => [persona.id, persona])),
    [personas],
  );
  const selectedAgent = useMemo(
    () =>
      CONTENT_AGENTS.find((agent) => agent.id === selectedAgentId) ??
      CONTENT_AGENTS[0],
    [selectedAgentId],
  );
  const selectedAgentHeroCopy = AGENT_HERO_COPY[selectedAgent.id];
  const selectedPlaceholder =
    selectedAgentHeroCopy.placeholders[
      placeholderIndex % selectedAgentHeroCopy.placeholders.length
    ] ?? "";
  const selectedImageMode = useMemo(
    () =>
      IMAGE_MODE_OPTIONS.find((mode) => mode.id === imageModeId) ??
      IMAGE_MODE_OPTIONS[0],
    [imageModeId],
  );
  const selectedRednoteStyle = useMemo(
    () =>
      REDNOTE_STYLE_OPTIONS.find((style) => style.id === rednoteStyleId) ??
      null,
    [rednoteStyleId],
  );
  const selectedRednoteContentStrategy = useMemo(
    () =>
      REDNOTE_CONTENT_STRATEGY_OPTIONS.find(
        (strategy) => strategy.id === rednoteContentStrategyId,
      ) ?? null,
    [rednoteContentStrategyId],
  );
  const isRednoteAgent = selectedAgent.id === "rednote";
  const selectedTopic = useMemo(() => {
    const newsItem = pendingCreationDraft?.additionalKwargs.news_item;
    const title =
      typeof newsItem?.title === "string" ? newsItem.title.trim() : "";
    return title ? { title, typeLabel: "选题" } : null;
  }, [pendingCreationDraft]);
  const isTopicUnsupportedAgent = Boolean(pendingCreationDraft && isRednoteAgent);
  const visibleSelectedTopic = isTopicUnsupportedAgent ? null : selectedTopic;
  const composerBorderClass = useMemo(() => {
    switch (selectedAgent.id) {
      case "rednote":
        return "border-pink-300 focus-within:border-pink-400 dark:border-pink-400/65 [&_button[aria-pressed='true']]:bg-pink-50 [&_button[aria-pressed='true']]:text-pink-600 [&_button[aria-pressed='true']]:hover:bg-pink-100 [&_button[aria-pressed='true']]:hover:text-pink-700 [&_button[aria-label='Submit']]:border-transparent [&_button[aria-label='Submit']]:bg-pink-500 [&_button[aria-label='Submit']]:text-white [&_button[aria-label='Submit']]:shadow-sm [&_button[aria-label='Submit']:not(:disabled)]:hover:bg-pink-600 [&_button[aria-label='Submit']:not(:disabled)]:hover:text-white dark:[&_button[aria-label='Submit']]:bg-pink-500 dark:[&_button[aria-label='Submit']]:text-white";
      case "news":
        return "border-red-300 focus-within:border-red-400 dark:border-red-400/65 [&_button[aria-pressed='true']]:bg-red-50 [&_button[aria-pressed='true']]:text-red-600 [&_button[aria-pressed='true']]:hover:bg-red-100 [&_button[aria-pressed='true']]:hover:text-red-700 [&_button[aria-label='Submit']]:border-transparent [&_button[aria-label='Submit']]:bg-red-500 [&_button[aria-label='Submit']]:text-white [&_button[aria-label='Submit']]:shadow-sm [&_button[aria-label='Submit']:not(:disabled)]:hover:bg-red-600 [&_button[aria-label='Submit']:not(:disabled)]:hover:text-white dark:[&_button[aria-label='Submit']]:bg-red-500 dark:[&_button[aria-label='Submit']]:text-white";
      case "longform":
        return "border-indigo-300 focus-within:border-indigo-400 dark:border-indigo-400/65 [&_button[aria-pressed='true']]:bg-indigo-50 [&_button[aria-pressed='true']]:text-indigo-600 [&_button[aria-pressed='true']]:hover:bg-indigo-100 [&_button[aria-pressed='true']]:hover:text-indigo-700 [&_button[aria-label='Submit']]:border-transparent [&_button[aria-label='Submit']]:bg-indigo-500 [&_button[aria-label='Submit']]:text-white [&_button[aria-label='Submit']]:shadow-sm [&_button[aria-label='Submit']:not(:disabled)]:hover:bg-indigo-600 [&_button[aria-label='Submit']:not(:disabled)]:hover:text-white dark:[&_button[aria-label='Submit']]:bg-indigo-500 dark:[&_button[aria-label='Submit']]:text-white";
      case "wechat":
        return "border-emerald-300 focus-within:border-emerald-400 dark:border-emerald-400/65 [&_button[aria-pressed='true']]:bg-emerald-50 [&_button[aria-pressed='true']]:text-emerald-600 [&_button[aria-pressed='true']]:hover:bg-emerald-100 [&_button[aria-pressed='true']]:hover:text-emerald-700 [&_button[aria-label='Submit']]:border-transparent [&_button[aria-label='Submit']]:bg-emerald-500 [&_button[aria-label='Submit']]:text-white [&_button[aria-label='Submit']]:shadow-sm [&_button[aria-label='Submit']:not(:disabled)]:hover:bg-emerald-600 [&_button[aria-label='Submit']:not(:disabled)]:hover:text-white dark:[&_button[aria-label='Submit']]:bg-emerald-500 dark:[&_button[aria-label='Submit']]:text-white";
      case "csdn":
        return "border-orange-300 focus-within:border-orange-400 dark:border-orange-400/65 [&_button[aria-pressed='true']]:bg-orange-50 [&_button[aria-pressed='true']]:text-orange-600 [&_button[aria-pressed='true']]:hover:bg-orange-100 [&_button[aria-pressed='true']]:hover:text-orange-700 [&_button[aria-label='Submit']]:border-transparent [&_button[aria-label='Submit']]:bg-orange-500 [&_button[aria-label='Submit']]:text-white [&_button[aria-label='Submit']]:shadow-sm [&_button[aria-label='Submit']:not(:disabled)]:hover:bg-orange-600 [&_button[aria-label='Submit']:not(:disabled)]:hover:text-white dark:[&_button[aria-label='Submit']]:bg-orange-500 dark:[&_button[aria-label='Submit']]:text-white";
      default:
        return "border-border focus-within:border-primary/60";
    }
  }, [selectedAgent.id]);

  const deletePersonaMutation = useMutation({
    mutationFn: async (personaId: string) => deletePersona(personaId),
  });

  useEffect(() => {
    if (hydratedCreationDraftRef.current) return;
    const draft = peekPendingCreationDraft();
    if (!draft) return;

    hydratedCreationDraftRef.current = true;
    clearPendingCreationDraft();
    setPendingCreationDraft(draft);
    setSelectedAgentId("news");
    setImageModeId("ai");
    setArticleLength("");
    promptInput.textInput.setInput(draft.text);
    if (typeof draft.personaId === "string") {
      setSelectedPersonaId(draft.personaId);
      setSettings("context", {
        ...context,
        persona_id: draft.personaId,
      });
    }
  }, [context, promptInput.textInput, setSettings]);

  useEffect(() => {
    if (!authReady) return;
    if (isLoggedIn) return;

    setSelectedPersonaId(null);

    if (
      context.persona_id !== undefined ||
      context.model_name !== undefined ||
      context.mode !== "flash" ||
      context.reasoning_effort !== undefined
    ) {
      setSettings("context", {
        ...context,
        persona_id: undefined,
        model_name: undefined,
        mode: "flash",
        reasoning_effort: undefined,
      });
    }
  }, [authReady, context, isLoggedIn, setSettings]);

  useEffect(() => {
    setPlaceholderIndex(0);
    const placeholders = AGENT_HERO_COPY[selectedAgentId].placeholders;
    if (placeholders.length <= 1) return;

    const timer = window.setInterval(() => {
      setPlaceholderIndex((current) => (current + 1) % placeholders.length);
    }, PLACEHOLDER_ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [selectedAgentId]);

  useEffect(() => {
    const contextPersonaId =
      typeof context.persona_id === "string" ? context.persona_id : null;

    if (contextPersonaId === selectedPersonaId) return;
    if (!contextPersonaId) {
      setSelectedPersonaId(null);
      return;
    }
    if (!personaOptions.some((item) => item.id === contextPersonaId)) return;

    setSelectedPersonaId(contextPersonaId);
  }, [context.persona_id, personaOptions, selectedPersonaId]);

  useEffect(() => {
    if (!personasFetched) return;

    if (!personaOptions.length) {
      setSelectedPersonaId(null);
      if (context.persona_id) {
        setSettings("context", {
          ...context,
          persona_id: undefined,
        });
      }
      return;
    }

    if (pendingCreationDraft?.personaId === selectedPersonaId) return;
    if (!selectedPersonaId) return;
    if (personaOptions.some((persona) => persona.id === selectedPersonaId)) return;

    setSelectedPersonaId(null);
  }, [
    context,
    pendingCreationDraft?.personaId,
    personaOptions,
    personasFetched,
    selectedPersonaId,
    setSettings,
  ]);

  const startThreadWithText = useCallback(
    async (
      text: string,
      files: FileUIPart[] = [],
      options: StartThreadOptions = {},
    ) => {
      const trimmed = text.trim();
      if (!trimmed && files.length === 0) return false;

      const agentId = options.agentId ?? selectedAgent.id;
      const isRednoteRun = agentId === "rednote";
      const personaId = options.personaId ?? selectedPersonaId;

      setIsStarting(true);
      try {
        const threadId = await createThread({
          metadata: isRednoteRun
            ? { platform: THREAD_METADATA_PLATFORM_REDNOTE }
            : {},
        });
        const now = new Date().toISOString();
        const optimisticThread = {
          thread_id: threadId,
          created_at: now,
          updated_at: now,
          metadata: {},
          values: { title: t("newConversationTitle") },
        } as unknown as AgentThread;

        queryClient.setQueriesData(
          {
            queryKey: ["threads", "search"],
            exact: false,
          },
          (oldData: Array<AgentThread> | undefined) => {
            if (!oldData || oldData.length === 0) {
              return [optimisticThread];
            }

            const withoutCurrent = oldData.filter((item) => item.thread_id !== threadId);
            return [optimisticThread, ...withoutCurrent];
          },
        );

        stashPendingInitialMessage({
          threadId,
          text: trimmed,
          personaId,
          ...(options.additionalKwargs
            ? { additionalKwargs: options.additionalKwargs }
            : {}),
          ...(files.length > 0 ? { files } : {}),
          ...(isRednoteRun
            ? {
                contextOverrides: {
                  ...REDNOTE_CONTEXT_OVERRIDES,
                  size: rednoteAspectRatio,
                },
              }
            : {}),
          ...(isRednoteRun ? { runOptions: REDNOTE_RUN_OPTIONS } : {}),
        });
        setSettings("context", {
          ...context,
          persona_id: personaId ?? undefined,
          size: isRednoteRun ? rednoteAspectRatio : undefined,
        });
        router.push(`/${locale}/creation-center/${threadId}`);
        return true;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("createThreadFailed"));
        return false;
      } finally {
        setIsStarting(false);
      }
    },
    [
      context,
      locale,
      queryClient,
      rednoteAspectRatio,
      router,
      selectedAgent.id,
      selectedPersonaId,
      setSettings,
      t,
    ],
  );

  const buildConfiguredPrompt = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      const length = articleLength.trim();
      const configLines = isRednoteAgent
        ? [
            ...(selectedRednoteStyle
              ? [`风格要求：${selectedRednoteStyle.label}`]
              : []),
            ...(selectedRednoteContentStrategy
              ? [`内容策略：${selectedRednoteContentStrategy.label}`]
              : []),
            `图片比例：${rednoteAspectRatio}`,
            ...(generatedImageCount
              ? [`\u751f\u6210\u56fe\u7247\u5f20\u6570\uff1a${generatedImageCount}\u5f20`]
              : []),
          ]
        : [
            ...(length
              ? [`\u6587\u7ae0\u7bc7\u5e45\uff08\u5b57\u6570\uff09\uff1a${length}`]
              : []),
            `\u914d\u56fe\u65b9\u5f0f\uff1a${selectedImageMode.label}`,
          ];

      return [
        ...(isRednoteAgent
          ? []
          : [
              `\u8bf7\u4f7f\u7528\u300c${selectedAgent.label}\u300d\u5904\u7406\u4ee5\u4e0b\u5185\u5bb9\u521b\u4f5c\u9700\u6c42\u3002`,
            ]),
        ...configLines,
        "",
        trimmed || "\u8bf7\u7ed3\u5408\u6211\u4e0a\u4f20\u7684\u9644\u4ef6\u6216\u7d20\u6750\u5b8c\u6210\u5185\u5bb9\u521b\u4f5c\u3002",
      ].join("\n");
    },
    [
      articleLength,
      generatedImageCount,
      isRednoteAgent,
      rednoteAspectRatio,
      selectedAgent.label,
      selectedImageMode.label,
      selectedRednoteContentStrategy,
      selectedRednoteStyle,
    ],
  );

  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      if (isStarting) return;

      const text = message.text.trim();
      const files = message.files ?? [];

      if (pendingCreationDraft) {
        if (isTopicUnsupportedAgent) return;

        const draftText = buildConfiguredPrompt(text || pendingCreationDraft.text);
        const started = await startThreadWithText(draftText, files, {
          additionalKwargs: pendingCreationDraft.additionalKwargs,
          agentId: "news",
          personaId: pendingCreationDraft.personaId ?? selectedPersonaId,
        });

        if (started) {
          clearPendingCreationDraft();
          setPendingCreationDraft(null);
        }
        return;
      }

      if (!text && files.length === 0) return;

      await startThreadWithText(buildConfiguredPrompt(text), files);
    },
    [
      buildConfiguredPrompt,
      isStarting,
      isTopicUnsupportedAgent,
      pendingCreationDraft,
      selectedPersonaId,
      startThreadWithText,
    ],
  );

  const handleUseRednoteExample = useCallback(
    (example: PublicImageTaskResponse) => {
      const userInput = example.user_input?.trim() ?? "";
      const parsed = parseRednoteExampleUserInput(userInput);
      const referenceImages = getRednoteExampleReferenceImages(example);

      if (parsed.aspectRatio) {
        setRednoteAspectRatio(parsed.aspectRatio);
      }
      if (parsed.styleId !== null) {
        setRednoteStyleId(parsed.styleId);
      }
      if (parsed.contentStrategyId !== null) {
        setRednoteContentStrategyId(parsed.contentStrategyId);
      }
      if (parsed.imageCount !== null) {
        setGeneratedImageCount(parsed.imageCount);
      }

      clearPendingCreationDraft();
      setPendingCreationDraft(null);
      promptInput.textInput.setInput(parsed.text);
      promptInput.attachments.clear();
      promptInput.attachments.addFileParts(
        referenceImages.map((image, index) => ({
          type: "file" as const,
          url: image,
          mediaType: "image/*",
          filename: `reference-${index + 1}.png`,
        })),
      );
    },
    [promptInput],
  );

  const handleClearSelectedTopic = useCallback(() => {
    clearPendingCreationDraft();
    setPendingCreationDraft(null);
  }, []);

  const handleSelectAgent = useCallback(
    (agentId: ContentAgentId) => {
      setSelectedAgentId(agentId);

      if (!pendingCreationDraft) return;
      if (agentId === "rednote") {
        promptInput.textInput.setInput("");
        return;
      }

      if (!promptInput.textInput.value.trim()) {
        promptInput.textInput.setInput(pendingCreationDraft.text);
      }
    },
    [pendingCreationDraft, promptInput.textInput],
  );

  const handleAddPersona = useCallback(async () => {
    if (isStarting) return;
    await startThreadWithText(t("addPersonaPrompt"));
  }, [isStarting, startThreadWithText, t]);

  return (
    <div
      className={cn(
        styles.scene,
        "relative flex min-h-full flex-col items-center justify-center overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_54%,#f6f7fb_100%)] px-6 py-10 dark:bg-[linear-gradient(180deg,#151515_0%,#101010_60%,#151515_100%)]",
      )}
    >
      <div
        className={cn(
          styles.ambient,
          "pointer-events-none absolute inset-x-0 top-12 h-64 opacity-50",
        )}
      />
      <div className="relative z-10 flex w-full max-w-6xl -translate-y-12 flex-col items-center gap-7">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={cn(styles.fadeUp, "[animation-delay:80ms]")}>
            <HighlightedTitle title={selectedAgentHeroCopy.title} />
          </div>
          <p
            className={cn(
              styles.fadeUp,
              "max-w-2xl text-sm text-muted-foreground sm:text-base [animation-delay:140ms]",
            )}
          >
            {selectedAgentHeroCopy.subtitle}
          </p>
          <div
            className={cn(
              styles.fadeUp,
              "flex max-w-4xl flex-wrap items-center justify-center gap-3 [animation-delay:200ms]",
            )}
          >
            {CONTENT_AGENTS.map((agent) => {
              const Icon = agent.icon;
              const selected = agent.id === selectedAgentId;
              const activeStyle = AGENT_ACTIVE_STYLES[agent.id];

              return (
                <button
                  key={agent.id}
                  type="button"
                  className={cn(
                    "group relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-medium shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    selected
                      ? activeStyle.button
                      : "border-transparent bg-white/75 text-foreground/75 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10",
                  )}
                  onClick={() => handleSelectAgent(agent.id)}
                  title={agent.description}
                >
                  {agent.logoSrc ? (
                    <span className="relative flex size-5.5 items-center justify-center overflow-hidden rounded-md bg-white shadow-sm dark:bg-white">
                      <Image
                        src={agent.logoSrc}
                        alt=""
                        width={24}
                        height={24}
                        className="h-full w-full rounded-md object-cover"
                      />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "flex size-5.5 items-center justify-center rounded-md bg-gradient-to-br text-white shadow-sm",
                        agent.accent,
                      )}
                    >
                      <Icon className="size-3.5" />
                    </span>
                  )}
                  <span>{agent.label}</span>
                  {selected ? (
                    <span
                      className={cn(
                        "absolute -right-1 -top-1 size-2.5 rounded-full shadow-[0_0_0_3px_white] dark:shadow-[0_0_0_3px_#151515]",
                        activeStyle.dot,
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={cn(
            styles.fadeUp,
            "relative w-full max-w-[1080px] [animation-delay:260ms]",
          )}
        >
          <div className="absolute left-6 right-6 top-5 z-20 flex flex-wrap items-center gap-2">
            {isRednoteAgent ? (
              <Select
                key="rednote-aspect-ratio"
                value={rednoteAspectRatio}
                onValueChange={(value) => {
                  if (
                    REDNOTE_ASPECT_RATIO_OPTIONS.includes(
                      value as RednoteAspectRatio,
                    )
                  ) {
                    setRednoteAspectRatio(value as RednoteAspectRatio);
                  }
                }}
              >
                <SelectTrigger className="h-8 min-w-[96px] rounded-md border-0 bg-muted/75 px-3 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45">
                  <span>{`比例：${rednoteAspectRatio}`}</span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-32">
                  {REDNOTE_ASPECT_RATIO_OPTIONS.map((ratio) => (
                    <SelectItem key={ratio} value={ratio}>
                      {ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {isRednoteAgent ? (
              <Select
                key="rednote-style"
                value={rednoteStyleId}
                onValueChange={(value) => {
                  const nextStyle = REDNOTE_STYLE_OPTIONS.find(
                    (style) => style.id === value,
                  );

                  if (nextStyle) {
                    setRednoteStyleId(nextStyle.id);
                  }
                }}
              >
                <SelectTrigger className="h-8 min-w-[116px] rounded-md border-0 bg-muted/75 px-3 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    {selectedRednoteStyle ? (
                      <RednoteStyleLogo
                        option={selectedRednoteStyle}
                        className="size-4"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "truncate",
                        !selectedRednoteStyle && "text-muted-foreground",
                      )}
                    >
                      {selectedRednoteStyle
                        ? `风格：${selectedRednoteStyle.label}`
                        : "风格"}
                    </span>
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="start" className="max-h-64 min-w-48">
                  {REDNOTE_STYLE_OPTIONS.map((style) => (
                    <SelectItem key={style.id} className="gap-4 py-1.5" value={style.id}>
                      <RednoteStyleLogo option={style} />
                      <span>{style.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                className="h-8 w-[150px] max-w-full rounded-md border-0 bg-muted/75 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45"
                value={articleLength}
                onChange={(event) => setArticleLength(event.target.value)}
                placeholder={"输入文章篇幅(字数)"}
              />
            )}
            {isRednoteAgent ? (
              <Select
                key="rednote-content-strategy"
                value={rednoteContentStrategyId}
                onValueChange={(value) => {
                  const nextStrategy = REDNOTE_CONTENT_STRATEGY_OPTIONS.find(
                    (strategy) => strategy.id === value,
                  );

                  if (nextStrategy) {
                    setRednoteContentStrategyId(nextStrategy.id);
                  }
                }}
              >
                <SelectTrigger className="h-8 min-w-[116px] rounded-md border-0 bg-muted/75 px-3 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45">
                  <span
                    className={cn(
                      !selectedRednoteContentStrategy && "text-muted-foreground",
                    )}
                  >
                    {selectedRednoteContentStrategy
                      ? `内容策略：${selectedRednoteContentStrategy.label}`
                      : "内容策略"}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="start" className="min-w-40">
                  {REDNOTE_CONTENT_STRATEGY_OPTIONS.map((strategy) => (
                    <SelectItem key={strategy.id} value={strategy.id}>
                      {strategy.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {isRednoteAgent ? (
              <Select
                key="rednote-image-count"
                value={generatedImageCount}
                onValueChange={(value) => {
                  if (value == null || value === "") {
                    setGeneratedImageCount("");
                  } else if (IMAGE_COUNT_OPTIONS.includes(value)) {
                    setGeneratedImageCount(value);
                  }
                }}
              >
                <SelectTrigger className="h-8 min-w-[116px] rounded-md border-0 bg-muted/75 px-3 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45">
                  <span
                    className={cn(
                      generatedImageCount === "" && "text-muted-foreground",
                    )}
                  >
                    {generatedImageCount === ""
                      ? "图片张数"
                      : `图片张数：${generatedImageCount}张`}
                  </span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="start" className="max-h-64 min-w-48">
                  {IMAGE_COUNT_OPTIONS.map((count) => (
                    <SelectItem key={count} value={count}>
                      {count}张
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select
                key="image-mode"
                value={imageModeId}
                onValueChange={(value) => {
                  if (
                    value === "ai" ||
                    value === "search" ||
                    value === "library" ||
                    value === "none"
                  ) {
                    setImageModeId(value);
                  }
                }}
              >
                <SelectTrigger className="h-8 min-w-[104px] rounded-md border-0 bg-muted/75 px-3 text-sm shadow-sm ring-1 ring-foreground/5 transition-colors hover:bg-muted focus-visible:ring-2 dark:bg-muted/45">
                  <span>{selectedImageMode.label}</span>
                  <SelectValue className="sr-only" />
                </SelectTrigger>
                <SelectContent align="start" className="max-h-64 min-w-48">
                  {IMAGE_MODE_OPTIONS.map((mode) => {
                    const Icon = mode.icon;

                    return (
                      <SelectItem key={mode.id} className="gap-2" value={mode.id}>
                        <Icon className="size-4 text-muted-foreground" />
                        <span>{mode.label}</span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>
          <ThreadContext.Provider
            value={{
              thread: fakeThread as unknown as ThreadContextType["thread"],
            }}
          >
            <InputBox
              className={cn(
                composerBorderClass,
                "relative w-full overflow-hidden rounded-[26px] border bg-transparent transition-colors",
                "[&_[data-slot='input-group']]:rounded-[26px] [&_[data-slot='input-group']]:border-0 [&_[data-slot='input-group']]:bg-transparent",
                (isStarting || isTopicUnsupportedAgent) &&
                  "[&_[data-slot='input-group']:has([data-slot=input-group-control]:disabled)]:!bg-muted/30 dark:[&_[data-slot='input-group']:has([data-slot=input-group-control]:disabled)]:!bg-muted/15",
                "[&_[data-slot='input-group']]:!outline-none [&_[data-slot='input-group']]:!ring-0 [&_[data-slot='input-group']]:!ring-transparent",
                "[&_[name='message']]:min-h-[190px]",
                "[&_[name='message']]:border-0",
                "[&_[name='message']]:bg-transparent",
                "[&_[name='message']]:rounded-none",
                "[&_[name='message']]:focus-visible:ring-0",
                "[&_[name='message']]:resize-none",
                "[&_[name='message']]:px-6",
                "[&_[name='message']]:pt-[66px]",
                "[&_[name='message']]:pb-12",
                "[&_[name='message']]:text-base",
                "[&_[name='message']]:placeholder:text-base",
                "[&_[data-slot='input-group-addon']]:px-5 [&_[data-slot='input-group-addon']]:text-sm [&_[data-slot='input-group-addon']_*]:text-sm",
                "[&_[data-slot='input-group-addon']_svg]:size-[14px]",
              )}
              isNewThread={false}
              threadId="new"
              autoFocus={false}
              toolbarVariant={isRednoteAgent ? "attachmentsOnly" : "default"}
              placeholder={selectedPlaceholder}
              status="ready"
              context={context}
              disabled={isStarting || isTopicUnsupportedAgent}
              clearTextOnSubmit={false}
              selectedTopic={visibleSelectedTopic}
              onClearSelectedTopic={handleClearSelectedTopic}
              submitLabel="发送"
              onContextChange={(nextContext) => setSettings("context", nextContext)}
              addPersonaLabel={t("addPersona")}
              noPersonaLabel={t("noPersona")}
              onAddPersonaClick={handleAddPersona}
              personas={personaOptions}
              selectedPersonaId={selectedPersonaId}
              onPersonaSelect={(personaId) => {
                setSelectedPersonaId(personaId);
                setSettings("context", {
                  ...context,
                  persona_id: personaId ?? undefined,
                });
              }}
              onDeletePersonaRequest={(persona) => {
                setPendingDeletePersona(persona);
                setDeletePersonaDialogSnapshot(persona);
                setDeletePersonaDialogOpen(true);
              }}
              onEditPersonaRequest={(persona) => {
                const fullPersona = personaById.get(persona.id);
                if (!fullPersona) return;
                setEditingPersona(fullPersona);
              }}
              showPersonaManagementActions
              attachmentsPlacement="underHeader"
              onSubmit={handleSubmit}
              onStop={undefined}
            />
          </ThreadContext.Provider>
        </div>

        <div className="absolute left-1/2 top-full mt-6 w-[min(1360px,calc(100vw-320px))] -translate-x-1/2 max-lg:w-[calc(100vw-48px)]">
          <RednotePublicExamples
            enabled={isRednoteAgent}
            className={cn(styles.fadeUp, "[animation-delay:320ms]")}
            onUseExample={handleUseRednoteExample}
          />
        </div>
      </div>

      <DeleteConfirmDialog
        open={deletePersonaDialogOpen}
        onOpenChange={(open) => {
          setDeletePersonaDialogOpen(open);
          if (!open) {
            setPendingDeletePersona(null);
          }
        }}
        onConfirm={async () => {
          if (!pendingDeletePersona) return;

          try {
            await deletePersonaMutation.mutateAsync(pendingDeletePersona.id);
            setDeletePersonaDialogOpen(false);
            setPendingDeletePersona(null);

            if (selectedPersonaId === pendingDeletePersona.id) {
              setSelectedPersonaId(null);
              setSettings("context", {
                ...context,
                persona_id: undefined,
              });
            }

            await queryClient.invalidateQueries({
              queryKey: ["personas", "list"],
            });
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : t("deletePersonaFailed"),
            );
          }
        }}
        closeLabel={t("deletePersonaDialog.close")}
        title={t("deletePersonaDialog.title")}
        description={t("deletePersonaDialog.description", {
          name: deletePersonaDialogSnapshot?.name ?? "",
        })}
        cancelLabel={t("deletePersonaDialog.cancel")}
        confirmLabel={t("deletePersonaDialog.confirm")}
        isPending={deletePersonaMutation.isPending}
      />

      {editingPersona ? (
        <EditPersonaDialog
          open={editingPersona != null}
          persona={editingPersona}
          onOpenChange={(open) => {
            if (!open) {
              setEditingPersona(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
