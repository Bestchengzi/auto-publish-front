import { AppShell } from "@/components/app-shell";
import { CreationCenterNewChat } from "@/components/creation-center/creation-center-new-chat";

export default async function CreationCenterNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="creationCenter">
      <CreationCenterNewChat />
    </AppShell>
  );
}
