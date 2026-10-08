export type SubscriptionPlan =
  | "free"
  | "starter"
  | "pro"
  | "business";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "expired"
  | "cancelled";

export type ToolId =
  | "calculator"
  | "consumption"
  | "solar"
  | "inverter"
  | "generator"
  | "load-analysis"
  | "reports"
  | "cable-sizing";

export const FREE_COINS = 1;

export const PLAN_CONFIG = {
  free: {
    name: "Free",
    price: 0,
    interval: "none",
    coins: FREE_COINS,
  },

  starter: {
    name: "Samiz Energy Tools Starter",
    price: 8500,
    interval: "monthly",
    coins: Infinity,
  },

  pro: {
    name: "Samiz Energy Tools Pro",
    price: 15000,
    interval: "monthly",
    coins: Infinity,
  },

  business: {
    name: "Samiz Energy Tools Business",
    price: 45000,
    interval: "monthly",
    coins: Infinity,
  },
} as const;

export const TOOL_COSTS: Record<ToolId, number> = {
  calculator: 1,
  consumption: 1,
  solar: 1,
  inverter: 1,
  generator: 1,
  "load-analysis": 1,
  reports: 1,
  "cable-sizing": 1,
};

export function getToolCost(tool: ToolId): number {
  return TOOL_COSTS[tool];
}

export function isPaidPlan(plan: SubscriptionPlan): boolean {
  return (
    plan === "starter" ||
    plan === "pro" ||
    plan === "business"
  );
}