"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { CheckIcon, ChevronDownIcon, MenuIcon, MonitorIcon, MoonIcon, SunIcon, XIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/config";
import { MARKETING_SUBPATHS, marketingHomePath, marketingSubPath } from "@/lib/marketing/paths";
import { useTranslations } from "next-intl";

function normalizePath(pathname: string): string {
  if (pathname.endsWith("/") && pathname.length > 1) return pathname.slice(0, -1);
  return pathname;
}

type MarketingNavItem = {
  key: "guide" | "download" | "pricing" | "faq" | "contact";
  href: string;
  label: string;
};

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const locale = (params?.locale as AppLocale) ?? "zh-CN";
  const t = useTranslations("marketing");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileLocaleOpen, setMobileLocaleOpen] = useState(false);
  const mobileLocaleMenuRef = useRef<HTMLDivElement | null>(null);

  const openMobileNav = () => {
    setMobileNavOpen(true);
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
    setMobileLocaleOpen(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileLocaleOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (mobileLocaleMenuRef.current?.contains(target)) return;
      setMobileLocaleOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [mobileLocaleOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalBodyTouchAction;
    };
  }, [mobileNavOpen]);

  const appName = locale === "en" ? "KeduckAI" : "KeduckAI";
  const localeOptions: AppLocale[] = ["zh-CN", "en"];
  const localeLabels: Record<AppLocale, string> = {
    "zh-CN": t("langZh"),
    en: t("langEn"),
  };
  const localeCurrentLabel = localeLabels[locale];
  const startHref = `/${locale}/creation-center/new`;
  const normalized = pathname ? normalizePath(pathname) : "";

  const switchLocaleHref = (nextLocale: AppLocale) => {
    const sub = normalized.replace(`/${locale}/site`, "") || "";
    return `/${nextLocale}/site${sub}`;
  };

  const setLocaleCookie = (nextLocale: AppLocale) => {
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  };

  const navItems = useMemo<MarketingNavItem[]>(
    () =>
      MARKETING_SUBPATHS.map((seg) => ({
        key: seg,
        href: marketingSubPath(locale, seg),
        label:
          seg === "guide"
            ? t("navGuide")
            : seg === "download"
              ? t("navDownload")
              : seg === "pricing"
                ? t("navPricing")
                : seg === "faq"
                  ? t("navFaq")
                  : t("navContact"),
      })),
    [locale, t],
  );

  return (
    <div className="min-h-screen bg-[#fcfdff] text-slate-900 dark:bg-zinc-950 dark:text-zinc-50 [&_a]:cursor-pointer [&_button]:cursor-pointer [&_summary]:cursor-pointer">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/60 bg-white/90 shadow-sm shadow-slate-900/[0.04] backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/90 dark:shadow-none">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              aria-label={locale === "en" ? "Open navigation menu" : "打开导航菜单"}
              onClick={openMobileNav}
            >
              <MenuIcon className="size-5" aria-hidden />
            </button>
            <Link
              href={marketingHomePath(locale)}
              className="flex items-center gap-2 text-slate-900 dark:text-white"
            >
              <Image
                src="/logo.png"
                alt=""
                width={36}
                height={36}
                className="rounded-lg"
                priority
              />
              <span className="text-lg font-semibold tracking-tight">{appName}</span>
            </Link>
          </div>

          <nav
            className="hidden items-center gap-0.5 lg:flex"
            aria-label={locale === "en" ? "Site navigation" : "官网导航"}
          >
            {navItems.map(({ href, label }) => {
              const active = normalized === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-base transition ${
                    active
                      ? "bg-blue-500/12 font-medium text-blue-800 dark:bg-cyan-500/15 dark:text-cyan-100"
                      : "text-slate-600 hover:bg-blue-500/[0.12] hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-cyan-500/12 dark:hover:text-cyan-200"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {mounted ? (
              <div
                className="flex items-center rounded-lg border border-slate-200/80 bg-white/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/80"
                role="group"
                aria-label={locale === "en" ? "Theme" : "外观"}
              >
                {(
                  [
                    ["light", SunIcon, t("themeLight")],
                    ["dark", MoonIcon, t("themeDark")],
                    ["system", MonitorIcon, t("themeSystem")],
                  ] as const
                ).map(([key, Icon, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    title={label}
                    className={`rounded-md p-2 transition ${
                      theme === key
                        ? "bg-blue-500/15 text-blue-700 dark:bg-cyan-500/25 dark:text-cyan-100"
                        : "text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden />
                    <span className="sr-only">{label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-9 w-[104px] rounded-lg border border-transparent" aria-hidden />
            )}

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="hidden rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  />
                }
              >
                {localeCurrentLabel}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[120px]">
                {localeOptions.map((nextLocale) => {
                  const active = nextLocale === locale;
                  return (
                    <DropdownMenuItem
                      key={nextLocale}
                      onClick={() => {
                        if (active) return;
                        setLocaleCookie(nextLocale);
                        router.push(switchLocaleHref(nextLocale));
                      }}
                      className="flex items-center justify-between"
                    >
                      <span>{localeLabels[nextLocale]}</span>
                      {active ? <CheckIcon className="size-4" aria-hidden /> : <span className="size-4" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href={startHref}
              className={cn(
                buttonVariants({ size: "default", variant: "marketingPrimary" }),
                "hidden h-9 rounded-lg px-4 text-base shadow-sm shadow-blue-600/20 md:inline-flex dark:shadow-cyan-500/15",
              )}
            >
              {t("navCta")}
            </Link>
          </div>
        </div>

      </header>

      <div
        className={cn(
          "fixed inset-0 z-[70] transition-[visibility] duration-200 lg:hidden",
          mobileNavOpen ? "visible" : "invisible",
        )}
        aria-hidden={!mobileNavOpen}
      >
          <button
            type="button"
            onClick={closeMobileNav}
            className={cn(
              "absolute inset-0 bg-black/35 transition-opacity duration-200",
              mobileNavOpen ? "opacity-100" : "opacity-0",
              mobileNavOpen ? "pointer-events-auto" : "pointer-events-none",
            )}
            aria-label={locale === "en" ? "Close navigation menu" : "关闭导航菜单"}
          />

          <aside
            className={cn(
              "absolute inset-y-0 left-0 w-[78%] max-w-[296px] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-zinc-800 dark:bg-zinc-950",
              mobileNavOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            <button
              type="button"
              onClick={closeMobileNav}
              className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={locale === "en" ? "Close navigation menu" : "关闭导航菜单"}
            >
              <XIcon className="size-5" aria-hidden />
            </button>
            <div className="border-b border-slate-200 px-4 py-3.5 pr-12 dark:border-zinc-800">
              <Link
                href={marketingHomePath(locale)}
                onClick={closeMobileNav}
                className="flex items-center gap-2 text-slate-900 dark:text-white"
              >
                <Image
                  src="/logo.png"
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-lg"
                  priority
                />
                <span className="text-lg font-semibold tracking-tight">{appName}</span>
              </Link>
            </div>

            <nav className="space-y-2 px-3 py-4">
              {navItems.map(({ href, label }) => {
                const active = normalized === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMobileNav}
                    className={`block rounded-xl px-4 py-3 text-base ${
                      active
                        ? "bg-blue-500/12 font-medium text-blue-800 dark:bg-cyan-500/15 dark:text-cyan-100"
                        : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div ref={mobileLocaleMenuRef} className="relative mt-2 border-t border-slate-200 px-3 pt-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMobileLocaleOpen((v) => !v)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                aria-expanded={mobileLocaleOpen}
                aria-haspopup="menu"
              >
                <span>{localeCurrentLabel}</span>
                <ChevronDownIcon
                  className={cn("size-4 transition-transform duration-200", mobileLocaleOpen ? "rotate-180" : "rotate-0")}
                  aria-hidden
                />
              </button>
              {mobileLocaleOpen && (
                <div className="absolute inset-x-3 top-full z-20 mt-2 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                  {localeOptions.map((nextLocale) => {
                    const active = nextLocale === locale;
                    return (
                      <button
                        key={nextLocale}
                        type="button"
                        onClick={() => {
                          if (!active) {
                            setLocaleCookie(nextLocale);
                            router.push(switchLocaleHref(nextLocale));
                          }
                          closeMobileNav();
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                          active
                            ? "bg-blue-500/12 font-medium text-blue-800 dark:bg-cyan-500/15 dark:text-cyan-100"
                            : "text-slate-700 hover:bg-slate-100 dark:text-zinc-200 dark:hover:bg-zinc-800",
                        )}
                      >
                        <span>{localeLabels[nextLocale]}</span>
                        {active ? <CheckIcon className="size-4" aria-hidden /> : <span className="size-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
      </div>

      <main id="main" className="bg-[#fcfdff] pt-[64px] dark:bg-zinc-950">
        {children}
      </main>

      <footer className="border-t border-slate-200/60 bg-white py-12 dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-fit grid-cols-3 gap-x-10 gap-y-6 text-sm text-slate-500 sm:mx-0 sm:w-auto sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 dark:text-zinc-400">
            <div className="col-span-3 sm:col-span-2 lg:col-span-1">
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {locale === "en" ? "Info" : "KeduckAI"}
              </p>
              <p className="mt-3 leading-relaxed">
                {locale === "en"
                  ? "KeduckAI helps teams and creators complete chat-based creation and publishing in one place."
                  : "KeduckAI 是面向团队与创作者的一体化对话创作与发布平台。"}
              </p>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {locale === "en" ? "Product" : "产品"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href={marketingSubPath(locale, "guide")} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {t("navGuide")}
                </Link>
                <Link href={marketingSubPath(locale, "pricing")} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {t("navPricing")}
                </Link>
                <Link href={marketingSubPath(locale, "faq")} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {t("navFaq")}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {locale === "en" ? "Legal" : "法律"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href={`/${locale}/site/terms`} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {locale === "en" ? "User Agreement" : "用户协议"}
                </Link>
                <Link href={`/${locale}/site/privacy`} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {locale === "en" ? "Privacy Policy" : "隐私政策"}
                </Link>
              </div>
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {locale === "en" ? "Contact" : "联系"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <Link href={marketingSubPath(locale, "contact")} className="hover:text-blue-700 dark:hover:text-cyan-300">
                  {locale === "en" ? "Contact us" : "联系我们"}
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-slate-200/60 pt-6 text-center text-sm text-slate-500 dark:border-zinc-800/80 dark:text-zinc-500">
            <p>{t("footerCopyright", { year: new Date().getFullYear() })}</p>
            <p className="mt-1">{t("footerIcp")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
