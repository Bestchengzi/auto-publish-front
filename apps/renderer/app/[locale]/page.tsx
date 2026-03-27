import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/app-shell";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");

  return (
    <AppShell locale={locale} activeKey="overview">
      <div className="w-full rounded-xl bg-background p-6 text-sm text-muted-foreground">
        {t("placeholder", { path: `/${locale}/account` })}
      </div>
    </AppShell>
  );
}

