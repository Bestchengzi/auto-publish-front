export const MARKETING_SUBPATHS = [
  "guide",
  "download",
  "pricing",
  "faq",
  "contact",
] as const;

export type MarketingSubpath = (typeof MARKETING_SUBPATHS)[number];

export function marketingHomePath(locale: string): string {
  return `/${locale}/site`;
}

export function marketingSubPath(locale: string, segment: MarketingSubpath): string {
  return `/${locale}/site/${segment}`;
}
