"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const PLAN_LEVEL: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  TEAM: 2,
};

const PLAN_FEATURES: Record<string, string[]> = {
  LITE: [
    "专属积分补给",
    "月度积分配额",
    "基础深度创作",
    "标准输出质量",
    "多任务并发支持",
    "定时任务执行",
  ],
  PRO: [
    "专属积分补给",
    "更高月度积分配额",
    "进阶深度创作",
    "更强任务稳定性",
    "多任务并发支持",
    "定时任务执行",
  ],
  MAX: [
    "专属积分补给",
    "超高月度积分配额",
    "高强度深度创作",
    "大批量任务处理",
    "多任务并发支持",
    "定时任务执行",
  ],
};

function toDisplayAmount(raw: number): string {
  return (raw / 100).toFixed(2).replace(/\.00$/, "");
}

function toDisplayPoints(raw: number): string {
  return (raw / 100).toLocaleString("zh-CN");
}

function getPlanFeatures(planCode: string): string[] {
  const normalized = planCode.toUpperCase();
  return PLAN_FEATURES[normalized] ?? PLAN_FEATURES.PRO;
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
          toast.success("支付成功，套餐已更新");
          onOpenChange(false);
          return;
        }
        if (isOrderFailed(order.status)) {
          stopPolling();
          setPurchasingCode(null);
          toast.error("支付未完成，请重试");
          return;
        }
        if (attempts >= 90) {
          stopPolling();
          setPurchasingCode(null);
          toast.warning("支付结果确认超时，可稍后刷新查看");
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
        toast.error("拉起支付失败，请稍后重试");
        setPurchasingCode(null);
        return;
      }
      startOrderPolling(res.order.id);
      toast.info("已打开支付页面，请完成支付");
    } catch (error) {
      setPurchasingCode(null);
      toast.error(getApiErrorMessage(error, "创建订单失败，请重试"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-5xl max-h-[90vh] overflow-hidden px-6 pt-7 pb-5">
        <DialogHeader className="items-center text-center pb-1">
          <DialogTitle className="text-[34px] leading-none font-medium tracking-tight">
            套餐选择
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
              月付
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
              年付{annualDiscountPercent > 0 ? ` · 节省 ${annualDiscountPercent}%` : ""}
            </button>
          </div>
        </div>

        <div className="mt-3 grid max-h-[65vh] grid-cols-1 gap-3.5 overflow-y-auto pb-1 md:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
              套餐加载中...
            </div>
          ) : (
            plans.map((plan, index) => {
              const amountRaw =
                cycle === "MONTHLY" ? plan.monthly_price_amount : plan.annual_price_amount;
              const isCurrent = currentPlanCode === plan.code;
              const isMiddleCard = index === 1;
              const isDowngrade = Boolean(
                currentPlanCode &&
                  PLAN_LEVEL[currentPlanCode] !== undefined &&
                  PLAN_LEVEL[plan.code] !== undefined &&
                  PLAN_LEVEL[plan.code] < PLAN_LEVEL[currentPlanCode],
              );
              const isPurchasing = purchasingCode === plan.code;

              return (
                <div
                  key={plan.code}
                  className={`relative flex min-h-[330px] flex-col rounded-xl border p-[18px] ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : isMiddleCard
                        ? "min-h-[380px] border-primary/80 bg-primary/5 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
                        : "border-border"
                  }`}
                >
                  {isMiddleCard && !isCurrent ? (
                    <div className="absolute top-3 right-3 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                      推荐
                    </div>
                  ) : null}
                  <div className="text-[22px] leading-tight font-semibold">{plan.display_name}</div>
                  <div className="mt-2 text-3xl font-bold">
                    ¥{toDisplayAmount(amountRaw)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      /{cycle === "MONTHLY" ? "月" : "年"}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    每月 {toDisplayPoints(plan.monthly_points)} 积分
                  </div>
                  <div className="mt-5 space-y-2">
                    {getPlanFeatures(plan.code).map((feature) => (
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
                    variant={isCurrent ? "secondary" : isMiddleCard ? "default" : "outline"}
                    className={
                      isMiddleCard
                        ? "mt-auto h-11 w-full text-[17px]"
                        : "mt-auto h-11 w-full border-primary text-[17px] text-primary hover:bg-primary/5 hover:text-primary"
                    }
                    disabled={Boolean(purchasingCode) || isCurrent || isDowngrade}
                    onClick={() => void handlePurchase(plan)}
                  >
                    {isCurrent
                      ? "当前套餐"
                      : isDowngrade
                        ? "已包含在更高套餐"
                        : isPurchasing
                          ? "跳转支付中..."
                          : "立即购买"}
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

