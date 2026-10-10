import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createTrackingToken, hashTrackingToken } from "@/lib/engineering-orders/tracking";

const ASSESSMENT_PRICE_KOBO = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const propertyType =
      typeof body.propertyType === "string"
        ? body.propertyType.trim()
        : "";

    const propertyLocation =
      typeof body.propertyLocation === "string"
        ? body.propertyLocation.trim()
        : "";

    const assessmentDetails =
      body.assessmentDetails &&
      typeof body.assessmentDetails === "object" &&
      !Array.isArray(body.assessmentDetails)
        ? body.assessmentDetails
        : {};

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email and phone are required." },
        { status: 400 },
      );
    }

    if (
      name.length > 150 ||
      email.length > 254 ||
      phone.length > 40 ||
      propertyType.length > 100 ||
      propertyLocation.length > 250
    ) {
      return NextResponse.json(
        { error: "One or more fields exceed the allowed length." },
        { status: 400 },
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("Paystack is not configured.");

      return NextResponse.json(
        { error: "Payment service is not configured." },
        { status: 500 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not configured.");

      return NextResponse.json(
        { error: "The payment callback is not configured." },
        { status: 500 },
      );
    }

    const trackingToken = createTrackingToken();
    const reference =
      `samiz-eng-${Date.now()}-${crypto.randomUUID()}`;

    const { data: order, error: insertError } =
      await supabaseServer
        .from("engineering_orders")
        .insert({
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          service_type: "remote_energy_assessment",
          property_type: propertyType || null,
          property_location: propertyLocation || null,
          assessment_details: assessmentDetails,
          amount_kobo: ASSESSMENT_PRICE_KOBO,
          currency: "NGN",
          payment_reference: reference,
          tracking_token_hash: hashTrackingToken(trackingToken),
        })
        .select("id")
        .single();

    if (insertError || !order) {
      console.error(
        "Could not create engineering order:",
        insertError?.message,
      );

      return NextResponse.json(
        { error: "We could not create your assessment order." },
        { status: 500 },
      );
    }

    const callbackUrl = new URL(
      `${appUrl.replace(/\/+$/, "")}/engineering-payment/callback`,
    );
    callbackUrl.searchParams.set("orderId", order.id);

    const paymentResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: ASSESSMENT_PRICE_KOBO,
          currency: "NGN",
          reference,
          callback_url: callbackUrl.toString(),
          metadata: {
            product: "samiz-engineering-assessment",
            order_id: order.id,
            service_type: "remote_energy_assessment",
            customer_name: name,
            customer_phone: phone,
          },
        }),
      },
    );

    const paymentData = await paymentResponse.json();

    if (
      !paymentResponse.ok ||
      !paymentData.status ||
      !paymentData.data?.authorization_url ||
      paymentData.data?.reference !== reference
    ) {
      console.error(
        "Engineering payment initialization failed:",
        paymentData.message || "Invalid Paystack response",
      );

      return NextResponse.json(
        { error: "Unable to start payment. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      trackingToken,
      checkoutUrl: paymentData.data.authorization_url,
      amount: ASSESSMENT_PRICE_KOBO / 100,
      currency: "NGN",
    });
  } catch (error) {
    console.error(
      "Engineering checkout error:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to start your assessment payment." },
      { status: 500 },
    );
  }
}