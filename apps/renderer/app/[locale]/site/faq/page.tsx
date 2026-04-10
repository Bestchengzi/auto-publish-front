import { MarketingFaqPage } from "@/components/marketing-site/marketing-faq-page";
import { marketingSubpageMetadata } from "@/lib/marketing/build-metadata";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return marketingSubpageMetadata(locale, "faq", {
    titleKey: "metaFaqTitle",
    descriptionKey: "metaFaqDescription",
  });
}

export default async function MarketingFaqRoute({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  setRequestLocale(safeLocale);
  return <MarketingFaqPage />;
}
