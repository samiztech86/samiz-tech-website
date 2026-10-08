import { NextRequest, NextResponse } from "next/server";

import { getBillingPlan } from "@/lib/billing";
import { supabaseServer } from "@/lib/supabase/server";
import {
  createSessionToken,
  ENERGY_SESSION_COOKIE,
  ENERGY_SESSION_TTL_SECONDS,
  hashSessionToken,
} from "@/lib/subscription/session";

async function saveSubscriptionByEmail(
  email: string,
  subscription: Record<string, unknown>,
) {
  const { data: existing, error: lookupError } =
    await supabaseServer
      .from("energy_tool_subscriptions")
      .select("id")
      .eq("customer_email", email)
      .maybeSingle();

  if (lookupError) {
    return {
      data: null,
      error: lookupError,
    };
  }

  if (existing?.id) {
    const { data, error } =
      await supabaseServer
        .from("energy_tool_subscriptions")
        .update(subscription)
        .eq("id", existing.id)
        .select()
        .single();

    return {
      data,
      error,
    };
  }

  const { data, error } =
    await supabaseServer
      .from("energy_tool_subscriptions")
      .insert({
        customer_email: email,
        ...subscription,
      })
      .select()
      .single();

  return {
    data,
    error,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const reference =
      typeof body.reference === "string"
        ? body.reference.trim()
        : "";

    if (!reference) {
      return NextResponse.json(
        {
          error: "Payment reference is required.",
        },
        { status: 400 },
      );
    }

    const secretKey =
      process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "PAYSTACK_SECRET_KEY is not configured.",
      );

      return NextResponse.json(
        {
          error: "Payment service is not configured.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error(
        "Paystack verification error:",
        data,
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            data.message ||
            "Unable to verify Paystack transaction.",
        },
        { status: 502 },
      );
    }

    const transaction = data?.data;

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error: "Paystack returned no transaction data.",
        },
        { status: 502 },
      );
    }

    if (transaction.status !== "success") {
      return NextResponse.json({
        success: true,
        verified: false,
        status: transaction.status,
        reference,
      });
    }

    const metadata = transaction.metadata || {};

    const metadataPlan =
      typeof metadata.plan === "string"
        ? metadata.plan
        : "";

    const plan = getBillingPlan(metadataPlan);

    if (!plan) {
      console.error(
        "Invalid Samiz plan in Paystack metadata:",
        metadataPlan,
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "The verified transaction does not contain a valid Samiz Energy Tools plan.",
        },
        { status: 400 },
      );
    }

    const expectedAmount = plan.amount * 100;

    if (Number(transaction.amount) !== expectedAmount) {
      console.error(
        "Paystack amount mismatch:",
        {
          expectedAmount,
          receivedAmount: transaction.amount,
          reference,
        },
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "The payment amount does not match the selected plan.",
        },
        { status: 400 },
      );
    }

    if (
      transaction.currency &&
      transaction.currency !== "NGN"
    ) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "The payment currency is not supported.",
        },
        { status: 400 },
      );
    }

    const customerEmail =
      transaction.customer?.email ||
      metadata.customer_email ||
      "";

    const customerName =
      metadata.customer_name ||
      transaction.customer?.first_name ||
      "";

    const customerPhone =
      metadata.customer_phone ||
      "";

    if (!customerEmail) {
      console.error(
        "Verified Paystack transaction has no customer email:",
        reference,
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "The verified payment does not contain a customer email.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const subscriptionData = {
      customer_name: customerName,
      customer_phone: customerPhone || null,
      plan: plan.id,
      status: "active",
      last_payment_reference: reference,
      last_payment_at: now.toISOString(),
      subscription_started_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const {
      data: subscription,
      error: subscriptionError,
    } = await saveSubscriptionByEmail(
      customerEmail.toLowerCase(),
      subscriptionData,
    );

    if (subscriptionError || !subscription?.id) {
      console.error(
        "Failed to save verified Samiz subscription:",
        subscriptionError,
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Payment was verified, but we could not activate the subscription record.",
        },
        { status: 500 },
      );
    }

    const sessionToken = createSessionToken();
    const sessionTokenHash =
      hashSessionToken(sessionToken);

    const sessionExpiresAt = new Date(
      Date.now() +
        ENERGY_SESSION_TTL_SECONDS * 1000,
    );

    const { error: sessionError } =
      await supabaseServer
        .from("energy_tool_sessions")
        .insert({
          subscription_id: subscription.id,
          session_token_hash: sessionTokenHash,
          expires_at: sessionExpiresAt.toISOString(),
        });

    if (sessionError) {
      console.error(
        "Failed to create Samiz Energy Tools session:",
        sessionError,
      );

      return NextResponse.json(
        {
          success: false,
          verified: false,
          error:
            "Payment was verified, but we could not create your secure access session.",
        },
        { status: 500 },
      );
    }

    const result = NextResponse.json({
      success: true,
      verified: true,
      reference,
      status: transaction.status,
      plan: plan.id,
      planName: plan.name,
      amount: plan.amount,
      currency: transaction.currency,
      customer: {
        email: customerEmail,
        name: customerName,
        phone: customerPhone,
      },
    });

    result.cookies.set({
      name: ENERGY_SESSION_COOKIE,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ENERGY_SESSION_TTL_SECONDS,
    });

    return result;
  } catch (error) {
    console.error(
      "Paystack verification failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        verified: false,
        error: "Unable to verify payment.",
      },
      { status: 500 },
    );
  }
}
