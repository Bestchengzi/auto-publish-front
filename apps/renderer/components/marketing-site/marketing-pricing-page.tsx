"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";
import {
  getBillingSubscriptionPlans,
  type BillingCycle,
  type BillingSubscriptionPlan,
} from "@/lib/api/billing";
import {
  getSubscriptionPlanCode,
  getSubscriptionPlanFeatureKeys,
  type SubscriptionPlanCode,
  type SubscriptionPlanFeatureKey,
} from "@/lib/marketing/plan-features";
import type { AppLocale } from "@/i18n/config";
import {
  sectionContainer,
  sectionHeading,
  sectionLead,
  sectionMotion,
  toDisplayAmount,
  toDisplayPoints,
} from "@/components/marketing-site/marketing-shared";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function MarketingPricingPage() {
  const params = useParams();
  const locale = (params?.locale as AppLocale) ?? "zh-CN";
  const t = useTranslations("marketing");
  const tPlanFeatures = useTranslations("billing.dialog.features");
  const reduceMotion = useReducedMotion();
  const sm = sectionMotion(Boolean(reduceMotion));
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const purchaseEntryHref = `/${locale}/creation-center/new?__openPurchase=1`;

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ["billing", "subscription-plans", "marketing"],
    queryFn: getBillingSubscriptionPlans,
    staleTime: 60_000,
    retry: false,
  });

  const plans = useMemo(() => {
    const list = (plansData?.plans ?? [])
      .filter((p) => p.is_active)
      .sort((a, b) => a.monthly_price_amount - b.monthly_price_amount);
    if (list.length >= 3) return list.slice(0, 3);
    return list;
  }, [plansData?.plans]);

  const annualDiscountPercent = useMemo(() => {
    const first = plansData?.plans?.find((plan) => plan.annual_discount_rate > 0);
    if (!first) return 0;
    return Math.round((1 - first.annual_discount_rate) * 100);
  }, [plansData?.plans]);

  const staticTiers = useMemo(
    () =>
      [
        { code: "LITE", displayName: t("planLiteName") },
        { code: "PRO", displayName: t("planProName") },
        { code: "MAX", displayName: t("planMaxName") },
      ] as const,
    [t],
  );

  const displayPlans: BillingSubscriptionPlan[] = useMemo(() => {
    if (plans.length >= 3) return plans;
    return staticTiers.map((s) => ({
      code: s.code,
      display_name: s.displayName,
      monthly_price_amount: 0,
      annual_price_amount: 0,
      monthly_points: 0,
      annual_discount_rate: 0,
      currency: "CNY",
      is_active: true,
      created_at: "",
      updated_at: "",
    })) as BillingSubscriptionPlan[];
  }, [plans, staticTiers]);

  const getPlanFeatureLabel = (
    planCode: SubscriptionPlanCode,
    featureKey: SubscriptionPlanFeatureKey,
  ) => {
    switch (planCode) {
      case "LITE":
        return tPlanFeatures(`LITE.${featureKey}`);
      case "MAX":
        return tPlanFeatures(`MAX.${featureKey}`);
      default:
        return tPlanFeatures(`PRO.${featureKey}`);
    }
  };

  return (
    <section className="border-b border-slate-200/50 py-16 dark:border-zinc-800/80 sm:py-20" aria-labelledby="pricing-page-heading">
      <div className={sectionContainer}>
        <motion.div {...sm} className="mx-auto max-w-3xl text-center">
          <h1 id="pricing-page-heading" className={sectionHeading}>
            {t("pricingTitle")}
          </h1>
          <p className={cn(sectionLead, "mx-auto md:max-w-none md:whitespace-nowrap")}>{t("pricingPageLead")}</p>
        </motion.div>

        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-200/90 bg-white/95 p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
            <button
              type="button"
              onClick={() => setCycle("MONTHLY")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                cycle === "MONTHLY"
                  ? "bg-blue-600 text-white shadow-sm dark:bg-cyan-500"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {t("pricingMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setCycle("ANNUALLY")}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                cycle === "ANNUALLY"
                  ? "bg-blue-600 text-white shadow-sm dark:bg-cyan-500"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              {t("pricingYearly")}
              {annualDiscountPercent > 0 ? (
                <span className="ml-1 text-xs opacity-90">
                  · {t("pricingSave", { percent: annualDiscountPercent })}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-3">
          {displayPlans.map((plan, index) => {
            const amountRaw =
              cycle === "MONTHLY" ? plan.monthly_price_amount : plan.annual_price_amount;
            const hasPrice = plans.length >= 3 && amountRaw > 0 && !plansLoading;
            const isMiddle = index === 1;
            const normalizedPlanCode = getSubscriptionPlanCode(plan.code);
            const featureKeys = getSubscriptionPlanFeatureKeys(plan.code);

            return (
              <motion.article
                key={plan.code}
                {...sm}
                transition={
                  sm.transition ? { ...sm.transition, delay: reduceMotion ? 0 : index * 0.08 } : undefined
                }
                className={`relative flex min-h-[300px] flex-col rounded-2xl border p-6 sm:min-h-[320px] ${
                  isMiddle
                    ? "border-blue-300/80 bg-gradient-to-b from-[#eef6ff] to-white shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/10 dark:border-cyan-500/35 dark:from-cyan-950/35 dark:to-zinc-900/85 dark:ring-cyan-500/15 lg:scale-[1.02]"
                    : "border-slate-200/90 bg-white/95 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/45"
                }`}
              >
                {isMiddle ? (
                  <div className="absolute right-4 top-4 rounded-full bg-blue-500/12 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-cyan-400/15 dark:text-cyan-200">
                    {t("planRecommended")}
                  </div>
                ) : null}
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.display_name}</h2>
                <div className="mt-3 text-3xl font-bold text-slate-900 tabular-nums dark:text-white">
                  {hasPrice ? (
                    <>
                      ¥{toDisplayAmount(amountRaw)}
                      <span className="ml-1 text-sm font-normal text-slate-500 dark:text-zinc-400">
                        /
                        {cycle === "MONTHLY"
                          ? locale === "en"
                            ? "mo"
                            : "月"
                          : locale === "en"
                            ? "yr"
                            : "年"}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-medium text-slate-500 dark:text-zinc-500">
                      {locale === "en" ? "See app for pricing" : "价格以应用内为准"}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">
                  {plan.monthly_points > 0
                    ? t("pricingPointsMonth", {
                        points: toDisplayPoints(plan.monthly_points, locale),
                      })
                    : locale === "en"
                      ? "Monthly credits shown in app"
                      : "月度积分请见应用内"}
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {featureKeys.map((featureKey) => (
                    <li
                      key={`${normalizedPlanCode}-${featureKey}`}
                      className="flex gap-2 text-sm text-slate-600 dark:text-zinc-400"
                    >
                      <CheckIcon
                        className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-cyan-400"
                        aria-hidden
                      />
                      <span>{getPlanFeatureLabel(normalizedPlanCode, featureKey)}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={purchaseEntryHref}
                  className={cn(
                    buttonVariants({
                      variant: isMiddle ? "marketingPrimary" : "marketingTertiary",
                    }),
                    "mt-6 h-11 w-full rounded-xl",
                  )}
                >
                  {t("pricingCta")}
                </Link>
              </motion.article>
            );
          })}
        </div>
        <p className="mt-10 text-center text-xs leading-relaxed text-slate-500 dark:text-zinc-500">
          {t("pricingFootnote")}
        </p>
      </div>
    </section>
  );
}
