"use client";

import { CreationCenterNewChat } from "@/components/creation-center/creation-center-new-chat";
import { LanggraphChatProviders } from "@/components/creation-center/langgraph-chat-providers";

export function CreationCenterNewRouteContent({
  appLocale,
}: {
  appLocale: string;
}) {
  return (
    <LanggraphChatProviders appLocale={appLocale}>
      <CreationCenterNewChat />
    </LanggraphChatProviders>
  );
}
