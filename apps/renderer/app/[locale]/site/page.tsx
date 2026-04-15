import type { Metadata } from "next";

import { MarketingLanding } from "@/components/marketing-site/marketing-landing";
import { getMessages } from "@/i18n/get-messages";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";

type MarketingMessages = {
  metaTitle: string;
  metaDescription: string;
  jsonLdDescription: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  const messages = (await getMessages(safeLocale)) as { marketing?: MarketingMessages };
  const m = messages.marketing;
  const title = m?.metaTitle ?? (safeLocale === "en" ? "Keduck AI" : "可达AI");
  const description = m?.metaDescription ?? "";

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

  return {
    title,
    description,
    alternates: {
      canonical: `/${safeLocale}/site`,
      languages: {
        "zh-CN": "/zh-CN/site",
        en: "/en/site",
        "x-default": "/zh-CN/site",
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      locale: safeLocale === "en" ? "en_US" : "zh_CN",
      url: base ? `${base}/${safeLocale}/site` : undefined,
      siteName: safeLocale === "en" ? "Keduck AI" : "可达AI",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MarketingSitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  setRequestLocale(safeLocale);

  const messages = (await getMessages(safeLocale)) as { marketing?: MarketingMessages; app?: { name?: string } };
  const m = messages.marketing;
  const appName = messages.app?.name ?? (safeLocale === "en" ? "Keduck AI" : "可达AI");
  const description = m?.jsonLdDescription ?? m?.metaDescription ?? "";

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const pageUrl = origin ? `${origin}/${safeLocale}/site` : `/${safeLocale}/site`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${pageUrl}#organization`,
        name: appName,
        description,
        url: pageUrl,
      },
      {
        "@type": "WebSite",
        "@id": `${pageUrl}#website`,
        url: pageUrl,
        name: appName,
        description,
        publisher: { "@id": `${pageUrl}#organization` },
        inLanguage: safeLocale === "en" ? "en" : "zh-CN",
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: m?.metaTitle ?? appName,
        description,
        isPartOf: { "@id": `${pageUrl}#website` },
        inLanguage: safeLocale === "en" ? "en" : "zh-CN",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingLanding />
    </>
  );
}
