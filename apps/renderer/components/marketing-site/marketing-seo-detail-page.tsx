import Link from "next/link";
import { ArrowRightIcon, CheckCircle2Icon } from "lucide-react";

import type { AppLocale } from "@/i18n/config";
import type { SeoDetailPage, SeoPageKind } from "@/lib/marketing/seo-pages";

type MarketingSeoDetailPageProps = {
  kind: SeoPageKind;
  locale: AppLocale;
  page: SeoDetailPage;
  related: SeoDetailPage[];
};

function kindLabel(kind: SeoPageKind, locale: AppLocale) {
  if (kind === "platforms") return locale === "en" ? "Platform guides" : "平台专题";
  return locale === "en" ? "Scenario guides" : "场景专题";
}

export function MarketingSeoDetailPage({
  kind,
  locale,
  page,
  related,
}: MarketingSeoDetailPageProps) {
  const startHref = `/${locale}/creation-center/new`;
  const homeHref = `/${locale}/site`;
  const faqItems = page.faq[locale];

  return (
    <>
      <section className="border-b border-slate-200/60 bg-gradient-to-b from-[#f7fbff] to-white py-16 dark:border-zinc-800/80 dark:from-zinc-950 dark:to-zinc-900/40 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="text-sm text-slate-500 dark:text-zinc-400" aria-label={locale === "en" ? "Breadcrumb" : "面包屑"}>
              <Link href={homeHref} className="hover:text-blue-700 dark:hover:text-cyan-300">
                KeduckAI
              </Link>
              <span className="mx-2">/</span>
              <span>{kindLabel(kind, locale)}</span>
            </nav>
            <p className="mt-8 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
              {page.badge[locale]}
            </p>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
              {page.heading[locale]}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-lg">
              {page.lead[locale]}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={startHref}
                className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 dark:bg-cyan-500 dark:text-zinc-950 dark:hover:bg-cyan-400"
              >
                {locale === "en" ? "Start creating" : "开始创作"}
              </Link>
              <Link
                href={`/${locale}/site/guide`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-cyan-500/40 dark:hover:text-cyan-200"
              >
                {locale === "en" ? "View guide" : "查看使用说明"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/60 bg-white py-14 dark:border-zinc-800/80 dark:bg-zinc-900/40 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              {page.highlightsTitle[locale]}
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {page.highlights[locale].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <CheckCircle2Icon className="mt-0.5 size-5 shrink-0 text-blue-600 dark:text-cyan-300" aria-hidden />
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-200/70 bg-blue-50/55 p-6 dark:border-cyan-500/25 dark:bg-cyan-950/20">
            <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
              {page.workflowTitle[locale]}
            </h2>
            <ol className="mt-5 space-y-4">
              {page.workflow[locale].map((item, index) => (
                <li key={item} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white dark:bg-cyan-500 dark:text-zinc-950">
                    {index + 1}
                  </span>
                  <p className="pt-0.5 text-sm leading-relaxed text-slate-700 dark:text-zinc-300">{item}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/60 bg-[#f8fbff] py-14 dark:border-zinc-800/80 dark:bg-zinc-950 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            {locale === "en" ? "Questions people ask" : "常见问题"}
          </h2>
          <div className="mt-6 space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-slate-200/90 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/65"
              >
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-zinc-300">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 dark:bg-zinc-900/40 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {locale === "en" ? "Related pages" : "相关专题"}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                {locale === "en"
                  ? "Continue exploring platform and scenario pages for KeduckAI."
                  : "继续了解 KeduckAI 的平台能力和内容运营场景。"}
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={`/${locale}/site/${kind}/${item.slug}`}
                className="group rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900/65 dark:hover:border-cyan-500/35"
              >
                <p className="text-base font-semibold text-slate-950 group-hover:text-blue-700 dark:text-white dark:group-hover:text-cyan-200">
                  {item.heading[locale]}
                </p>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">
                  {item.description[locale]}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-cyan-300">
                  {locale === "en" ? "Read more" : "查看详情"}
                  <ArrowRightIcon className="size-4" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
