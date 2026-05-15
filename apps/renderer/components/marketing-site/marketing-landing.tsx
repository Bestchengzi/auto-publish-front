"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  BookOpenTextIcon,
  CalendarClockIcon,
  FileTextIcon,
  LightbulbIcon,
  ListChecksIcon,
  QuoteIcon,
  ImagePlusIcon,
  MessageCircleMoreIcon,
  MessageSquareTextIcon,
  NewspaperIcon,
  RocketIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  ZapIcon,
} from "lucide-react";

import { sectionMotion } from "@/components/marketing-site/marketing-shared";
import { buttonVariants } from "@/components/ui/button-variants";
import type { AppLocale } from "@/i18n/config";
import { marketingSubPath } from "@/lib/marketing/paths";
import { platformSeoPages, scenarioSeoPages } from "@/lib/marketing/seo-pages";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MarketingLanding() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) ?? "zh-CN";
  const t = useTranslations("marketing");
  const reduceMotion = useReducedMotion();
  const sm = sectionMotion(Boolean(reduceMotion));
  const startHref = `/${locale}/creation-center/new`;

  const spots = [
    {
      title: t("spotlightPersonaTitle"),
      desc: t("spotlightPersonaDesc"),
      icon: UserRoundIcon,
    },
    {
      title: t("spotlightBrandPersonaTitle"),
      desc: t("spotlightBrandPersonaDesc"),
      icon: ShieldCheckIcon,
    },
    {
      title: t("spotlightTopicsTitle"),
      desc: t("spotlightTopicsDesc"),
      icon: LightbulbIcon,
    },
    {
      title: t("spotlightChatTitle"),
      desc: t("spotlightChatDesc"),
      icon: MessageSquareTextIcon,
    },
    {
      title: t("spotlightEditorTitle"),
      desc: t("spotlightEditorDesc"),
      icon: FileTextIcon,
    },
    {
      title: t("spotlightWorkflowTitle"),
      desc: t("spotlightWorkflowDesc"),
      icon: ListChecksIcon,
    },
    {
      title: t("spotlightImageTitle"),
      desc: t("spotlightImageDesc"),
      icon: ImagePlusIcon,
    },
    {
      title: t("spotlightPublishTitle"),
      desc: t("spotlightPublishDesc"),
      icon: RocketIcon,
    },
    {
      title: t("spotlightAutomationTitle"),
      desc: t("spotlightAutomationDesc"),
      icon: CalendarClockIcon,
    },
  ];

  const platformCards = [
    { title: t("platformRednoteTitle"), desc: t("platformRednoteDesc"), icon: ImagePlusIcon },
    { title: t("platformZhihuTitle"), desc: t("platformZhihuDesc"), icon: MessageCircleMoreIcon },
    { title: t("platformWechatTitle"), desc: t("platformWechatDesc"), icon: BookOpenTextIcon },
    { title: t("platformToutiaoTitle"), desc: t("platformToutiaoDesc"), icon: NewspaperIcon },
    { title: t("platformCsdnTitle"), desc: t("platformCsdnDesc"), icon: FileTextIcon },
    { title: t("platformBaijiahaoTitle"), desc: t("platformBaijiahaoDesc"), icon: RocketIcon },
  ];

  const workflowItems = [1, 2, 3, 4, 5].map((i) => ({
    title: t(`workflow${i}Title`),
    desc: t(`workflow${i}Desc`),
  }));

  const audienceCards = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    title: t(`audience${i}Title`),
    desc: t(`audience${i}Desc`),
  }));

  const chooseItems = [
    { title: t("choosePoint1Title"), desc: t("choosePoint1Desc"), icon: ZapIcon },
    { title: t("choosePoint2Title"), desc: t("choosePoint2Desc"), icon: ShieldCheckIcon },
  ];
  const seoLinkGroups = [
    {
      title: t("seoPlatformLinksTitle"),
      desc: t("seoPlatformLinksDesc"),
      kind: "platforms",
      pages: platformSeoPages,
    },
    {
      title: t("seoScenarioLinksTitle"),
      desc: t("seoScenarioLinksDesc"),
      kind: "scenarios",
      pages: scenarioSeoPages,
    },
  ] as const;
  const getInitial = (name: string) => name.trim().charAt(0).toUpperCase();

  return (
    <>
      <section
        className="relative overflow-hidden bg-gradient-to-b from-[#f9fcff] via-[#fcfdff] to-[#fefefe] dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950"
        aria-labelledby="hero-heading"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(78%_62%_at_50%_8%,rgba(59,130,246,0.045),rgba(59,130,246,0)_68%)] dark:bg-[radial-gradient(75%_60%_at_50%_10%,rgba(34,211,238,0.1),rgba(34,211,238,0)_70%)]" />
        <div className="pointer-events-none absolute -left-32 top-8 size-[430px] rounded-full bg-blue-200/7 blur-[140px] dark:bg-cyan-500/8" />
        <div className="pointer-events-none absolute -right-32 top-18 size-[430px] rounded-full bg-cyan-200/7 blur-[140px] dark:bg-blue-500/8" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/72 via-white/24 to-transparent dark:from-zinc-950 dark:via-zinc-950/45 dark:to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8">
          <motion.div {...sm} className="text-center">
            <h1
              id="hero-heading"
              className="mx-auto mt-6 max-w-5xl font-bold leading-[1.14] tracking-tight text-slate-900 dark:text-white"
            >
              <span className="block text-4xl md:text-[56px]">{t("heroName")}</span>
              <span className="mt-4 block text-3xl md:text-[56px]">
                {t("heroTitlePrefix")}
                <span className="text-blue-600 dark:text-cyan-300">{t("heroTitleHighlight")}</span>
                {t("heroTitleSuffix")}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-zinc-400">
              {t("heroSubtitle")}
            </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:items-center">
                <Link
                  href={startHref}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "marketingPrimary" }),
                    "h-12 min-w-44 rounded-full px-8 text-base font-semibold shadow-md shadow-blue-600/25 dark:shadow-cyan-500/20",
                  )}
                >
                  {t("heroCtaPrimary")}
                </Link>
                <Link
                  href={marketingSubPath(locale, "pricing")}
                  className={cn(
                    buttonVariants({ size: "lg", variant: "marketingSecondary" }),
                    "h-12 min-w-44 rounded-full px-8 text-base font-semibold backdrop-blur-sm",
                  )}
                >
                  {t("heroCtaSecondary")}
                </Link>
              </div>
          </motion.div>
        </div>

        <div className="relative mx-auto max-w-3xl px-6 pb-10 sm:pb-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scaleX: 0.85 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, scaleX: 1 }}
            viewport={{ once: true, amount: 0.9 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="h-px origin-center rounded-full bg-gradient-to-r from-transparent via-slate-300/55 to-transparent shadow-[0_0_20px_rgba(148,163,184,0.2)] dark:from-transparent dark:via-cyan-400/20 dark:to-transparent dark:shadow-[0_0_28px_rgba(34,211,238,0.1)]"
            aria-hidden
          />
        </div>
      </section>

      <section
        className="border-b border-slate-200/50 bg-white py-16 dark:border-zinc-800/80 dark:bg-zinc-900/35 sm:py-20"
        aria-labelledby="spotlights-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="mx-auto max-w-2xl text-center">
            <h2
              id="spotlights-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              {t("spotlightsTitle")}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("spotlightsSubtitle")}
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {spots.map((item, i) => (
              <motion.div
                key={item.title}
                {...sm}
                transition={
                  sm.transition
                    ? { ...sm.transition, delay: reduceMotion ? 0 : i * 0.07 }
                    : undefined
                }
              >
                <article className="group flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition [transition-property:box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/55 dark:hover:border-cyan-500/35 sm:rounded-2xl sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/[0.1] text-blue-700 transition group-hover:bg-blue-500/[0.14] dark:bg-cyan-500/15 dark:text-cyan-300 sm:size-11 sm:rounded-2xl">
                      <item.icon className="size-5" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-lg">
                      {item.title}
                    </h3>
                  </div>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-slate-600 dark:text-zinc-400 sm:mt-2 sm:text-sm">
                    {item.desc}
                  </p>
                </article>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-b border-slate-200/60 bg-[#f7faff] py-16 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-20"
        aria-labelledby="platforms-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="mx-auto max-w-3xl text-center">
            <h2
              id="platforms-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              {t("platformsTitle")}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("platformsSubtitle")}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {platformCards.map((item, i) => (
              <motion.article
                key={item.title}
                {...sm}
                transition={
                  sm.transition
                    ? { ...sm.transition, delay: reduceMotion ? 0 : i * 0.05 }
                    : undefined
                }
                className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/65"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/[0.1] text-blue-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                    <item.icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-b border-slate-200/60 bg-white py-16 dark:border-zinc-800/80 dark:bg-zinc-900/35 sm:py-20"
        aria-labelledby="seo-guides-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="mx-auto max-w-3xl text-center">
            <h2
              id="seo-guides-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              {t("seoGuidesTitle")}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("seoGuidesSubtitle")}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {seoLinkGroups.map((group) => (
              <article
                key={group.kind}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/65"
              >
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {group.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {group.desc}
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {group.pages.map((page) => (
                    <Link
                      key={page.slug}
                      href={`/${locale}/site/${group.kind}/${page.slug}`}
                      className="group flex min-h-14 items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:bg-zinc-950/35 dark:text-zinc-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-200"
                    >
                      <span>{page.heading[locale]}</span>
                      <ArrowRightIcon className="size-4 shrink-0 opacity-60 transition group-hover:translate-x-0.5" aria-hidden />
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-b border-slate-200/60 bg-[#f7faff] py-16 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-20"
        aria-labelledby="workflow-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="max-w-3xl">
            <h2
              id="workflow-heading"
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white"
            >
              {t("workflowTitle")}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("workflowSubtitle")}
            </p>
          </motion.div>

          <div className="mt-9 grid gap-4 lg:grid-cols-5">
            {workflowItems.map((item, i) => (
              <motion.article
                key={item.title}
                {...sm}
                transition={
                  sm.transition
                    ? { ...sm.transition, delay: reduceMotion ? 0 : i * 0.05 }
                    : undefined
                }
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-cyan-500">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/60 bg-white py-16 dark:border-zinc-800/80 dark:bg-zinc-900/35 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="max-w-3xl">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t("audienceTitle")}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("audienceSubtitle")}
            </p>
          </motion.div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {audienceCards.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/65"
              >
                <h4 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {item.title}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/60 bg-[#f7faff] py-16 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div {...sm} className="mx-auto max-w-2xl text-center">
            <h4 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t("testimonialsTitle")}
            </h4>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 sm:text-base dark:text-zinc-400">
              {t("testimonialsSubtitle")}
            </p>
          </motion.div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <article
                key={i}
                className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <QuoteIcon className="size-6 text-blue-200 dark:text-cyan-400/40" strokeWidth={2.5} aria-hidden />
                <p className="mt-4 min-h-[78px] text-base leading-relaxed text-slate-700 dark:text-zinc-300">
                  “{t(`testimonial${i}Quote`)}”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                    {getInitial(t(`testimonial${i}Name`))}
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-none text-slate-900 dark:text-white">
                      {t(`testimonial${i}Name`)}
                    </p>
                    <p className="mt-1 text-base text-slate-500 dark:text-zinc-400">{t(`testimonial${i}Role`)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 dark:bg-zinc-900/40 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...sm}
            className="rounded-2xl border border-blue-200/70 bg-blue-50/55 p-6 dark:border-cyan-500/30 dark:bg-cyan-950/25 sm:p-7"
          >
            <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("chooseTitle")}
            </h4>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {chooseItems.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 ring-1 ring-blue-200/70 dark:bg-zinc-900 dark:text-cyan-300 dark:ring-cyan-500/30">
                    <item.icon className="size-4" aria-hidden />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
