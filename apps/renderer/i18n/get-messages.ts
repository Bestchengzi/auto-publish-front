import type { AppLocale } from "@/i18n/config";

export type Messages = Record<string, unknown>;

export async function getMessages(locale: AppLocale): Promise<Messages> {
  switch (locale) {
    case "en":
      return (await import("@/messages/en.json")).default;
    case "zh-CN":
      return (await import("@/messages/zh-CN.json")).default;
    default:
      return (await import("@/messages/zh-CN.json")).default;
  }
}

