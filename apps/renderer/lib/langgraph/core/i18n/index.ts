import type { Translations as LocaleTranslations } from "./locales/types";

export const SUPPORTED_LOCALES = ["zh-CN", "en-US"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export type Translations = LocaleTranslations;

export const DEFAULT_LOCALE: Locale = "zh-CN";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;

  const normalized = value.trim().replace("_", "-");
  const lower = normalized.toLowerCase();

  if (isLocale(normalized)) return normalized;

  if (lower === "zh" || lower.startsWith("zh-")) {
    return "zh-CN";
  }

  if (lower === "en" || lower.startsWith("en-")) {
    return "en-US";
  }

  return DEFAULT_LOCALE;
}

export function detectLocale(): Locale {
  if (typeof navigator === "undefined") {
    return DEFAULT_LOCALE;
  }

  const candidates = [
    navigator.language,
    ...(navigator.languages ?? []),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeLocale(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_LOCALE;
}

export { I18nProvider, useI18nContext } from "./context";
export { useI18n } from "./hooks";
export { getLocaleFromCookie, setLocaleInCookie, getLocaleFromCookieServer } from "./cookies";
