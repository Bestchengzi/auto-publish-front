/** 与「购买套餐」弹窗一致，供官网等场景复用 */
export const SUBSCRIPTION_PLAN_FEATURES: Record<string, string[]> = {
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

export function getSubscriptionPlanFeatures(planCode: string): string[] {
  const normalized = planCode.toUpperCase();
  return SUBSCRIPTION_PLAN_FEATURES[normalized] ?? SUBSCRIPTION_PLAN_FEATURES.PRO;
}
