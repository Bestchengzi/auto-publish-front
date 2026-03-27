import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/get-messages";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  return {
    locale: safeLocale,
    messages: await getMessages(safeLocale),
  };
});

