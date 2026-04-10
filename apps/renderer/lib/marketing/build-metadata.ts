import type { Metadata } from "next";

import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

export async function marketingSubpageMetadata(
  locale: string,
  segment: string,
  keys: { titleKey: string; descriptionKey: string },
): Promise<Metadata> {
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  const messages = (await getMessages(safeLocale)) as { marketing?: Record<string, string> };
  const m = messages.marketing ?? {};
  const title = m[keys.titleKey] ?? "";
  const description = m[keys.descriptionKey] ?? "";
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const path = `/${safeLocale}/site/${segment}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": `/zh-CN/site/${segment}`,
        en: `/en/site/${segment}`,
        "x-default": `/zh-CN/site/${segment}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      locale: safeLocale === "en" ? "en_US" : "zh_CN",
      url: base ? `${base}${path}` : undefined,
      siteName: safeLocale === "en" ? "MediaBee" : "可达AI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
