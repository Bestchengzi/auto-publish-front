"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDownIcon } from "lucide-react";

import { sectionContainer, sectionHeading, sectionLead, sectionMotion } from "@/components/marketing-site/marketing-shared";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function MarketingFaqPage() {
  const t = useTranslations("marketing");
  const reduceMotion = useReducedMotion();
  const sm = sectionMotion(Boolean(reduceMotion));

  const faqs = Array.from({ length: 12 }, (_, index) => {
    const i = index + 1;
    return { q: t(`faq${i}Q`), a: t(`faq${i}A`) };
  });

  return (
    <section className="border-b border-slate-200/50 py-16 dark:border-zinc-800/80 sm:py-20" aria-labelledby="faq-page-heading">
      <div className={`${sectionContainer} max-w-3xl`}>
        <motion.div {...sm} className="mx-auto max-w-3xl text-center">
          <h1 id="faq-page-heading" className={sectionHeading}>
            {t("faqTitle")}
          </h1>
          <p className={cn(sectionLead, "mx-auto md:max-w-none md:whitespace-nowrap")}>{t("faqPageLead")}</p>
        </motion.div>

        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {faqs.map((item, i) => (
            <motion.div
              key={item.q}
              {...sm}
              transition={
                sm.transition ? { ...sm.transition, delay: reduceMotion ? 0 : i * 0.05 } : undefined
              }
            >
              <details className="group rounded-2xl border border-slate-200/90 bg-white/95 transition-colors open:bg-white dark:border-zinc-800 dark:bg-zinc-900/45 dark:open:bg-zinc-900/70">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-left text-[15px] font-medium text-slate-900 dark:text-white [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDownIcon className="size-5 shrink-0 text-slate-400 transition group-open:rotate-180 dark:text-zinc-500" />
                </summary>
                <div className="border-t border-slate-200/60 px-5 pb-4 pt-0 text-sm leading-relaxed text-slate-600 dark:border-zinc-700 dark:text-zinc-400">
                  <p className="whitespace-pre-line pt-3">{item.a}</p>
                </div>
              </details>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
