import { NextRequest, NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";
import {
  ENERGY_SESSION_COOKIE,
  hashSessionToken,
} from "@/lib/subscription/session";

type SubscriptionRecord = {
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

export async function GET(request: NextRequest) {
  try {
    const sessionToken =
      request.cookies.get(ENERGY_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: true,
          subscribed: false,
          subscription: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
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
        "Failed to load Samiz Energy Tools session:",
        sessionError,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify subscription session.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (!session) {
      return NextResponse.json(
        {
          success: true,
          subscribed: false,
          subscription: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const sessionExpired =
      new Date(session.expires_at).getTime() <=
      Date.now();

    if (sessionExpired) {
      return NextResponse.json(
        {
          success: true,
          subscribed: false,
          subscription: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const { data, error } =
      await supabaseServer
        .from("energy_tool_subscriptions")
        .select(
          [
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
        "Failed to load Samiz subscription:",
        error,
      );

      return NextResponse.json(
        {
          success: false,
          error: "Unable to load subscription.",
        },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: true,
          subscribed: false,
          subscription: null,
        },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const subscription =
      data as unknown as SubscriptionRecord;

    const isActive =
      subscription.status === "active" &&
      (
        !subscription.subscription_next_payment_at ||
        new Date(
          subscription.subscription_next_payment_at,
        ).getTime() > Date.now()
      );

    return NextResponse.json(
      {
        success: true,
        subscribed: isActive,
        subscription,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Subscription lookup failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Subscription lookup failed.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
