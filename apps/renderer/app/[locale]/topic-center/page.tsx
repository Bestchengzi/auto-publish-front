import { TopicCenter } from "@/components/topic-center";
import { AppShell } from "@/components/app-shell";

export default async function TopicCenterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="topicCenter">
      <TopicCenter />
    </AppShell>
  );
}
