import type { Metadata } from "next";

import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

const FALLBACK_SEO_METADATA: Record<
  string,
  {
    en: { title: string; description: string };
    "zh-CN": { title: string; description: string };
  }
> = {
  guide: {
    en: {
      title: "KeduckAI User Guide - AI Creation and Multi-platform Publishing Workflow",
      description:
        "Learn how to use KeduckAI for persona setup, topic expansion, draft generation, visual insertion, and multi-platform publishing.",
    },
    "zh-CN": {
      title: "KeduckAI使用说明 - AI创作与多平台发布流程指南",
      description:
        "了解KeduckAI的人设创建、热点发散、内容生成、智能配图与多平台发布流程，快速上手对话式 AI 创作。",
    },
  },
  download: {
    en: {
      title: "Download KeduckAI - Windows and macOS Client",
      description:
        "Download the KeduckAI desktop client for Windows, Intel Mac, and Apple Silicon Mac to start AI content creation and publishing.",
    },
    "zh-CN": {
      title: "下载KeduckAI客户端 - Windows 与 macOS 版本",
      description:
        "下载KeduckAI桌面客户端，支持 Windows、Intel Mac 和 Apple Silicon Mac，快速开启 AI 内容创作与发布。",
    },
  },
  pricing: {
    en: {
      title: "KeduckAI Pricing - Credits and Subscription Plans",
      description:
        "View KeduckAI pricing, subscription tiers, monthly credits, and plan differences for AI creation and scheduled publishing.",
    },
    "zh-CN": {
      title: "KeduckAI定价 - 积分与订阅套餐说明",
      description:
        "查看KeduckAI的套餐定价、月度积分、订阅差异与购买说明，适配 AI 创作与定时发布需求。",
    },
  },
  faq: {
    en: {
      title: "KeduckAI FAQ - Account, Credits, Publishing, and Automation",
      description:
        "Read common questions about KeduckAI, including login, credits, supported platforms, data safety, and publishing workflows.",
    },
    "zh-CN": {
      title: "KeduckAI常见问题 - 登录、积分、发布与自动化",
      description:
        "查看KeduckAI常见问题，了解登录使用、积分消耗、支持平台、数据安全和发布方式等信息。",
    },
  },
  contact: {
    en: {
      title: "Contact KeduckAI - Business, Support, and Partnerships",
      description:
        "Contact KeduckAI for business cooperation, channel partnerships, private deployment, enterprise procurement, and product support.",
    },
    "zh-CN": {
      title: "联系我们 - KeduckAI商务合作与产品支持",
      description:
        "联系KeduckAI，获取商务合作、渠道对接、私有化部署、企业采购和产品支持服务。",
    },
  },
  terms: {
    en: {
      title: "KeduckAI Terms of Service",
      description:
        "Read the KeduckAI Terms of Service, including account usage, service scope, fees, responsibilities, and compliance rules.",
    },
    "zh-CN": {
      title: "KeduckAI用户协议",
      description:
        "阅读KeduckAI用户协议，了解账号使用、服务范围、费用规则、责任边界与合规要求。",
    },
  },
  privacy: {
    en: {
      title: "KeduckAI Privacy Policy",
      description:
        "Read the KeduckAI Privacy Policy to understand how information is collected, used, stored, shared, and protected.",
    },
    "zh-CN": {
      title: "KeduckAI隐私政策",
      description:
        "阅读KeduckAI隐私政策，了解信息收集、使用、存储、共享和安全保护方式。",
    },
  },
};

function fallbackSeoMetadata(locale: AppLocale, segment: string) {
  const siteName = locale === "en" ? "KeduckAI" : "KeduckAI";
  return (
    FALLBACK_SEO_METADATA[segment]?.[locale] ??
    FALLBACK_SEO_METADATA[segment]?.["zh-CN"] ?? {
      title: siteName,
      description: "",
    }
  );
}

export async function marketingSubpageMetadata(
  locale: string,
  segment: string,
  keys: { titleKey: string; descriptionKey: string },
): Promise<Metadata> {
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  const messages = (await getMessages(safeLocale)) as {
    marketing?: Record<string, string>;
  };
  const m = messages.marketing ?? {};
  const fallbackMetadata = fallbackSeoMetadata(safeLocale, segment);
  const title = m[keys.titleKey]?.trim() || fallbackMetadata.title;
  const description =
    m[keys.descriptionKey]?.trim() ||
    fallbackMetadata.description ||
    m.metaDescription?.trim() ||
    "";
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const path = `/${safeLocale}/site/${segment}`;
  const siteName = safeLocale === "en" ? "KeduckAI" : "KeduckAI";

  return {
    title: {
      absolute: title,
    },
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
      siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
