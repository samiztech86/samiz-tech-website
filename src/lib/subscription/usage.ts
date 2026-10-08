"use client";

import {
  checkToolAccess,
  type AccessResult,
} from "./access";

import type { SubscriptionState } from "./state";
import type { ToolId } from "./plans";

export type ConsumeResult =
  | {
      allowed: true;
      result: AccessResult;
      state: SubscriptionState;
    }
  | {
      allowed: false;
      result: AccessResult;
      state: SubscriptionState;
    };

export function consumeTool(
  state: SubscriptionState,
  tool: ToolId,
): ConsumeResult {
  const result = checkToolAccess({
    plan: state.plan,
    coins: state.coins,
    tool,
    subscriptionExpiresAt: state.subscriptionExpiresAt,
  });

  if (!result.allowed) {
    return {
      allowed: false,
      result,
      state,
    };
  }

  if (result.reason === "subscription") {
    return {
      allowed: true,
      result,
      state,
    };
  }

  return {
    allowed: true,
    result,
    state: {
      ...state,
      coins: result.remainingCoins,
    },
  };
}

