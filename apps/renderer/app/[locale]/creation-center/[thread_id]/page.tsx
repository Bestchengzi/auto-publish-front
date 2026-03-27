import { AppShell } from "@/components/app-shell";
import { CreationCenterLanggraphChat } from "@/components/creation-center/creation-center-langgraph-chat";

export default async function CreationCenterThreadPage({
  params,
}: {
  params: Promise<{ locale: string; thread_id: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="creationCenter">
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <CreationCenterLanggraphChat />
      </div>
    </AppShell>
  );
}
