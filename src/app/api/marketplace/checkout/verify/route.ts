import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type PaystackVerification = {
  status?: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    customer?: {
      email?: string;
    };
  };
};

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (origin && origin !== request.nextUrl.origin) {
      return respond({ error: "Invalid request origin." }, 403);
    }

    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json")
    ) {
      return respond(
        { error: "Content-Type must be application/json." },
        415,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond(
        { error: "A valid JSON request body is required." },
        400,
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid verification request." }, 400);
    }

    const input = body as Record<string, unknown>;
    const reference =
      typeof input.reference === "string"
        ? input.reference.trim()
        : "";

    if (
      !/^samiz-mkt-\d+-[0-9a-f-]{36}$/i.test(reference)
    ) {
      return respond(
        { error: "A valid marketplace payment reference is required." },
        400,
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error(
        "Marketplace verification: Paystack is not configured.",
      );
      return respond(
        { error: "Payment verification is not configured." },
        500,
      );
    }

    const { data: order, error: orderError } =
      await supabaseServer
        .from("marketplace_orders")
        .select(
          "id, product_id, supplier_id, quantity, subtotal_kobo, currency, customer_email, payment_status, paystack_reference, paystack_transaction_id, paid_at",
        )
        .eq("paystack_reference", reference)
        .maybeSingle();

    if (orderError) {
      console.error(
        "Marketplace verification: order lookup failed.",
      );
      return respond(
        { error: "Unable to retrieve this marketplace order." },
        500,
      );
    }

    if (!order) {
      return respond(
        { error: "No marketplace order matches this reference." },
        404,
      );
    }

    let gatewayResponse: Response;

    try {
      gatewayResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        },
      );
    } catch {
      console.error(
        "Marketplace verification: Paystack request failed.",
      );
      return respond(
        {
          error:
            "Payment verification is temporarily unavailable. Please try again.",
        },
        502,
      );
    }

    let verification: PaystackVerification | null = null;

    try {
      verification =
        (await gatewayResponse.json()) as PaystackVerification;
    } catch {
      console.error(
        "Marketplace verification: invalid Paystack response.",
      );
      return respond(
        { error: "Unable to verify the payment at this time." },
        502,
      );
    }

    const transaction = verification?.data;

    if (
      !gatewayResponse.ok ||
      verification?.status !== true ||
      !transaction
    ) {
      return respond(
        {
          error:
            "Paystack has not confirmed this payment. If you have paid, please try verification again.",
          verified: false,
        },
        402,
      );
    }

    if (
      transaction.status !== "success" ||
      transaction.reference !== order.paystack_reference ||
      transaction.amount !== Number(order.subtotal_kobo) ||
      transaction.currency !== order.currency ||
      typeof transaction.id !== "number" ||
      !Number.isSafeInteger(transaction.id) ||
      transaction.id <= 0 ||
      typeof transaction.customer?.email !== "string" ||
      transaction.customer.email.trim().toLowerCase() !==
        order.customer_email.trim().toLowerCase()
    ) {
      console.error(
        "Marketplace verification: transaction did not match the stored order.",
      );

      return respond(
        {
          error:
            "The transaction could not be matched to this order. Please contact Samiz support with your payment reference.",
          verified: false,
        },
        409,
      );
    }

    // A retry after successful verification must not create a second
    // payment record or replace the original transaction ID.
    if (order.payment_status === "paid") {
      if (Number(order.paystack_transaction_id) !== transaction.id) {
        console.error(
          "Marketplace verification: paid order has a transaction ID mismatch.",
        );

        return respond(
          {
            error:
              "This order is already marked paid, but its transaction record requires support review.",
          },
          409,
        );
      }

      return respond({
        success: true,
        verified: true,
        orderId: order.id,
        paymentStatus: "paid",
        reference,
        amountKobo: Number(order.subtotal_kobo),
        currency: order.currency,
        paidAt: order.paid_at,
      });
    }

    // Only pending orders can transition automatically to paid.
    // Failed, cancelled or refunded orders require reconciliation.
    if (order.payment_status !== "pending") {
      return respond(
        {
          error:
            "This order is not eligible for automatic payment confirmation. Please contact Samiz support.",
          paymentStatus: order.payment_status,
        },
        409,
      );
    }

    const paidAt =
      transaction.paid_at &&
      Number.isFinite(Date.parse(transaction.paid_at))
        ? new Date(transaction.paid_at).toISOString()
        : new Date().toISOString();

    const { data: updatedOrder, error: updateError } =
      await supabaseServer
        .from("marketplace_orders")
        .update({
          payment_status: "paid",
          paystack_transaction_id: transaction.id,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("paystack_reference", reference)
        .eq("payment_status", "pending")
        .select(
          "id, payment_status, paystack_transaction_id, paid_at, subtotal_kobo, currency",
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "Marketplace verification: payment was verified but the order update failed.",
      );
      return respond(
        {
          error:
            "Payment was verified, but the order status could not be saved. Please contact Samiz support with your payment reference.",
          verified: true,
          reference,
        },
        500,
      );
    }

    if (!updatedOrder) {
      // Another request may have completed the transition first.
      const { data: latestOrder, error: latestError } =
        await supabaseServer
          .from("marketplace_orders")
          .select(
            "id, payment_status, paystack_transaction_id, paid_at, subtotal_kobo, currency",
          )
          .eq("id", order.id)
          .eq("paystack_reference", reference)
          .maybeSingle();

      if (
        latestError ||
        !latestOrder ||
        latestOrder.payment_status !== "paid" ||
        Number(latestOrder.paystack_transaction_id) !== transaction.id
      ) {
        console.error(
          "Marketplace verification: concurrent payment update needs reconciliation.",
        );

        return respond(
          {
            error:
              "Payment was verified, but the final order status needs support review.",
            verified: true,
            reference,
          },
          500,
        );
      }

      return respond({
        success: true,
        verified: true,
        orderId: latestOrder.id,
        paymentStatus: "paid",
        reference,
        amountKobo: Number(latestOrder.subtotal_kobo),
        currency: latestOrder.currency,
        paidAt: latestOrder.paid_at,
      });
    }

    return respond({
      success: true,
      verified: true,
      orderId: updatedOrder.id,
      paymentStatus: "paid",
      reference,
      amountKobo: Number(updatedOrder.subtotal_kobo),
      currency: updatedOrder.currency,
      paidAt: updatedOrder.paid_at,
    });
  } catch {
    console.error(
      "Unexpected marketplace payment verification error.",
    );
    return respond(
      { error: "Unable to verify the marketplace payment." },
      500,
    );
  }
}
