import { AppShell } from "@/components/app-shell";
import { CreationCenterNewChat } from "@/components/creation-center/creation-center-new-chat";
import { LanggraphChatProviders } from "@/components/creation-center/langgraph-chat-providers";

export default async function CreationCenterNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="creationCenter">
      <LanggraphChatProviders appLocale={locale}>
        <CreationCenterNewChat />
      </LanggraphChatProviders>
    </AppShell>
  );
}
