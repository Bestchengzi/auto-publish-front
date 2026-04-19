"use client";

import { CreationCenterLanggraphChat } from "@/components/creation-center/creation-center-langgraph-chat";
import { LanggraphChatProviders } from "@/components/creation-center/langgraph-chat-providers";

export function CreationCenterThreadRouteContent({
  appLocale,
}: {
  appLocale: string;
}) {
  return (
    <LanggraphChatProviders appLocale={appLocale}>
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <CreationCenterLanggraphChat />
      </div>
    </LanggraphChatProviders>
  );
}
