import { MarketingGuidePage } from "@/components/marketing-site/marketing-guide-page";
import { marketingSubpageMetadata } from "@/lib/marketing/build-metadata";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return marketingSubpageMetadata(locale, "guide", {
    titleKey: "metaGuideTitle",
    descriptionKey: "metaGuideDescription",
  });
}

export default async function MarketingGuideRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  setRequestLocale(safeLocale);
  return <MarketingGuidePage />;
}
