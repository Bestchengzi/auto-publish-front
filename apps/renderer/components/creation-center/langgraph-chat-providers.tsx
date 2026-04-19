"use client";

import "katex/dist/katex.min.css";
// import "streamdown/styles.css";

import { PublishFlowProvider } from "@/components/publish";
import { PromptInputProvider } from "@/components/langgraph/ai-elements/prompt-input";
import { ArtifactsProvider } from "@/components/langgraph/workspace/artifacts";
import { SubtasksProvider } from "@/lib/langgraph/core/tasks/context";

/** DeerFlow 聊天页所需 Provider（与 workspace/chats layout 一致） */
export function LanggraphChatProviders({
  appLocale,
  children,
}: {
  appLocale: string;
  children: React.ReactNode;
}) {
  void appLocale;
  return (
    <SubtasksProvider>
      <ArtifactsProvider>
        <PublishFlowProvider>
          <PromptInputProvider>{children}</PromptInputProvider>
        </PublishFlowProvider>
      </ArtifactsProvider>
    </SubtasksProvider>
  );
}
