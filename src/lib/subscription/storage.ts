"use client";

import {
  DEFAULT_SUBSCRIPTION_STATE,
  SUBSCRIPTION_STATE_VERSION,
  type SubscriptionState,
} from "./state";

import { FREE_COINS } from "./plans";

const STORAGE_KEY = "samiz_energy_tools_subscription";

export function loadSubscriptionState(): SubscriptionState {
  if (typeof window === "undefined") {
    return DEFAULT_SUBSCRIPTION_STATE;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return DEFAULT_SUBSCRIPTION_STATE;
    }

    const parsed = JSON.parse(stored) as Partial<SubscriptionState>;

    if (
      parsed.plan === "starter" ||
      parsed.plan === "pro" ||
      parsed.plan === "business"
    ) {
      return {
        ...DEFAULT_SUBSCRIPTION_STATE,
        ...parsed,
        version: SUBSCRIPTION_STATE_VERSION,
        coins: Infinity,
      };
    }

    if (
      parsed.plan === "free" &&
      parsed.version !== SUBSCRIPTION_STATE_VERSION
    ) {
      const migratedState: SubscriptionState = {
        ...DEFAULT_SUBSCRIPTION_STATE,
        customerName: parsed.customerName,
        customerEmail: parsed.customerEmail,
        version: SUBSCRIPTION_STATE_VERSION,
      };

      saveSubscriptionState(migratedState);

      return migratedState;
    }

    return {
      ...DEFAULT_SUBSCRIPTION_STATE,
      ...parsed,
      version: SUBSCRIPTION_STATE_VERSION,
      coins:
        parsed.plan === "free"
          ? Math.max(
              0,
              typeof parsed.coins === "number"
                ? parsed.coins
                : FREE_COINS,
            )
          : Infinity,
    };
  } catch {
    return DEFAULT_SUBSCRIPTION_STATE;
  }
}

export function saveSubscriptionState(
  state: SubscriptionState,
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...state,
      version: SUBSCRIPTION_STATE_VERSION,
    }),
  );
}

export function clearSubscriptionState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
