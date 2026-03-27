"use client";

import "katex/dist/katex.min.css";
import "streamdown/styles.css";

import { PromptInputProvider } from "@/components/langgraph/ai-elements/prompt-input";
import { ArtifactsProvider } from "@/components/langgraph/workspace/artifacts";
import {
  type Locale,
  normalizeLocale,
} from "@/lib/langgraph/core/i18n/index";
import { I18nProvider } from "@/lib/langgraph/core/i18n/context";
import { SubtasksProvider } from "@/lib/langgraph/core/tasks/context";

function appLocaleToDeer(appLocale: string): Locale {
  if (appLocale === "en") return "en-US";
  return normalizeLocale(appLocale);
}

/** DeerFlow 聊天页所需 Provider（与 workspace/chats layout 一致） */
export function LanggraphChatProviders({
  appLocale,
  children,
}: {
  appLocale: string;
  children: React.ReactNode;
}) {
  return (
    <I18nProvider initialLocale={appLocaleToDeer(appLocale)}>
      <SubtasksProvider>
        <ArtifactsProvider>
          <PromptInputProvider>{children}</PromptInputProvider>
        </ArtifactsProvider>
      </SubtasksProvider>
    </I18nProvider>
  );
}
