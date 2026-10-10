import { NextRequest, NextResponse } from "next/server";
import { getBillingPlan } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const planId =
      typeof body.plan === "string"
        ? body.plan
        : "";

    if (!name || !email || !phone || !planId) {
      return NextResponse.json(
        {
          error:
            "Name, email, phone and plan are required.",
        },
        { status: 400 },
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    const plan = getBillingPlan(planId);

    if (!plan) {
      return NextResponse.json(
        {
          error:
            "The selected Samiz Energy Tools plan is not configured.",
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
          error:
            "Payment service is not configured.",
        },
        { status: 500 },
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const requestedReturnTo =
      typeof body.returnTo === "string"
        ? body.returnTo.trim()
        : "";

    const returnTo =
      requestedReturnTo.startsWith("/") &&
      !requestedReturnTo.startsWith("//")
        ? requestedReturnTo
        : "/energy-tools";

    const callbackUrl =
      `${appUrl}/payment/callback?returnTo=${encodeURIComponent(returnTo)}`;


    const reference =
      `samiz-${plan.id}-${Date.now()}-${crypto.randomUUID()}`;

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: plan.amount * 100,
          currency: "NGN",
          reference,
          callback_url: callbackUrl,
          plan: plan.paymentPlanId,
          metadata: {
            product: "samiz-energy-tools",
            plan: plan.id,
            plan_name: plan.name,
            customer_name: name,
            customer_phone: phone,
            amount_naira: plan.amount,
            interval: plan.interval,
          },
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error(
        "Paystack initialization error:",
        data,
      );

      return NextResponse.json(
        {
          error:
            data.message ||
            "Unable to create Paystack checkout.",
        },
        { status: 502 },
      );
    }

    const checkoutUrl =
      data?.data?.authorization_url;

    const returnedReference =
      data?.data?.reference;

    if (!checkoutUrl || !returnedReference) {
      return NextResponse.json(
        {
          error:
            "Paystack did not return a valid checkout response.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      checkoutUrl,
      reference: returnedReference,
      plan: plan.id,
      amount: plan.amount,
    });
  } catch (error) {
    console.error(
      "Paystack initialization failed:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to start payment.",
      },
      { status: 500 },
    );
  }
}