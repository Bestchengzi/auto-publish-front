import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { MarketingSeoDetailPage } from "@/components/marketing-site/marketing-seo-detail-page";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { getAllSeoPages, getSeoPage, platformSeoPages } from "@/lib/marketing/seo-pages";
import { setRequestLocale } from "next-intl/server";

function safeLocale(locale: string): AppLocale {
  return locales.includes(locale as AppLocale) ? (locale as AppLocale) : defaultLocale;
}

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    platformSeoPages.map((page) => ({
      locale,
      slug: page.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const currentLocale = safeLocale(locale);
  const page = getSeoPage("platforms", slug);
  if (!page) return {};

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const path = `/${currentLocale}/site/platforms/${slug}`;

  return {
    title: { absolute: page.title[currentLocale] },
    description: page.description[currentLocale],
    keywords: page.keywords[currentLocale],
    alternates: {
      canonical: path,
      languages: {
        "zh-CN": `/zh-CN/site/platforms/${slug}`,
        en: `/en/site/platforms/${slug}`,
        "x-default": `/zh-CN/site/platforms/${slug}`,
      },
    },
    robots: { index: true, follow: true },
    openGraph: {
      title: page.title[currentLocale],
      description: page.description[currentLocale],
      type: "article",
      locale: currentLocale === "en" ? "en_US" : "zh_CN",
      url: base ? `${base}${path}` : undefined,
      siteName: "KeduckAI",
    },
    twitter: {
      card: "summary_large_image",
      title: page.title[currentLocale],
      description: page.description[currentLocale],
    },
  };
}

export default async function PlatformSeoRoute({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const currentLocale = safeLocale(locale);
  setRequestLocale(currentLocale);

  const page = getSeoPage("platforms", slug);
  if (!page) notFound();

  const pageUrl = `/${currentLocale}/site/platforms/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        name: page.title[currentLocale],
        description: page.description[currentLocale],
        url: pageUrl,
        inLanguage: currentLocale === "en" ? "en" : "zh-CN",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: "KeduckAI",
        applicationCategory:
          currentLocale === "en"
            ? "AI Writing Tool, AI Content Creation Platform, Multi-platform Publishing Tool, Content Matrix Operations Tool"
            : "AI写作工具、AI内容创作平台、多平台发布工具、内容矩阵运营工具",
        operatingSystem: "Windows, macOS, Web",
        description: page.description[currentLocale],
        featureList: page.highlights[currentLocale],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faq[currentLocale].map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
  const related = getAllSeoPages("platforms").filter((item) => item.slug !== slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingSeoDetailPage kind="platforms" locale={currentLocale} page={page} related={related} />
    </>
  );
}
