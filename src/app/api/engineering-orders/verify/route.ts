import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSignedAssessmentTrackingLink } from "@/lib/engineering-orders/tracking";

const EXPECTED_AMOUNT_KOBO = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const orderId =
      typeof body.orderId === "string" ? body.orderId.trim() : "";

    const reference =
      typeof body.reference === "string"
        ? body.reference.trim()
        : "";

    if (!orderId || !reference) {
      return NextResponse.json(
        { error: "Order ID and payment reference are required." },
        { status: 400 },
      );
    }

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid engineering order ID." },
        { status: 400 },
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("Paystack is not configured.");

      return NextResponse.json(
        { error: "Payment verification is not configured." },
        { status: 500 },
      );
    }

    const { data: order, error: orderError } =
      await supabaseServer
        .from("engineering_orders")
        .select(
          "id, payment_reference, amount_kobo, currency, payment_status, order_status, service_type, customer_email",
        )
        .eq("id", orderId)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Could not retrieve engineering order:",
        orderError.message,
      );

      return NextResponse.json(
        { error: "Unable to retrieve the assessment order." },
        { status: 500 },
      );
    }

    if (!order || order.payment_reference !== reference) {
      return NextResponse.json(
        { error: "The payment reference does not match this order." },
        { status: 404 },
      );
    }

    if (order.service_type !== "remote_energy_assessment") {
      return NextResponse.json(
        { error: "This order is not eligible for engineering assessment payment verification." },
        { status: 409 },
      );
    }

    if (
      order.amount_kobo !== EXPECTED_AMOUNT_KOBO ||
      order.currency !== "NGN"
    ) {
      console.error("Engineering order amount or currency mismatch.");

      return NextResponse.json(
        { error: "The order amount could not be validated." },
        { status: 409 },
      );
    }

    const paystackResponse = await fetch(
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

    const verification = await paystackResponse.json();
    const transaction = verification?.data;

    if (
      !paystackResponse.ok ||
      !verification?.status ||
      transaction?.status !== "success" ||
      transaction?.reference !== reference ||
      transaction?.amount !== EXPECTED_AMOUNT_KOBO ||
      transaction?.currency !== "NGN"
    ) {
      return NextResponse.json(
        {
          error:
            "Payment has not been verified. If you have paid, please contact Samiz with your payment reference.",
        },
        { status: 402 },
      );
    }

    const transactionEmail =
      typeof transaction?.customer?.email === "string"
        ? transaction.customer.email.trim().toLowerCase()
        : "";

    if (
      !transactionEmail ||
      order.customer_email.toLowerCase() !== transactionEmail
    ) {
      console.error(
        "Engineering payment customer did not match the order.",
      );

      return NextResponse.json(
        { error: "The payment customer could not be validated." },
        { status: 409 },
      );
    }

    let paymentStatus = order.payment_status;
    let orderStatus = order.order_status;

    if (paymentStatus === "pending" || paymentStatus === "failed") {
      const now = new Date().toISOString();

      const { data: updatedOrder, error: updateError } =
        await supabaseServer
          .from("engineering_orders")
          .update({
            payment_status: "paid",
            order_status: "queued",
            paid_at: now,
            updated_at: now,
          })
          .eq("id", orderId)
          .eq("payment_reference", reference)
          .in("payment_status", ["pending", "failed"])
          .select("payment_status, order_status")
          .maybeSingle();

      if (updateError) {
        console.error(
          "Could not mark engineering order as paid:",
          updateError.message,
        );

        return NextResponse.json(
          {
            error:
              "Payment was verified but order updating failed. Please contact Samiz.",
          },
          { status: 500 },
        );
      }

      if (updatedOrder) {
        paymentStatus = updatedOrder.payment_status;
        orderStatus = updatedOrder.order_status;
      } else {
        const { data: latestOrder, error: latestError } =
          await supabaseServer
            .from("engineering_orders")
            .select("payment_status, order_status")
            .eq("id", orderId)
            .eq("payment_reference", reference)
            .maybeSingle();

        if (
          latestError ||
          !latestOrder ||
          latestOrder.payment_status !== "paid"
        ) {
          return NextResponse.json(
            {
              error:
                "The order status could not be confirmed. Please contact Samiz.",
            },
            { status: 500 },
          );
        }

        paymentStatus = latestOrder.payment_status;
        orderStatus = latestOrder.order_status;
      }
    }

    if (paymentStatus !== "paid") {
      return NextResponse.json(
        { error: "The order has not been marked as paid." },
        { status: 409 },
      );
    }

    const trackingUrl = createSignedAssessmentTrackingLink(orderId);

    return NextResponse.json({
      success: true,
      verified: true,
      orderId,
      paymentStatus,
      orderStatus,
      trackingUrl,
      amount: EXPECTED_AMOUNT_KOBO / 100,
      currency: "NGN",
    });
  } catch (error) {
    console.error(
      "Engineering payment verification failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to verify the engineering payment." },
      { status: 500 },
    );
  }
}
