"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";

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
import { env } from "@/lib/langgraph/env";
import { cn } from "@/lib/utils";

/**
 * DeerFlow 风格聊天主区：无顶栏，仅消息列表 + 底部输入 + ChatBox 右侧产物栏。
 */
export function CreationCenterLanggraphChat() {
  const { t } = useI18n();
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
    const text = takePendingInitialMessage(threadId);
    if (!text) return;
    if (thread.messages.length > 0) return;
    pendingBootstrapRef.current = true;
    void sendMessage(threadId, { text, files: [] });
  }, [
    threadId,
    thread.isThreadLoading,
    thread.messages.length,
    sendMessage,
    demoLocked,
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
          <main className="flex min-h-0 max-w-full grow flex-col">
            <div className="flex size-full justify-center">
              <MessageList
                className={cn("size-full", "pt-10")}
                threadId={threadId}
                thread={thread}
              />
            </div>
            <div className="absolute right-0 bottom-0 left-0 z-30 flex justify-center px-4">
              <div
                className={cn(
                  "relative w-full max-w-(--container-width-md)",
                )}
              >
                <div className="absolute -top-4 right-0 left-0 z-0">
                  <div className="absolute right-0 bottom-0 left-0">
                    {/* <TodoList
                      className="bg-background/5"
                      todos={thread.values.todos ?? []}
                      hidden={
                        !thread.values.todos || thread.values.todos.length === 0
                      }
                    /> */}
                  </div>
                </div>
                <InputBox
                  className={cn(
                    "w-full -translate-y-4 overflow-hidden rounded-2xl border border-primary bg-card shadow-[0_0_20px_rgba(124,58,237,0.25)]",
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
                  onSubmit={handleSubmit}
                  onStop={handleStop}
                />
                {demoLocked && (
                  <div className="text-muted-foreground/67 w-full translate-y-12 text-center text-xs">
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
