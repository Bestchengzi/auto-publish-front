import { apiUrl } from "@/lib/api/config";
import { request } from "@/lib/request";

export type BillingCycle = "MONTHLY" | "ANNUALLY";

export type BillingSubscriptionPlan = {
  code: string;
  display_name: string;
  monthly_price_amount: number;
  annual_price_amount: number;
  monthly_points: number;
  annual_discount_rate: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BillingSubscriptionPlansResponse = {
  plans: BillingSubscriptionPlan[];
};

export type BillingSubscriptionSummary = {
  status: string;
  billing_cycle: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  last_granted_month: string | null;
  plan_code: string | null;
  plan_display_name: string | null;
  pending_plan_code: string | null;
  pending_plan_display_name: string | null;
  pending_billing_cycle: string | null;
  pending_order_id: string | null;
};

export type BillingAccount = {
  owner_id: string;
  balance_points: number;
  recharge_balance_points: number;
  subscription_balance_points: number;
  subscription_points_month: string | null;
  total_recharged_points: number;
  total_consumed_points: number;
  subscription: BillingSubscriptionSummary | null;
  created_at: string;
  updated_at: string;
};

export type BillingAccountEnvelope = {
  account: BillingAccount;
};

export type PlanOrderCreateRequest = {
  plan_code: string;
  billing_cycle: "monthly" | "annual";
  order_type: "new" | "renew";
  pay_platform: "ALI" | "WECHAT";
};

export type SubscriptionOrderResponse = {
  id: string;
  owner_id: string;
  plan_id: number;
  order_type: string;
  billing_cycle: string;
  apply_mode: string;
  status: string;
  plan_code_snapshot: string;
  plan_display_name_snapshot: string;
  currency: string;
  monthly_price_amount_snapshot: number;
  monthly_points_snapshot: number;
  annual_discount_rate_snapshot: number;
  payable_amount: number;
  paid_at: string | null;
  applied_at: string | null;
  code_url: string | null;
  pay_platform: string | null;
  transaction_number: number | null;
  third_transaction_id: string | null;
  third_payer_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SubscriptionOrderEnvelope = {
  order: SubscriptionOrderResponse;
};

export async function getBillingSubscriptionPlans(): Promise<BillingSubscriptionPlansResponse> {
  return request<BillingSubscriptionPlansResponse>(apiUrl("/api/billing/subscription-plans"), {
    method: "GET",
  });
}

export async function getBillingAccount(): Promise<BillingAccountEnvelope> {
  return request<BillingAccountEnvelope>(apiUrl("/api/billing/account"), {
    method: "GET",
  });
}

export async function createPlanOrder(
  payload: PlanOrderCreateRequest,
): Promise<SubscriptionOrderEnvelope> {
  return request<SubscriptionOrderEnvelope>(apiUrl("/api/billing/subscription-orders"), {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPlanOrderPayStatus(orderId: string): Promise<SubscriptionOrderEnvelope> {
  return request<SubscriptionOrderEnvelope>(
    apiUrl(`/api/billing/subscription-orders/${encodeURIComponent(orderId)}`),
    { method: "GET" },
  );
}

