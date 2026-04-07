"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { type PromptInputMessage } from "@/components/langgraph/ai-elements/prompt-input";
import { ChatBox, useSpecificChatMode } from "@/components/langgraph/workspace/chats";
import { InputBox } from "@/components/langgraph/workspace/input-box";
import { MessageList } from "@/components/langgraph/workspace/messages";
import { ThreadContext } from "@/components/langgraph/workspace/messages/context";
// import { TodoList } from "@/components/langgraph/workspace/todo-list";
import { useI18n } from "@/lib/langgraph/core/i18n/hooks";
import { useNotification } from "@/lib/langgraph/core/notification/hooks";
import { useLocalSettings } from "@/lib/langgraph/core/settings";
import { useThreadStream } from "@/lib/langgraph/core/threads/hooks";
import { textOfMessage } from "@/lib/langgraph/core/threads/utils";
import { takePendingInitialMessage } from "@/lib/creation-center/pending-initial-message";
import { listPersonas } from "@/lib/api/personas";
import { env } from "@/lib/langgraph/env";
import { cn } from "@/lib/utils";

/**
 * DeerFlow 风格聊天主区：无顶栏，仅消息列表 + 底部输入 + ChatBox 右侧产物栏。
 */
export function CreationCenterLanggraphChat() {
  const { t } = useI18n();
  const tCreation = useTranslations("creationCenter.new");
  const [settings, setSettings] = useLocalSettings();
  const params = useParams<{ locale: string; thread_id: string }>();

  const threadId = params.thread_id ?? "";
  const locale = params.locale ?? "zh-CN";

  const isNewThread = false;

  const demoLocked = useMemo(
    () => env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY === "true",
    [],
  );

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
  });
  const personaOptions = useMemo(
    () => (personasData?.items ?? []).map((persona) => ({ id: persona.id, name: persona.name })),
    [personasData?.items],
  );

  useEffect(() => {
    if (!personasFetched) return;
    if (!selectedPersonaId) return;
    if (personaOptions.some((persona) => persona.id === selectedPersonaId)) return;
    setSettings("context", {
      ...settings.context,
      persona_id: undefined,
    });
  }, [personaOptions, personasFetched, selectedPersonaId, setSettings, settings.context]);

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

  const pendingBootstrapRef = useRef(false);

  useEffect(() => {
    pendingBootstrapRef.current = false;
  }, [threadId]);

  useEffect(() => {
    if (!threadId || thread.isThreadLoading || demoLocked) return;
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
    demoLocked,
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
            <div className="z-30 flex shrink-0 justify-center px-4 pb-4 pt-2">
              <div className="relative w-full max-w-(--container-width-md)">
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
                  disabled={demoLocked || isUploading}
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
                {demoLocked && (
                  <div className="text-muted-foreground/67 mt-3 w-full text-center text-xs">
                    {t.common.notAvailableInDemoMode}
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </ChatBox>
    </ThreadContext.Provider>
  );
}
