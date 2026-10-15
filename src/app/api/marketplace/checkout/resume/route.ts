import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REFERENCE_PATTERN =
  /^samiz-mkt-\d+-[0-9a-f-]{36}$/i;

type GatewayResult = {
  status?: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    id?: number;
    authorization_url?: string;
  };
};

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function validEmail(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== request.nextUrl.origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
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

    const body = (await request.json().catch(() => null)) as {
      orderId?: unknown;
    } | null;

    const orderId =
      typeof body?.orderId === "string" ? body.orderId.trim() : "";

    if (!UUID_PATTERN.test(orderId)) {
      return respond({ error: "A valid order ID is required." }, 400);
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Please sign in to resume payment." }, 401);
    }

    const { data: order, error: orderError } = await supabaseServer
      .from("marketplace_orders")
      .select(
        "id, buyer_id, product_id, supplier_id, product_name, quantity, subtotal_kobo, currency, customer_email, payment_status, paystack_reference, paystack_transaction_id, quote_id",
      )
      .eq("id", orderId)
      .eq("buyer_id", authData.user.id)
      .maybeSingle();

    if (orderError) {
      console.error("Marketplace payment resume: order lookup failed.");
      return respond({ error: "Unable to validate this order." }, 500);
    }

    if (!order) {
      return respond(
        { error: "Order not found for this buyer account." },
        404,
      );
    }

    if (order.quote_id !== null) {
      return respond(
        {
          error:
            "This is a quotation order. Use the quotation payment workflow.",
        },
        409,
      );
    }

    if (order.payment_status === "paid") {
      return respond(
        { error: "This order is already marked as paid." },
        409,
      );
    }

    if (order.payment_status !== "pending") {
      return respond(
        {
          error:
            "This order is not eligible for automatic recovery. Contact support before retrying.",
        },
        409,
      );
    }

    if (order.paystack_transaction_id !== null) {
      return respond(
        {
          error:
            "A transaction ID is already recorded. Refresh your orders or contact support; do not start another payment.",
        },
        409,
      );
    }

    if (
      typeof order.paystack_reference !== "string" ||
      !REFERENCE_PATTERN.test(order.paystack_reference) ||
      order.currency !== "NGN" ||
      !Number.isSafeInteger(Number(order.subtotal_kobo)) ||
      Number(order.subtotal_kobo) <= 0 ||
      !validEmail(order.customer_email)
    ) {
      return respond(
        {
          error:
            "The saved payment details need support review. No new payment was started.",
        },
        409,
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (
      !secretKey ||
      (!secretKey.startsWith("sk_test_") &&
        !secretKey.startsWith("sk_live_"))
    ) {
      return respond(
        { error: "Marketplace payment configuration is incomplete." },
        500,
      );
    }

    const { data: supplier, error: supplierError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select(
          "id, verification_status, payout_status, payout_subaccount_code, payout_subaccount_code_test",
        )
        .eq("id", order.supplier_id)
        .maybeSingle();

    if (supplierError) {
      console.error("Marketplace payment resume: supplier lookup failed.");
      return respond(
        { error: "Unable to validate supplier payment configuration." },
        500,
      );
    }

    const subaccountCode =
      supplier && secretKey.startsWith("sk_test_")
        ? supplier.payout_subaccount_code_test
        : supplier && secretKey.startsWith("sk_live_")
          ? supplier.payout_subaccount_code
          : null;

    if (
      !supplier ||
      supplier.verification_status !== "approved" ||
      supplier.payout_status !== "active" ||
      typeof subaccountCode !== "string" ||
      !/^ACCT_[A-Za-z0-9]+$/.test(subaccountCode)
    ) {
      return respond(
        {
          error:
            "The supplier payout configuration is not ready. No payment was started.",
        },
        409,
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      return respond(
        { error: "Marketplace payment configuration is incomplete." },
        500,
      );
    }

    let baseUrl: URL;

    try {
      baseUrl = new URL(appUrl);
    } catch {
      return respond({ error: "Marketplace URL is invalid." }, 500);
    }

    const localHost =
      baseUrl.hostname === "localhost" ||
      baseUrl.hostname === "127.0.0.1";

    if (
      baseUrl.username ||
      baseUrl.password ||
      (baseUrl.protocol !== "https:" &&
        !(localHost && baseUrl.protocol === "http:"))
    ) {
      return respond({ error: "Marketplace URL is not permitted." }, 500);
    }

    const reference = order.paystack_reference;
    const headers = {
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/json",
    };

    // Inspect the original reference first. A timeout or unknown response
    // is not proof that a transaction does not exist.
    let verifyResponse: Response;

    try {
      verifyResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        { method: "GET", headers, cache: "no-store" },
      );
    } catch {
      return respond(
        {
          error:
            "Paystack could not be reached to check the existing reference. Please refresh or contact support; no new payment was started.",
        },
        502,
      );
    }

    let verifyResult: GatewayResult | null = null;

    try {
      verifyResult = (await verifyResponse.json()) as GatewayResult;
    } catch {
      return respond(
        {
          error:
            "Paystack returned an unreadable verification response. No new payment was started.",
        },
        502,
      );
    }

    const existingTransaction = verifyResult?.data;
    const explicitlyNotFound =
      verifyResponse.status === 404 &&
      verifyResult?.status === false &&
      typeof verifyResult.message === "string" &&
      /transaction reference not found|reference not found/i.test(
        verifyResult.message,
      );

    if (!explicitlyNotFound) {
      if (
        verifyResponse.ok &&
        verifyResult?.status === true &&
        existingTransaction
      ) {
        if (
          existingTransaction.reference !== reference ||
          !Number.isSafeInteger(existingTransaction.amount) ||
          existingTransaction.amount !== Number(order.subtotal_kobo) ||
          existingTransaction.currency !== order.currency
        ) {
          return respond(
            {
              error:
                "Paystack returned a transaction whose details do not match this order. Contact support; no new payment was started.",
            },
            409,
          );
        }

        if (existingTransaction.status === "success") {
          return respond({
            success: true,
            needsVerification: true,
            reference,
            orderId: order.id,
            message:
              "An existing successful transaction was found. The order payment record must now be verified.",
          });
        }

        return respond(
          {
            error:
              "A transaction already exists for this reference but is not confirmed successful. No second payment was started. Refresh or contact support.",
          },
          409,
        );
      }

      console.error(
        "Marketplace payment resume: Paystack verification was inconclusive.",
        { httpStatus: verifyResponse.status },
      );

      return respond(
        {
          error:
            "Paystack could not conclusively establish that this reference has no transaction. No new payment was started.",
        },
        502,
      );
    }

    // Only an explicit transaction-not-found response reaches initialization.
    let initResponse: Response;

    try {
      initResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: order.customer_email,
            amount: Number(order.subtotal_kobo),
            currency: order.currency,
            reference,
            callback_url: new URL(
              "/marketplace/payment/callback",
              baseUrl,
            ).toString(),
            subaccount: subaccountCode,
            metadata: {
              marketplace_order_id: order.id,
              product_id: order.product_id,
              supplier_id: order.supplier_id,
              quantity: order.quantity,
              recovery: true,
            },
          }),
          cache: "no-store",
        },
      );
    } catch {
      return respond(
        {
          error:
            "Payment initialization could not be confirmed. The existing order and reference were preserved. Refresh or contact support before retrying.",
          orderId: order.id,
          reference,
        },
        502,
      );
    }

    let initResult: GatewayResult | null = null;

    try {
      initResult = (await initResponse.json()) as GatewayResult;
    } catch {
      // An unreadable response does not establish whether initialization
      // succeeded, so preserve the order as pending.
    }

    const authorizationUrl = initResult?.data?.authorization_url;

    if (
      !initResponse.ok ||
      initResult?.status !== true ||
      typeof authorizationUrl !== "string" ||
      initResult.data?.reference !== reference
    ) {
      console.error(
        "Marketplace payment resume: initialization requires reconciliation.",
        { httpStatus: initResponse.status },
      );

      return respond(
        {
          error:
            "Paystack did not confirm a usable checkout session. The existing order and reference were preserved. Contact support before trying again.",
          orderId: order.id,
          reference,
        },
        502,
      );
    }

    let checkoutUrl: URL;

    try {
      checkoutUrl = new URL(authorizationUrl);
    } catch {
      return respond(
        {
          error: "Paystack returned an invalid checkout URL. Contact support.",
          orderId: order.id,
          reference,
        },
        502,
      );
    }

    if (
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.paystack.com"
    ) {
      return respond(
        {
          error:
            "Paystack returned an unexpected checkout address. Contact support.",
          orderId: order.id,
          reference,
        },
        502,
      );
    }

    return respond({
      success: true,
      orderId: order.id,
      reference,
      authorizationUrl: checkoutUrl.toString(),
    });
  } catch {
    console.error("Unexpected marketplace payment resume error.");
    return respond(
      { error: "Unable to resume marketplace payment." },
      500,
    );
  }
}
