import { cookies } from "next/headers";

import { supabaseServer } from "@/lib/supabase/server";
import {
  ENERGY_SESSION_COOKIE,
  hashSessionToken,
} from "@/lib/subscription/session";

export type ActiveEnergySubscription = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  plan: "starter" | "pro" | "business";
  status:
    | "active"
    | "inactive"
    | "past_due"
    | "cancelled"
    | "expired";
  subscription_started_at: string | null;
  subscription_next_payment_at: string | null;
  subscription_cancelled_at: string | null;
  last_payment_reference: string | null;
  last_payment_at: string | null;
};

export async function getActiveEnergySubscription(): Promise<
  ActiveEnergySubscription | null
> {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get(ENERGY_SESSION_COOKIE)?.value;

  if (!sessionToken) {
    return null;
  }

  const sessionTokenHash =
    hashSessionToken(sessionToken);

  const { data: session, error: sessionError } =
    await supabaseServer
      .from("energy_tool_sessions")
      .select(
        "id, subscription_id, expires_at",
      )
      .eq(
        "session_token_hash",
        sessionTokenHash,
      )
      .maybeSingle();

  if (sessionError) {
    console.error(
      "Failed to verify Energy Tools session:",
      sessionError,
    );

    return null;
  }

  if (!session) {
    return null;
  }

  if (
    new Date(session.expires_at).getTime() <=
    Date.now()
  ) {
    return null;
  }

  const { data: subscription, error } =
    await supabaseServer
      .from("energy_tool_subscriptions")
      .select(
        [
          "id",
          "customer_name",
          "customer_email",
          "customer_phone",
          "plan",
          "status",
          "subscription_started_at",
          "subscription_next_payment_at",
          "subscription_cancelled_at",
          "last_payment_reference",
          "last_payment_at",
        ].join(", "),
      )
      .eq("id", session.subscription_id)
      .maybeSingle();

  if (error) {
    console.error(
      "Failed to load Energy Tools subscription:",
      error,
    );

    return null;
  }

  if (!subscription) {
    return null;
  }

  const verifiedSubscription =
    subscription as unknown as ActiveEnergySubscription;

  if (
    verifiedSubscription.status !== "active" ||
    (verifiedSubscription.subscription_next_payment_at &&
      new Date(
        verifiedSubscription.subscription_next_payment_at,
      ).getTime() <= Date.now())
  ) {
    return null;
  }

  if (
    verifiedSubscription.plan !== "starter" &&
    verifiedSubscription.plan !== "pro" &&
    verifiedSubscription.plan !== "business"
  ) {
    return null;
  }

  return verifiedSubscription;
}