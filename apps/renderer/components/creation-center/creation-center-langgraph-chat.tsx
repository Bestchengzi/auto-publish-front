"use client";

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
import { TodoList } from "@/components/langgraph/workspace/todo-list";
import { useNotification } from "@/lib/langgraph/core/notification/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { useThreadStream } from "@/lib/langgraph/core/threads/hooks";
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
      { text: pending.text, files: [] },
      pending.personaId ? { persona_id: pending.personaId } : {},
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
  const showTodoList = todos.length > 0;

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
                className={cn("min-h-0 flex-1", "pt-10")}
                threadId={threadId}
                thread={thread}
              />
            </div>
            <div className="z-30 flex shrink-0 justify-center px-4 pb-4 pt-4">
              <div className="relative w-full max-w-(--container-width-md)">
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
