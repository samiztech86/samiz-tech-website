export type BillingPlanId =
  | "starter"
  | "pro"
  | "business";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  amount: number;
  interval: "monthly";
  paymentPlanId?: string;
};

export const BILLING_PLANS: Record<
  BillingPlanId,
  BillingPlan
> = {
  starter: {
    id: "starter",
    name: "Samiz Energy Tools Starter",
    amount: 8500,
    interval: "monthly",
    paymentPlanId: "PLN_0d4mnmqdem010xm",
  },

  pro: {
    id: "pro",
    name: "Samiz Energy Tools Pro",
    amount: 15000,
    interval: "monthly",
    paymentPlanId: "PLN_jb6oo7vyq0nxq2a",
  },

  business: {
    id: "business",
    name: "Samiz Energy Tools Business",
    amount: 45000,
    interval: "monthly",
    paymentPlanId: "PLN_gbj8dplb4hotwaw",
  },
};

export function getBillingPlan(
  planId: string,
): BillingPlan | null {
  if (
    planId !== "starter" &&
    planId !== "pro" &&
    planId !== "business"
  ) {
    return null;
  }

  return BILLING_PLANS[planId];
}
