import { MaterialLibrary } from "@/components/material-library";
import { AppShell } from "@/components/app-shell";

export default async function AssetLibraryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <AppShell locale={locale} activeKey="assetLibrary">
      <MaterialLibrary />
    </AppShell>
  );
}
