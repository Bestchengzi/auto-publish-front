import { HomeRootRedirect } from "@/components/home-root-redirect";
import { defaultLocale, locales, type AppLocale } from "@/i18n/config";

/**
 * 带 locale 的根路径（如 /zh-CN）：客户端按 token 跳转新建对话或营销官网。
 */
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;
  return <HomeRootRedirect locale={safeLocale} />;
}
