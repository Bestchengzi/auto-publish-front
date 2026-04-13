"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type BillingAccount,
  type BillingCycle,
  type BillingSubscriptionPlan,
  createPlanOrder,
  getBillingSubscriptionPlans,
  getPlanOrderPayStatus,
} from "@/lib/api/billing";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/request";

function toDisplayAmount(raw: number): string {
  return (raw / 100).toFixed(2).replace(/\.00$/, "");
}

function toDisplayPoints(raw: number, locale: string): string {
  return (raw / 100).toLocaleString(locale === "en" ? "en-US" : "zh-CN");
}

function openPaymentPage(codeUrl: string): boolean {
  if (typeof window === "undefined") return false;

  if (codeUrl.includes("<form")) {
    const container = document.createElement("div");
    container.innerHTML = codeUrl;
    const form = container.querySelector("form");
    if (!form) return false;
    document.body.appendChild(container);
    form.submit();
    return true;
  }

  if (/^https?:\/\//i.test(codeUrl)) {
    window.open(codeUrl, "_blank", "noopener,noreferrer");
    return true;
  }

  return false;
}

function isOrderPaid(status: string, paidAt: string | null, appliedAt: string | null): boolean {
  const normalized = status.trim().toUpperCase();
  if (paidAt || appliedAt) return true;
  return normalized.includes("PAID") || normalized.includes("SUCCESS") || normalized.includes("APPLIED");
}

function isOrderFailed(status: string): boolean {
  const normalized = status.trim().toUpperCase();
  return (
    normalized.includes("FAIL") ||
    normalized.includes("CANCEL") ||
    normalized.includes("CLOSED") ||
    normalized.includes("TIMEOUT") ||
    normalized.includes("EXPIRED")
  );
}

type SubscriptionPlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: BillingAccount | null;
};

export function SubscriptionPlanDialog({
  open,
  onOpenChange,
  account,
}: SubscriptionPlanDialogProps) {
  const locale = useLocale();
  const t = useTranslations("billing.dialog");
  const queryClient = useQueryClient();
  const [cycle, setCycle] = useState<BillingCycle>("MONTHLY");
  const [purchasingCode, setPurchasingCode] = useState<string | null>(null);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["billing", "subscription-plans"],
    queryFn: getBillingSubscriptionPlans,
    enabled: open,
    staleTime: 60_000,
  });

  const plans = useMemo(
    () =>
      (data?.plans ?? [])
        .filter((plan) => plan.is_active)
        .sort((a, b) => a.monthly_price_amount - b.monthly_price_amount),
    [data?.plans],
  );

  const currentPlanCode = account?.subscription?.plan_code ?? null;
  /** 套餐等级与列表排序一致：月价升序，索引越大等级越高 */
  const currentPlanIndex = useMemo(() => {
    if (!currentPlanCode) return -1;
    const idx = plans.findIndex((p) => p.code === currentPlanCode);
    return idx;
  }, [plans, currentPlanCode]);

  const annualDiscountPercent = useMemo(() => {
    const first = plans.find((plan) => plan.annual_discount_rate > 0);
    if (!first) return 0;
    return Math.round((1 - first.annual_discount_rate) * 100);
  }, [plans]);

  useEffect(() => {
    return () => {
      if (!pollingTimerRef.current) return;
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    };
  }, []);

  const stopPolling = () => {
    if (!pollingTimerRef.current) return;
    clearInterval(pollingTimerRef.current);
    pollingTimerRef.current = null;
  };

  const startOrderPolling = (orderId: string) => {
    stopPolling();
    let attempts = 0;
    pollingTimerRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const statusRes = await getPlanOrderPayStatus(orderId);
        const order = statusRes.order;
        if (isOrderPaid(order.status, order.paid_at, order.applied_at)) {
          stopPolling();
          setPurchasingCode(null);
          await queryClient.invalidateQueries({ queryKey: ["billing", "account"] });
          await queryClient.invalidateQueries({ queryKey: ["billing", "subscription-plans"] });
          toast.success(t("toast.paySuccess"));
          onOpenChange(false);
          return;
        }
        if (isOrderFailed(order.status)) {
          stopPolling();
          setPurchasingCode(null);
          toast.error(t("toast.payIncomplete"));
          return;
        }
        if (attempts >= 90) {
          stopPolling();
          setPurchasingCode(null);
          toast.warning(t("toast.payTimeout"));
        }
      } catch {
        if (attempts >= 90) {
          stopPolling();
          setPurchasingCode(null);
        }
      }
    }, 2000);
  };

  const handlePurchase = async (plan: BillingSubscriptionPlan) => {
    setPurchasingCode(plan.code);
    try {
      const res = await createPlanOrder({
        plan_code: plan.code,
        billing_cycle: cycle === "MONTHLY" ? "monthly" : "annual",
        order_type: "new",
        pay_platform: "ALI",
      });

      const codeUrl = res.order.code_url ?? "";
      const opened = codeUrl ? openPaymentPage(codeUrl) : false;
      if (!opened) {
        toast.error(t("toast.openPayFailed"));
        setPurchasingCode(null);
        return;
      }
      startOrderPolling(res.order.id);
      toast.info(t("toast.payPageOpened"));
    } catch (error) {
      setPurchasingCode(null);
      toast.error(getApiErrorMessage(error, t("toast.createOrderFailed")));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl max-h-[90vh] overflow-hidden px-6 pt-7 pb-5">
        <DialogHeader className="items-center text-center pb-1">
          <DialogTitle className="text-[34px] leading-none font-medium tracking-tight">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-0.5 flex justify-center">
          <div className="inline-flex items-center rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setCycle("MONTHLY")}
              className={`h-8 cursor-pointer rounded-md px-4 text-[13px] ${
                cycle === "MONTHLY"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("monthly")}
            </button>
            <button
              type="button"
              onClick={() => setCycle("ANNUALLY")}
              className={`h-8 cursor-pointer rounded-md px-4 text-[13px] ${
                cycle === "ANNUALLY"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("yearly")}
              {annualDiscountPercent > 0
                ? t("savePercent", { percent: annualDiscountPercent })
                : ""}
            </button>
          </div>
        </div>

        <div className="mt-3 grid max-h-[65vh] grid-cols-1 gap-3.5 overflow-y-auto pb-1 md:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : (
            plans.map((plan, index) => {
              const amountRaw =
                cycle === "MONTHLY" ? plan.monthly_price_amount : plan.annual_price_amount;
              const isCurrent = currentPlanCode === plan.code;
              const isMiddleCard = index === 1;
              const isDowngrade =
                currentPlanIndex >= 0 && index < currentPlanIndex;
              const isPurchasing = purchasingCode === plan.code;

              return (
                <div
                  key={plan.code}
                  className={`relative flex flex-col rounded-xl border p-[18px] ${
                    isCurrent
                      ? "min-h-[330px] border-emerald-500/45 bg-emerald-500/[0.08] shadow-[0_0_0_1px_rgba(16,185,129,0.22)] dark:border-emerald-400/35 dark:bg-emerald-950/35"
                      : isMiddleCard
                        ? "min-h-[380px] border-primary/80 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                        : "min-h-[330px] border-border"
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute top-3 right-3 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400">
                      {t("currentPlan")}
                    </div>
                  ) : isMiddleCard ? (
                    <div className="absolute top-3 right-3 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                      {t("recommended")}
                    </div>
                  ) : null}
                  <div className="text-[22px] leading-tight font-semibold">{plan.display_name}</div>
                  <div className="mt-2 text-3xl font-bold">
                    ¥{toDisplayAmount(amountRaw)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      /{cycle === "MONTHLY" ? t("monthUnit") : t("yearUnit")}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    {t("pointsPerMonth", {
                      points: toDisplayPoints(plan.monthly_points, locale),
                    })}
                  </div>
                  <div className="mt-5 space-y-2">
                    {Array.from({ length: 6 }, (_, i) =>
                      t(`features.${plan.code.toUpperCase()}.f${i + 1}`),
                    ).map((feature) => (
                      <div
                        key={`${plan.code}-${feature}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <span className="inline-block size-1.5 rounded-full bg-muted-foreground/70" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant={isCurrent ? "outline" : isMiddleCard ? "default" : "outline"}
                    className={
                      isCurrent
                        ? "mt-auto h-11 w-full border-emerald-600 text-[17px] text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300"
                        : isMiddleCard
                          ? "mt-auto h-11 w-full text-[17px]"
                          : "mt-auto h-11 w-full border-primary text-[17px] text-primary hover:bg-primary/5 hover:text-primary"
                    }
                    disabled={Boolean(purchasingCode) || isDowngrade}
                    onClick={() => void handlePurchase(plan)}
                  >
                    {isDowngrade
                      ? t("button.noDowngrade")
                      : isCurrent
                        ? isPurchasing
                          ? t("button.redirecting")
                          : t("button.renew")
                        : isPurchasing
                          ? t("button.redirecting")
                          : t("button.buyNow")}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

