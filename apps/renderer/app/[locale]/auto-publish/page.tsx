import { AppShell } from "@/components/app-shell";
import { AutoPublishPanel } from "@/components/auto-publish/auto-publish-panel";

export default async function AutoPublishPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="autoPublish">
      <AutoPublishPanel />
    </AppShell>
  );
}
