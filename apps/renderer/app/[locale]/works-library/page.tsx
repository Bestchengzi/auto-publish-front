import { WorksLibrary } from "@/components/works-library";
import { AppShell } from "@/components/app-shell";

export default async function WorksLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="worksLibrary">
      <WorksLibrary />
    </AppShell>
  );
}
