export const locales = ["zh-CN", "en"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "zh-CN";

