import type { MetadataRoute } from "next";

import { locales } from "@/i18n/config";
import { platformSeoPages, scenarioSeoPages } from "@/lib/marketing/seo-pages";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://keduck.cn";
  const staticSitePaths = ["site", "site/guide", "site/download", "site/pricing", "site/faq", "site/contact"];
  const now = new Date();

  const urls = locales.flatMap((locale) => {
    const staticUrls = staticSitePaths.map((path) => ({
      url: `${base}/${locale}/${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "site" ? 1 : 0.75,
    }));
    const platformUrls = platformSeoPages.map((page) => ({
      url: `${base}/${locale}/site/platforms/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
    const scenarioUrls = scenarioSeoPages.map((page) => ({
      url: `${base}/${locale}/site/scenarios/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));

    return [...staticUrls, ...platformUrls, ...scenarioUrls];
  });

  return urls;
}
