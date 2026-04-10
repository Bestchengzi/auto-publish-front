"use client";

import { motion, useReducedMotion } from "motion/react";

import { sectionContainer, sectionHeading, sectionLead, sectionMotion } from "@/components/marketing-site/marketing-shared";
import { useTranslations } from "next-intl";

export function MarketingGuidePage() {
  const t = useTranslations("marketing");
  const reduceMotion = useReducedMotion();
  const sm = sectionMotion(Boolean(reduceMotion));

  const guideSteps = [
    { title: t("guideStep1Title"), desc: t("guideStep1Desc") },
    { title: t("guideStep2Title"), desc: t("guideStep2Desc") },
    { title: t("guideStep3Title"), desc: t("guideStep3Desc") },
    { title: t("guideStep4Title"), desc: t("guideStep4Desc") },
    { title: t("guideStep5Title"), desc: t("guideStep5Desc") },
    { title: t("guideStep6Title"), desc: t("guideStep6Desc") },
  ];

  return (
    <section className="border-b border-slate-200/50 py-16 dark:border-zinc-800/80 sm:py-20" aria-labelledby="guide-page-heading">
      <div className={sectionContainer}>
        <motion.div {...sm} className="mx-auto max-w-3xl text-center">
          <h1 id="guide-page-heading" className={sectionHeading}>
            {t("guideTitle")}
          </h1>
          <p className={`${sectionLead} mx-auto`}>{t("guidePageLead")}</p>
        </motion.div>

        <ol className="mx-auto mt-14 max-w-3xl space-y-5">
          {guideSteps.map((step, index) => (
            <motion.li
              key={step.title}
              {...sm}
              className="flex gap-4 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm shadow-slate-900/[0.03] dark:border-zinc-800 dark:bg-zinc-900/40 sm:gap-6 sm:p-6"
            >
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-sm shadow-blue-600/25 dark:from-cyan-500 dark:to-cyan-600"
                aria-hidden
              >
                {index + 1}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-zinc-400">{step.desc}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
