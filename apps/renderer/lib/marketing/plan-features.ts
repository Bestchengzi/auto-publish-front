export const SUBSCRIPTION_PLAN_FEATURE_KEYS = {
  LITE: ["f1", "f2", "f3", "f4", "f5", "f6"],
  PRO: ["f1", "f2", "f3", "f4", "f5", "f6"],
  MAX: ["f1", "f2", "f3", "f4", "f5", "f6"],
} as const;

export type SubscriptionPlanCode = keyof typeof SUBSCRIPTION_PLAN_FEATURE_KEYS;
export type SubscriptionPlanFeatureKey =
  (typeof SUBSCRIPTION_PLAN_FEATURE_KEYS)[SubscriptionPlanCode][number];

export function getSubscriptionPlanCode(planCode: string): SubscriptionPlanCode {
  const normalized = planCode.toUpperCase();

  if (normalized === "LITE" || normalized === "PRO" || normalized === "MAX") {
    return normalized;
  }

  return "PRO";
}

export function getSubscriptionPlanFeatureKeys(
  planCode: string,
): readonly SubscriptionPlanFeatureKey[] {
  return SUBSCRIPTION_PLAN_FEATURE_KEYS[getSubscriptionPlanCode(planCode)];
}
