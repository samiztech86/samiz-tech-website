import {
  isPaidPlan,
  type SubscriptionPlan,
  type ToolId,
} from "./plans";

export type AccessResult =
  | {
      allowed: true;
      reason: "subscription";
      remainingCoins: number;
    }
  | {
      allowed: true;
      reason: "free-coin";
      remainingCoins: number;
    }
  | {
      allowed: false;
      reason: "no-coins";
      remainingCoins: 0;
    };

export function checkToolAccess({
  plan,
  coins,
  tool,
  subscriptionExpiresAt,
}: {
  plan: SubscriptionPlan;
  coins: number;
  tool: ToolId;
  subscriptionExpiresAt?: string;
}): AccessResult {
  if (isPaidPlan(plan)) {
    const hasExpiry =
      typeof subscriptionExpiresAt === "string" &&
      subscriptionExpiresAt.trim().length > 0;

    const isExpired =
      hasExpiry &&
      new Date(subscriptionExpiresAt).getTime() <= Date.now();

    if (!isExpired) {
      return {
        allowed: true,
        reason: "subscription",
        remainingCoins: Infinity,
      };
    }

    return {
      allowed: false,
      reason: "no-coins",
      remainingCoins: 0,
    };
  }

  return {
    allowed: false,
    reason: "no-coins",
    remainingCoins: 0,
  };
}


