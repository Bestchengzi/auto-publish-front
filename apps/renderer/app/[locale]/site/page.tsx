import type { Metadata } from "next";

import { MarketingLanding } from "@/components/marketing-site/marketing-landing";
import { getMessages } from "@/i18n/get-messages";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { setRequestLocale } from "next-intl/server";

type MarketingMessages = Record<string, string> & {
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
  const title = m?.metaTitle ?? (safeLocale === "en" ? "KeduckAI" : "KeduckAI");
  const description = m?.metaDescription ?? "";

  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const keywords =
    safeLocale === "en"
      ? [
          "KeduckAI",
          "Xiaohongshu post generator",
          "Xiaohongshu image-text posts",
          "AI writing tool",
          "AI writing platform",
          "AI creation platform",
          "AI content generation tool",
          "AI article generator",
          "AI self-media tool",
          "self-media tool",
          "self-media content creation tool",
          "social media operation tool",
          "Xiaohongshu posts",
          "Xiaohongshu notes generator",
          "Xiaohongshu copy generator",
          "WeChat Official Account articles",
          "Toutiao articles",
          "Zhihu articles",
          "Baijiahao articles",
          "CSDN articles",
          "self-media topic tool",
          "multi-platform content creation",
          "multi-platform publishing",
          "content matrix operations",
          "scheduled publishing",
        ]
      : [
          "KeduckAI",
          "小红书图文生成工具",
          "小红书爆款图文",
          "AI写作工具",
          "AI写作平台",
          "AI创作平台",
          "AI内容生成工具",
          "AI文章生成",
          "AI自媒体工具",
          "自媒体工具",
          "自媒体运营工具",
          "自媒体内容创作工具",
          "小红书图文",
          "小红书笔记生成",
          "小红书文案生成",
          "公众号文章生成",
          "头条文章生成",
          "知乎文章生成",
          "百家号文章生成",
          "CSDN技术文章生成",
          "自媒体选题工具",
          "多平台内容创作",
          "多平台发布",
          "内容矩阵运营",
          "自媒体矩阵运营",
          "定时发布",
          "智能配图",
        ];

  return {
    title,
    description,
    keywords,
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
      siteName: safeLocale === "en" ? "KeduckAI" : "KeduckAI",
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
  const appName = messages.app?.name ?? (safeLocale === "en" ? "KeduckAI" : "KeduckAI");
  const description = m?.jsonLdDescription ?? m?.metaDescription ?? "";

  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const pageUrl = origin ? `${origin}/${safeLocale}/site` : `/${safeLocale}/site`;
  const featureList =
    safeLocale === "en"
      ? [
          "AI writing tool and AI creation platform",
          "AI content generation tool and AI article generator",
          "AI self-media tool for social media operations",
          "Xiaohongshu image-text post generation",
          "Xiaohongshu note and copy generation",
          "WeChat Official Account article generation",
          "Toutiao article generation",
          "Zhihu article generation",
          "Baijiahao article generation",
          "CSDN article generation",
          "Self-media topic inspiration",
          "Smart image matching",
          "Chat publishing, manual publishing, and scheduled publishing",
          "Multi-platform content matrix operations",
        ]
      : [
          "AI写作工具与AI创作平台",
          "AI内容生成工具与AI文章生成",
          "面向自媒体运营的AI自媒体工具",
          "小红书图文生成",
          "小红书笔记生成与小红书文案生成",
          "公众号文章生成",
          "头条文章生成",
          "知乎文章生成",
          "百家号文章生成",
          "CSDN文章生成",
          "自媒体选题工具",
          "文章智能配图",
          "对话发布、手动发布与定时发布",
          "多平台内容矩阵运营",
          "发布记录查看与多平台结果追踪",
      ];
  const faqEntities = Array.from({ length: 12 }, (_, index) => {
    const i = index + 1;
    const question = m?.[`faq${i}Q`];
    const answer = m?.[`faq${i}A`];
    if (!question || !answer) return null;
    return {
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    };
  }).filter(Boolean);

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
      {
        "@type": "SoftwareApplication",
        "@id": `${pageUrl}#software`,
        name: appName,
        applicationCategory:
          safeLocale === "en"
            ? "AI Writing Tool, AI Content Creation Platform, AI Self-media Tool, Multi-platform Publishing Tool, Content Matrix Operations Tool"
            : "AI写作工具、AI内容创作平台、AI自媒体工具、多平台发布工具、内容矩阵运营工具",
        operatingSystem: "Windows, macOS, Web",
        url: pageUrl,
        description,
        featureList,
        offers: {
          "@type": "Offer",
          priceCurrency: "CNY",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: faqEntities,
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
