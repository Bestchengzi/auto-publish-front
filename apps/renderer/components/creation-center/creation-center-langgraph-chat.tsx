"use client";

import { ChevronUpIcon, FolderOpenIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { type PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import {
  ChatBox,
  useSpecificChatMode,
} from "@/components/langgraph/workspace/chats";
import { InputBox } from "@/components/langgraph/workspace/input-box";
import { MessageList } from "@/components/langgraph/workspace/messages";
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
import { TodoList } from "@/components/langgraph/workspace/todo-list";
import { useArtifacts } from "@/components/langgraph/workspace/artifacts";
import { resolveArtifactURL } from "@/lib/langgraph/core/artifacts/utils";
import { useNotification } from "@/lib/langgraph/core/notification/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { useThreadStream } from "@/lib/langgraph/core/threads/hooks";
import { getFileIcon, getFileName } from "@/lib/langgraph/core/utils/files";
import { textOfMessage } from "@/lib/langgraph/core/threads/utils";
import { takePendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import { listPersonas } from "@/lib/api/personas";
import { cn } from "@/lib/utils";
import { useAuthLoggedIn } from "@/hooks/use-auth-logged-in";

type InsufficientBalanceInfo = {
  message: string;
  availablePoints?: number;
  requiredPoints?: number;
};

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

  const [thread, sendMessage, isUploading] = useThreadStream({
    threadId: threadId || undefined,
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
      pending.personaId ? { persona_id: pending.personaId } : {},
      pending.additionalKwargs,
    );
  }, [
    threadId,
    thread.isThreadLoading,
    thread.messages.length,
    sendMessage,
    setSettings,
    settings.context,
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
              <MessageList
                className={cn("min-h-0 flex-1", "pt-6")}
                threadId={threadId}
                thread={thread}
              />
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
                        <div className="w-full overflow-y-auto pt-1">
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
