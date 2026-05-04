"use client";

import { ChevronUpIcon, FolderOpenIcon, NotebookPenIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { type PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import {
  Conversation,
  ConversationContent,
} from "@/components/langgraph/ai-elements/conversation";
import {
  ChatBox,
  useSpecificChatMode,
} from "@/components/langgraph/workspace/chats";
import { InputBox } from "@/components/langgraph/workspace/input-box";
import { MessageList } from "@/components/langgraph/workspace/messages";
import { MessageListItem } from "@/components/langgraph/workspace/messages/message-list-item";
import { ThreadContext } from "@/components/langgraph/workspace/messages/context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImagePreviewDialog } from "@/components/ui/image-preview-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TodoList } from "@/components/langgraph/workspace/todo-list";
import {
  RednoteContentEditor,
  normalizeRednoteContent,
} from "@/components/creation-center/rednote-content-editor";
import { useArtifacts } from "@/components/langgraph/workspace/artifacts";
import { resolveArtifactURL } from "@/lib/langgraph/core/artifacts/utils";
import { useNotification } from "@/lib/langgraph/core/notification/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import {
  useThreadStream,
  type ThreadRunOptions,
} from "@/lib/langgraph/core/threads/hooks";
import { getFileIcon, getFileName } from "@/lib/langgraph/core/utils/files";
import { textOfMessage } from "@/lib/langgraph/core/threads/utils";
import {
  peekPendingInitialMessage,
  takePendingInitialMessage,
} from "@/lib/creation-center/pending-initial-message";
import { listPersonas } from "@/lib/api/personas";
import { cn } from "@/lib/utils";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";

type InsufficientBalanceInfo = {
  message: string;
  availablePoints?: number;
  requiredPoints?: number;
};

const IMAGE_CARDS_GRAPH_ID = "image_cards";

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "webp",
  "gif",
  "bmp",
  "svg",
  "tiff",
  "ico",
  "heic",
]);

function isImageArtifact(filepath: string): boolean {
  const ext = filepath.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isThreadRunStreamMode(
  mode: string,
): mode is NonNullable<ThreadRunOptions["streamMode"]>[number] {
  return mode === "values" || mode === "updates";
}

function normalizeThreadRunOptions(
  runOptions:
    | {
        streamMode?: string[];
      }
    | undefined,
): ThreadRunOptions | undefined {
  const streamMode = runOptions?.streamMode?.filter(isThreadRunStreamMode);
  return streamMode && streamMode.length > 0 ? { streamMode } : undefined;
}

function readMetadataGraphId(
  state: { metadata?: Record<string, unknown> | null },
): string | undefined {
  const graphId = state.metadata?.graph_id;
  return typeof graphId === "string" ? graphId : undefined;
}

function readMetadataSize(
  state: { metadata?: Record<string, unknown> | null },
): string | undefined {
  const size = state.metadata?.size;
  return typeof size === "string" && size.trim() ? size : undefined;
}

function readMetadataInputImages(
  state: { metadata?: Record<string, unknown> | null },
): string[] | undefined {
  const inputImages = state.metadata?.input_images;
  if (!Array.isArray(inputImages)) return undefined;
  const images = inputImages.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return images.length > 0 ? images : undefined;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return value !== null && value !== undefined;
}

function hasStateValue(values: unknown, key: string): boolean {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return false;
  }
  const record = values as Record<string, unknown>;
  return key in record && hasMeaningfulValue(record[key]);
}

function hasThreadStageValue(
  currentValues: unknown,
  history: Array<{ values?: unknown }>,
  key: string,
): boolean {
  if (hasStateValue(currentValues, key)) return true;
  return history.some((state) => hasStateValue(state.values, key));
}

type RednoteGenerationStage = "analysis" | "outline" | "prompts";

const REDNOTE_GENERATION_STEPS: Array<{
  key: RednoteGenerationStage;
  title: string;
  helper: string;
}> = [
  {
    key: "analysis",
    title: "分析用户需求",
    helper: "识别选题、风格、受众和内容价值",
  },
  {
    key: "outline",
    title: "生成提示词大纲",
    helper: "整理封面、内容页和视觉方向",
  },
  {
    key: "prompts",
    title: "生成提示词",
    helper: "打磨每张图的可编辑提示词",
  },
];

const REDNOTE_GENERATION_STAGE_TEXT: Record<
  RednoteGenerationStage,
  {
    title: string;
    detail: string;
    progressClassName: string;
  }
> = {
  analysis: {
    title: "正在分析用户需求",
    detail: "正在拆解主题、风格、受众和小红书内容钩子",
    progressClassName: "w-1/3",
  },
  outline: {
    title: "正在生成提示词大纲",
    detail: "已完成需求分析，正在规划标题正文与图片结构",
    progressClassName: "w-2/3",
  },
  prompts: {
    title: "正在生成提示词",
    detail: "大纲已就绪，正在生成可用于图片创作的详细提示词",
    progressClassName: "w-full",
  },
};

function RednoteGenerationProgress({
  stage,
  className,
}: {
  stage: RednoteGenerationStage;
  className?: string;
}) {
  const stageIndex = REDNOTE_GENERATION_STEPS.findIndex(
    (step) => step.key === stage,
  );
  const stageText = REDNOTE_GENERATION_STAGE_TEXT[stage];

  return (
    <section
      className={cn(
        "relative mx-auto my-5 min-h-[380px] w-full max-w-6xl overflow-hidden rounded-lg border border-border/80 bg-card p-7 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-9",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-rose-500/70"
        aria-hidden="true"
      />

      <header className="relative flex items-start gap-4">
        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-lg bg-background text-rose-500 ring-1 ring-border">
          <span
            className="absolute inset-0 animate-ping rounded-lg bg-rose-400/10"
            aria-hidden="true"
          />
          <NotebookPenIcon className="relative size-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              {stageText.title}
            </h2>
            <span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-600 ring-1 ring-rose-100">
              小红书图文
            </span>
          </div>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {stageText.detail}
          </p>
        </div>
      </header>

      <div className="relative mt-8 h-3 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full bg-rose-500 transition-all duration-500 ease-out",
            stageText.progressClassName,
          )}
        >
          <div
            className="h-full w-full animate-pulse bg-white/30"
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="relative mt-8 grid gap-4 md:grid-cols-3">
        {REDNOTE_GENERATION_STEPS.map((step, index) => {
          const isDone = index < stageIndex;
          const isActive = index === stageIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "min-h-[180px] rounded-lg border p-5 transition-all duration-300",
                isDone
                  ? "border-rose-100 bg-card shadow-sm"
                  : isActive
                    ? "scale-[1.02] border-rose-300 bg-card shadow-[0_12px_30px_rgba(244,63,94,0.12)] animate-pulse"
                    : "border-border/70 bg-card",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-semibold",
                    isDone
                      ? "bg-rose-400 text-white"
                      : isActive
                        ? "bg-rose-500 text-white"
                        : "bg-background text-muted-foreground ring-1 ring-border",
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </span>
                <span className="text-base font-semibold text-foreground">
                  {step.title}
                </span>
              </div>
              <p className="mt-4 min-h-12 text-sm leading-6 text-muted-foreground">
                {step.helper}
              </p>
              {isActive ? (
                <div className="mt-5 space-y-3" aria-hidden="true">
                  <div className="h-3 w-full animate-pulse rounded-sm bg-rose-300/80" />
                  <div className="h-3 w-4/5 animate-pulse rounded-sm bg-rose-200 [animation-delay:180ms]" />
                  <div className="flex gap-2 pt-1">
                    <span className="size-2.5 animate-bounce rounded-full bg-rose-500" />
                    <span className="size-2.5 animate-bounce rounded-full bg-rose-400 [animation-delay:120ms]" />
                    <span className="size-2.5 animate-bounce rounded-full bg-rose-300 [animation-delay:240ms]" />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function extractInsufficientBalanceInfo(
  root: unknown,
): InsufficientBalanceInfo | null {
  const visited = new WeakSet<object>();
  const queue: unknown[] = [root];

  while (queue.length > 0) {
    const node = queue.shift();
    if (!node || typeof node !== "object") continue;
    if (visited.has(node)) continue;
    visited.add(node);

    const candidate = node as Record<string, unknown>;
    const errorCode = candidate.error_code;
    const message = candidate.message;

    if (
      errorCode === "BILLING_INSUFFICIENT_BALANCE" &&
      typeof message === "string" &&
      message.trim()
    ) {
      return {
        message,
        availablePoints: readNumber(candidate.available_points),
        requiredPoints: readNumber(candidate.required_points),
      };
    }

    for (const value of Object.values(candidate)) {
      if (
        typeof value === "string" &&
        value.includes("BILLING_INSUFFICIENT_BALANCE")
      ) {
        return {
          message: "账户余额不足，请先充值后再试。",
        };
      }
      if (value && typeof value === "object") {
        queue.push(value);
      }
    }
  }

  return null;
}

/**
 * DeerFlow 风格聊天主区：无顶栏，仅消息列表 + 底部输入 + ChatBox 右侧产物栏。
 */
export function CreationCenterLanggraphChat() {
  const tCreation = useTranslations("creationCenter.new");
  const [settings, setSettings] = useLocalSettings();
  const params = useParams<{ locale: string; thread_id: string }>();

  const threadId = params.thread_id ?? "";
  const locale = params.locale ?? "zh-CN";
  const { ready: authReady, isLoggedIn } = useAuthLoggedIn();
  const canUseAuthFeatures = authReady && isLoggedIn;

  const isNewThread = false;

  useSpecificChatMode();

  const { showNotification } = useNotification();
  const { select: selectArtifact, setOpen: setArtifactsOpen } = useArtifacts();
  const selectedPersonaId =
    typeof settings.context.persona_id === "string"
      ? settings.context.persona_id
      : null;
  const { data: personasData, isFetched: personasFetched } = useQuery({
    queryKey: ["personas", "list"],
    queryFn: () => listPersonas(),
    staleTime: 60_000,
    enabled: canUseAuthFeatures,
  });
  const personaOptions = useMemo(
    () =>
      canUseAuthFeatures
        ? (personasData?.items ?? []).map((persona) => ({
            id: persona.id,
            name: persona.name,
          }))
        : [],
    [canUseAuthFeatures, personasData?.items],
  );

  useEffect(() => {
    // Wait auth bootstrap; avoid wiping persisted persona on hard refresh.
    if (!authReady) return;
    if (isLoggedIn) return;
    if (
      settings.context.persona_id !== undefined ||
      settings.context.model_name !== undefined ||
      settings.context.mode !== "flash" ||
      settings.context.reasoning_effort !== undefined
    ) {
      setSettings("context", {
        ...settings.context,
        persona_id: undefined,
        model_name: undefined,
        mode: "flash",
        reasoning_effort: undefined,
      });
    }
  }, [authReady, isLoggedIn, setSettings, settings.context]);

  useEffect(() => {
    if (!personasFetched) return;
    if (!selectedPersonaId) return;
    if (personaOptions.some((persona) => persona.id === selectedPersonaId))
      return;
    setSettings("context", {
      ...settings.context,
      persona_id: undefined,
    });
  }, [
    personaOptions,
    personasFetched,
    selectedPersonaId,
    setSettings,
    settings.context,
  ]);

  const pendingRunOptions = useMemo(
    () =>
      threadId ? peekPendingInitialMessage(threadId)?.runOptions : undefined,
    [threadId],
  );
  const pendingContextOverrides = useMemo(
    () =>
      threadId
        ? peekPendingInitialMessage(threadId)?.contextOverrides
        : undefined,
    [threadId],
  );
  const streamAssistantId = pendingRunOptions?.assistantId ?? "lead_agent";
  const threadRunOptions = useMemo(
    () => normalizeThreadRunOptions(pendingRunOptions),
    [pendingRunOptions],
  );
  const threadContextOverrides = useMemo(
    () =>
      pendingContextOverrides &&
      Object.keys(pendingContextOverrides).length > 0
        ? pendingContextOverrides
        : undefined,
    [pendingContextOverrides],
  );
  const isPendingImageCardsThread =
    pendingRunOptions?.assistantId === IMAGE_CARDS_GRAPH_ID;

  const [thread, sendMessage, isUploading] = useThreadStream({
    threadId: threadId || undefined,
    assistantId: streamAssistantId,
    context: settings.context,
    onStart: () => {
      if (typeof window !== "undefined" && threadId) {
        const path = `/${locale}/creation-center/${threadId}`;
        history.replaceState(null, "", path);
      }
    },
    onFinish: (state) => {
      if (document.hidden || !document.hasFocus()) {
        let body = "Conversation finished";
        const lastMessage = state.messages.at(-1);
        if (lastMessage) {
          const textContent = textOfMessage(lastMessage);
          if (textContent) {
            body =
              textContent.length > 200
                ? textContent.substring(0, 200) + "..."
                : textContent;
          }
        }
        showNotification(state.title, { body });
      }
    },
  });
  const historyGraphId = useMemo(
    () => thread.history.map(readMetadataGraphId).find(Boolean),
    [thread.history],
  );
  const rednoteImageSize = useMemo(
    () => thread.history.map(readMetadataSize).find(Boolean) ?? null,
    [thread.history],
  );
  const rednoteInputImages = useMemo(
    () => thread.history.map(readMetadataInputImages).find(Boolean) ?? null,
    [thread.history],
  );
  const showInputBox =
    !isPendingImageCardsThread &&
    typeof historyGraphId === "string" &&
    historyGraphId !== IMAGE_CARDS_GRAPH_ID;
  const isImageCardsDisplay =
    isPendingImageCardsThread || historyGraphId === IMAGE_CARDS_GRAPH_ID;
  const rednoteContent = useMemo(() => {
    const latest = normalizeRednoteContent(thread.values.rednote_content);
    if (latest) return latest;

    for (const state of thread.history) {
      const values = state.values;
      if (!values || typeof values !== "object" || Array.isArray(values)) {
        continue;
      }
      const fromHistory = normalizeRednoteContent(
        (values as Record<string, unknown>).rednote_content,
      );
      if (fromHistory) return fromHistory;
    }

    return null;
  }, [thread.history, thread.values.rednote_content]);
  const rednoteGenerationStage = useMemo<RednoteGenerationStage>(() => {
    const hasOutline = hasThreadStageValue(
      thread.values,
      thread.history,
      "outline",
    );
    if (hasOutline) return "prompts";

    const hasAnalysis = hasThreadStageValue(
      thread.values,
      thread.history,
      "analysis",
    );
    if (hasAnalysis) return "outline";

    return "analysis";
  }, [thread.history, thread.values]);
  const rednoteHumanMessages = useMemo(
    () => thread.messages.filter((message) => message.type === "human"),
    [thread.messages],
  );
  const insufficientBalanceInfo = useMemo(
    () => extractInsufficientBalanceInfo(thread),
    [thread],
  );
  const [insufficientBalanceDialogOpen, setInsufficientBalanceDialogOpen] =
    useState(false);
  const lastShownBalanceAlertKeyRef = useRef<string | null>(null);
  const balanceAlertKey = useMemo(() => {
    if (!insufficientBalanceInfo) return null;
    return `${insufficientBalanceInfo.message}|${insufficientBalanceInfo.availablePoints ?? ""}|${insufficientBalanceInfo.requiredPoints ?? ""}`;
  }, [insufficientBalanceInfo]);

  const pendingBootstrapRef = useRef(false);

  useEffect(() => {
    pendingBootstrapRef.current = false;
  }, [threadId]);

  useEffect(() => {
    lastShownBalanceAlertKeyRef.current = null;
  }, [threadId]);

  useEffect(() => {
    if (!balanceAlertKey) return;
    if (lastShownBalanceAlertKeyRef.current === balanceAlertKey) return;
    lastShownBalanceAlertKeyRef.current = balanceAlertKey;
    setInsufficientBalanceDialogOpen(true);
  }, [balanceAlertKey]);

  useEffect(() => {
    if (!threadId || thread.isThreadLoading) return;
    if (pendingBootstrapRef.current) return;
    const pending = takePendingInitialMessage(threadId);
    if (!pending) return;
    if (thread.messages.length > 0) return;
    pendingBootstrapRef.current = true;
    setSettings("context", {
      ...settings.context,
      persona_id: pending.personaId ?? undefined,
    });
    void sendMessage(
      threadId,
      { text: pending.text, files: pending.files },
      {
        ...(pending.personaId ? { persona_id: pending.personaId } : {}),
        ...(threadContextOverrides ?? {}),
      },
      pending.additionalKwargs,
      threadRunOptions,
    );
  }, [
    threadId,
    thread.isThreadLoading,
    thread.messages.length,
    sendMessage,
    setSettings,
    settings.context,
    threadContextOverrides,
    threadRunOptions,
  ]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!threadId) return;
      void sendMessage(threadId, message);
    },
    [sendMessage, threadId],
  );

  const handleStop = useCallback(async () => {
    await thread.stop();
  }, [thread]);
  const todos = thread.values.todos ?? [];
  const artifacts = useMemo(() => {
    const list = thread.values.artifacts ?? [];
    return Array.from(new Set(list));
  }, [thread.values.artifacts]);
  const showTodoList = todos.length > 0;
  const showArtifactPanel = artifacts.length > 0;
  const [artifactCollapsed, setArtifactCollapsed] = useState(true);
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  if (!threadId) {
    return null;
  }

  return (
    <ThreadContext.Provider value={{ thread }}>
      <ChatBox threadId={threadId}>
        <div className="relative flex size-full min-h-0 justify-between">
          <main className="flex min-h-0 max-w-full flex-1 flex-col">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden">
              {isImageCardsDisplay ? (
                <Conversation className="min-h-0 flex-1 pt-6">
                  <ConversationContent className="mx-auto w-full max-w-6xl gap-6 px-6 py-8">
                    {rednoteHumanMessages.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {rednoteHumanMessages.map((message) => (
                          <MessageListItem
                            key={message.id}
                            message={message}
                            isLoading={false}
                          />
                        ))}
                      </div>
                    ) : null}
                    <RednoteContentEditor
                      className="mt-4 px-0 py-0"
                      rednoteContent={rednoteContent}
                      threadId={threadId}
                      imageSize={rednoteImageSize}
                      inputImages={rednoteInputImages}
                    />
                    {!rednoteContent &&
                    (thread.isLoading || thread.isThreadLoading) ? (
                      <RednoteGenerationProgress
                        stage={rednoteGenerationStage}
                      />
                    ) : null}
                  </ConversationContent>
                </Conversation>
              ) : (
                <MessageList
                  className={cn("min-h-0 flex-1", "pt-6")}
                  threadId={threadId}
                  thread={thread}
                />
              )}
            </div>
            <div className="z-30 flex shrink-0 justify-center px-4 pb-4 pt-4">
              <div className="relative w-full max-w-(--container-width-md)">
                {showArtifactPanel && (
                  <div className="mb-2">
                    <div
                      className={cn(
                        "flex h-fit w-full origin-bottom flex-col overflow-hidden rounded-xl border bg-white/95 backdrop-blur-sm transition-all duration-200 ease-out",
                        "bg-background/5",
                      )}
                    >
                      <header
                        className="bg-background flex min-h-8 shrink-0 cursor-pointer items-center justify-between px-4 text-sm transition-all duration-300 ease-out"
                        onClick={() => setArtifactCollapsed((prev) => !prev)}
                      >
                        <div className="text-muted-foreground">
                          <div className="flex items-center justify-center gap-2">
                            <FolderOpenIcon className="size-4" />
                            <div>{tCreation("generatedFilesPanelTitle")}</div>
                          </div>
                        </div>
                        <div>
                          <ChevronUpIcon
                            className={cn(
                              "text-muted-foreground size-4 transition-transform duration-300 ease-out",
                              artifactCollapsed ? "" : "rotate-180",
                            )}
                          />
                        </div>
                      </header>
                      <main
                        className={cn(
                          "bg-background flex grow px-2 transition-all duration-300 ease-out",
                          artifactCollapsed
                            ? "h-0 overflow-hidden pb-0"
                            : "h-36 pb-3",
                        )}
                      >
                        <ScrollArea className="h-full w-full">
                          <div className="pr-4 pt-1">
                            <ul className="grid grid-cols-2 gap-2">
                              {artifacts.map((filepath) => {
                                const filename = getFileName(filepath);
                                if (isImageArtifact(filepath)) {
                                  return (
                                    <li key={filepath}>
                                      <button
                                        type="button"
                                        className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-left transition-colors"
                                        onClick={() =>
                                          setPreviewImage({
                                            src: resolveArtifactURL(filepath, threadId),
                                            alt: filename,
                                          })
                                        }
                                      >
                                        {getFileIcon(
                                          filepath,
                                          "text-primary size-4 shrink-0",
                                        )}
                                        <span className="truncate text-sm text-foreground">
                                          {filename}
                                        </span>
                                      </button>
                                    </li>
                                  );
                                }
                                return (
                                  <li key={filepath}>
                                    <button
                                      type="button"
                                      className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-left transition-colors"
                                      onClick={() => {
                                        selectArtifact(filepath);
                                        setArtifactsOpen(true);
                                      }}
                                    >
                                      {getFileIcon(
                                        filepath,
                                        "text-primary size-4 shrink-0",
                                      )}
                                      <span className="truncate text-sm text-foreground">
                                        {filename}
                                      </span>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        </ScrollArea>
                      </main>
                    </div>
                  </div>
                )}
                {showTodoList && (
                  <div className="mb-2">
                    <TodoList
                      className="bg-background/5"
                      todos={todos}
                    />
                  </div>
                )}

                {showInputBox ? (
                  <InputBox
                    className={cn(
                      "w-full overflow-hidden rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)]",
                      "[&_[name='message']]:text-base [&_[name='message']]:placeholder:text-base",
                      "[&_[data-slot='input-group-addon']]:text-sm [&_[data-slot='input-group-addon']_*]:text-sm",
                      "[&_[data-slot='input-group-addon']_svg]:size-[14px]",
                    )}
                    isNewThread={isNewThread}
                    threadId={threadId}
                    autoFocus={false}
                    status={
                      thread.error
                        ? "error"
                        : thread.isLoading
                          ? "streaming"
                          : "ready"
                    }
                    context={settings.context}
                    disabled={isUploading}
                    onContextChange={(context) => setSettings("context", context)}
                    noPersonaLabel={tCreation("noPersona")}
                    personas={personaOptions}
                    selectedPersonaId={selectedPersonaId}
                    onPersonaSelect={(personaId) =>
                      setSettings("context", {
                        ...settings.context,
                        persona_id: personaId ?? undefined,
                      })
                    }
                    onSubmit={handleSubmit}
                    onStop={handleStop}
                  />
                ) : null}
              </div>
            </div>
          </main>
        </div>
        <ImagePreviewDialog
          open={Boolean(previewImage?.src?.trim())}
          onOpenChange={(open) => {
            if (!open) setPreviewImage(null);
          }}
          src={previewImage?.src?.trim() ?? ""}
          alt={previewImage?.alt ?? "artifact-image"}
        />
        <Dialog
          open={insufficientBalanceDialogOpen}
          onOpenChange={setInsufficientBalanceDialogOpen}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>余额不足提醒</DialogTitle>
              <DialogDescription className="pt-1 text-sm text-foreground/80">
                {insufficientBalanceInfo?.message ??
                  "账户余额不足，请先充值后再试。"}
                {typeof insufficientBalanceInfo?.availablePoints === "number" &&
                typeof insufficientBalanceInfo?.requiredPoints === "number"
                  ? `（当前余额：${insufficientBalanceInfo.availablePoints}，所需：${insufficientBalanceInfo.requiredPoints}）`
                  : ""}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                onClick={() => setInsufficientBalanceDialogOpen(false)}
              >
                我知道了
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ChatBox>
    </ThreadContext.Provider>
  );
}
