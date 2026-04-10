"use client";

import { motion, useReducedMotion } from "motion/react";
import { MailIcon, MessageSquareMoreIcon, PhoneCallIcon } from "lucide-react";

import { sectionContainer, sectionHeading, sectionLead, sectionMotion } from "@/components/marketing-site/marketing-shared";
import { useTranslations } from "next-intl";

export function MarketingContactPage() {
  const t = useTranslations("marketing");
  const reduceMotion = useReducedMotion();
  const sm = sectionMotion(Boolean(reduceMotion));
  const cards = [
    {
      title: t("contactCardEmailTitle"),
      line1: t("contactCardEmailLine1"),
      line2: t("contactCardEmailLine2"),
      icon: MailIcon,
      href: undefined,
    },
    {
      title: t("contactCardPhoneTitle"),
      line1: t("contactCardPhoneLine1"),
      line2: t("contactCardPhoneLine2"),
      icon: PhoneCallIcon,
      href: undefined,
    },
    {
      title: t("contactCardFeedbackTitle"),
      line1: t("contactCardFeedbackLine1"),
      line2: t("contactCardFeedbackLine2"),
      icon: MessageSquareMoreIcon,
      href: undefined,
    },
  ];

  return (
    <section className="py-16 sm:py-20" aria-labelledby="contact-page-heading">
      <div className={`${sectionContainer} max-w-3xl`}>
        <motion.div {...sm} className="mx-auto max-w-3xl text-center">
          <h1 id="contact-page-heading" className={sectionHeading}>
            {t("contactTitle")}
          </h1>
          <p className={`${sectionLead} mx-auto max-w-2xl`}>{t("contactSubtitle")}</p>
        </motion.div>

        <div className="mx-auto mt-10 max-w-3xl space-y-6">
          {cards.map((card, i) => (
            <motion.article
              key={card.title}
              {...sm}
              transition={sm.transition ? { ...sm.transition, delay: reduceMotion ? 0 : i * 0.05 } : undefined}
              className="rounded-2xl border border-slate-200/90 bg-white px-6 py-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-zinc-800 dark:bg-zinc-900/55"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-cyan-500/15 dark:text-cyan-300">
                  <card.icon className="size-6" aria-hidden />
                </div>
                <div>
                  <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">{card.title}</h2>
                  <p className="mt-1 text-base leading-tight text-slate-800 dark:text-zinc-100">{card.line1}</p>
                  <p className="mt-2 text-base leading-tight text-slate-500 dark:text-zinc-400">{card.line2}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
