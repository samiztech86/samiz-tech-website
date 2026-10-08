import {
  FREE_COINS,
  isPaidPlan,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from "./plans";

export const SUBSCRIPTION_STATE_VERSION = 2;

export type SubscriptionState = {
  version: number;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  coins: number;
  customerEmail?: string;
  customerName?: string;
  subscriptionStartedAt?: string;
  subscriptionExpiresAt?: string;
};

export const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
  version: SUBSCRIPTION_STATE_VERSION,
  plan: "free",
  status: "active",
  coins: FREE_COINS,
};

export function hasActiveSubscription(
  state: SubscriptionState,
): boolean {
  return (
    isPaidPlan(state.plan) &&
    state.status === "active"
  );
}
