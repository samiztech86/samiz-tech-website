"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  consumeTool,
  type ConsumeResult,
} from "./usage";

import {
  loadSubscriptionState,
  saveSubscriptionState,
} from "./storage";

import {
  DEFAULT_SUBSCRIPTION_STATE,
  type SubscriptionState,
} from "./state";

import type {
  SubscriptionPlan,
  SubscriptionStatus,
  ToolId,
} from "./plans";

type SubscriptionContextValue = {
  state: SubscriptionState;
  hydrated: boolean;
  consume: (tool: ToolId) => ConsumeResult;
  setState: (state: SubscriptionState) => void;
  setCustomerIdentity: (
    customerName: string,
    customerEmail: string,
  ) => void;
};

const SubscriptionContext =
  createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [state, setStateInternal] =
    useState<SubscriptionState>(
      DEFAULT_SUBSCRIPTION_STATE,
    );

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const synchronizeSubscription = async () => {
      const cachedState =
        loadSubscriptionState();

      if (cancelled) {
        return;
      }

      try {
        const response = await fetch(
          "/api/subscriptions/current",
          {
            method: "GET",
            cache: "no-store",
            credentials: "same-origin",
          },
        );

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (
          response.ok &&
          data.success &&
          data.subscribed &&
          data.subscription
        ) {
          const subscription =
            data.subscription;

          const plan =
            subscription.plan as SubscriptionPlan;

          const status =
            subscription.status as SubscriptionStatus;

          const serverState: SubscriptionState = {
            ...DEFAULT_SUBSCRIPTION_STATE,
            plan,
            status,
            coins: Infinity,
            customerName:
              subscription.customer_name ||
              cachedState.customerName,
            customerEmail:
              subscription.customer_email ||
              cachedState.customerEmail,
            subscriptionStartedAt:
              subscription.subscription_started_at ||
              undefined,
            subscriptionExpiresAt:
              subscription.subscription_next_payment_at ||
              undefined,
          };

          setStateInternal(serverState);
          saveSubscriptionState(serverState);
        } else {
          const signedOutState: SubscriptionState = {
            ...DEFAULT_SUBSCRIPTION_STATE,
            customerName:
              cachedState.customerName,
            customerEmail:
              cachedState.customerEmail,
          };

          setStateInternal(signedOutState);
          saveSubscriptionState(signedOutState);
        }
      } catch (error) {
        console.error(
          "Failed to synchronize Energy Tools subscription:",
          error,
        );

        if (cancelled) {
          return;
        }

        const signedOutState: SubscriptionState = {
          ...DEFAULT_SUBSCRIPTION_STATE,
          customerName:
            cachedState.customerName,
          customerEmail:
            cachedState.customerEmail,
        };

        setStateInternal(signedOutState);
        saveSubscriptionState(signedOutState);
      } finally {
        if (!cancelled) {
          setHydrated(true);
        }
      }
    };

    void synchronizeSubscription();

    return () => {
      cancelled = true;
    };
  }, []);

  const setState = useCallback(
    (nextState: SubscriptionState) => {
      setStateInternal(nextState);
      saveSubscriptionState(nextState);
    },
    [],
  );

  const setCustomerIdentity = useCallback(
    (
      customerName: string,
      customerEmail: string,
    ) => {
      const nextState: SubscriptionState = {
        ...state,
        customerName: customerName.trim(),
        customerEmail: customerEmail
          .trim()
          .toLowerCase(),
      };

      setState(nextState);
    },
    [state, setState],
  );

  const consume = useCallback(
    (tool: ToolId): ConsumeResult => {
      const result = consumeTool(state, tool);

      if (
        result.allowed &&
        result.result.reason === "free-coin"
      ) {
        setState(result.state);
      }

      return result;
    },
    [state, setState],
  );

  const value = useMemo(
    () => ({
      state,
      hydrated,
      consume,
      setState,
      setCustomerIdentity,
    }),
    [
      state,
      hydrated,
      consume,
      setState,
      setCustomerIdentity,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error(
      "useSubscription must be used inside SubscriptionProvider",
    );
  }

  return context;
}

