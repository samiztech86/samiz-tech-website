import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PaystackInitializeResult = {
  status?: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    reference?: string;
  };
};

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
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
      requestId?: unknown;
      quoteId?: unknown;
    } | null;

    const requestId =
      typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const quoteId =
      typeof body?.quoteId === "string" ? body.quoteId.trim() : "";

    if (!UUID_PATTERN.test(requestId) || !UUID_PATTERN.test(quoteId)) {
      return respond(
        { error: "Valid quote request and quotation IDs are required." },
        400,
      );
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Authentication required." }, 401);
    }

    const { data: quoteRequest, error: requestError } =
      await supabaseServer
        .from("marketplace_quote_requests")
        .select(
          "id, buyer_id, product_id, supplier_id, customer_name, customer_email, customer_phone, quantity, request_status, accepted_quote_id",
        )
        .eq("id", requestId)
        .eq("buyer_id", authData.user.id)
        .maybeSingle();

    if (requestError) {
      console.error("Quote payment: request lookup failed.");
      return respond(
        { error: "Unable to validate this quote request." },
        500,
      );
    }

    if (!quoteRequest) {
      return respond(
        { error: "Quote request not found for this buyer." },
        404,
      );
    }

    if (
      quoteRequest.request_status !== "accepted" ||
      quoteRequest.accepted_quote_id !== quoteId
    ) {
      return respond(
        { error: "Accept this quotation before proceeding to payment." },
        409,
      );
    }

    const { data: quote, error: quoteError } =
      await supabaseServer
        .from("marketplace_supplier_quotes")
        .select(
          "id, request_id, supplier_id, quote_amount, currency, quote_status",
        )
        .eq("id", quoteId)
        .eq("request_id", quoteRequest.id)
        .eq("supplier_id", quoteRequest.supplier_id)
        .maybeSingle();

    if (quoteError) {
      console.error("Quote payment: quotation lookup failed.");
      return respond(
        { error: "Unable to validate this quotation." },
        500,
      );
    }

    if (!quote) {
      return respond(
        { error: "Quotation not found for this request." },
        404,
      );
    }

    if (quote.quote_status !== "accepted") {
      return respond(
        { error: "This quotation is not available for payment." },
        409,
      );
    }

    if (quote.currency !== "NGN") {
      return respond(
        { error: "Only NGN quotations can be paid through this checkout." },
        409,
      );
    }

    const totalNaira = Number(quote.quote_amount);
    const totalKobo = Math.round(totalNaira * 100);

    if (
      !Number.isFinite(totalNaira) ||
      totalNaira <= 0 ||
      !Number.isSafeInteger(totalKobo) ||
      totalKobo <= 0 ||
      Math.abs(totalNaira * 100 - totalKobo) > 0.000001
    ) {
      return respond(
        { error: "The accepted quotation has an invalid payment amount." },
        409,
      );
    }

    const customerName =
      typeof quoteRequest.customer_name === "string"
        ? quoteRequest.customer_name.trim()
        : "";
    const customerEmail =
      typeof quoteRequest.customer_email === "string"
        ? quoteRequest.customer_email.trim().toLowerCase()
        : "";
    const customerPhone =
      typeof quoteRequest.customer_phone === "string"
        ? quoteRequest.customer_phone.trim()
        : "";

    if (
      customerName.length < 2 ||
      customerName.length > 120 ||
      !isValidEmail(customerEmail) ||
      customerPhone.length < 7 ||
      customerPhone.length > 40
    ) {
      return respond(
        {
          error:
            "Your saved customer details are incomplete. Contact support to update them before paying.",
        },
        409,
      );
    }

    const { data: product, error: productError } =
      await supabaseServer
        .from("marketplace_products")
        .select("id, name")
        .eq("id", quoteRequest.product_id)
        .maybeSingle();

    if (productError) {
      console.error("Quote payment: product lookup failed.");
      return respond(
        { error: "Unable to validate the quoted product." },
        500,
      );
    }

    if (!product) {
      return respond(
        { error: "The quoted product could not be found." },
        409,
      );
    }

    const { data: supplier, error: supplierError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select(
          "id, verification_status, payout_status, payout_subaccount_code",
        )
        .eq("id", quoteRequest.supplier_id)
        .maybeSingle();

    if (supplierError) {
      console.error("Quote payment: supplier lookup failed.");
      return respond(
        { error: "Unable to validate supplier payment details." },
        500,
      );
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond(
        { error: "This supplier is not approved for marketplace sales." },
        409,
      );
    }

    if (
      supplier.payout_status !== "active" ||
      typeof supplier.payout_subaccount_code !== "string" ||
      !/^ACCT_[A-Za-z0-9]+$/.test(supplier.payout_subaccount_code)
    ) {
      return respond(
        {
          error:
            "This supplier has not completed payout setup. Please contact support.",
        },
        409,
      );
    }

    const commissionKobo = Math.round(totalKobo * 0.05);
    const supplierAmountKobo = totalKobo - commissionKobo;

    if (
      !Number.isSafeInteger(commissionKobo) ||
      !Number.isSafeInteger(supplierAmountKobo) ||
      supplierAmountKobo <= 0
    ) {
      return respond(
        { error: "The quotation exceeds the supported payment limit." },
        400,
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey || !configuredAppUrl) {
      console.error("Quote payment: required server configuration is missing.");
      return respond(
        { error: "Marketplace checkout is not configured." },
        500,
      );
    }

    let appUrl: URL;

    try {
      appUrl = new URL(configuredAppUrl);
    } catch {
      return respond(
        { error: "Marketplace checkout is not configured correctly." },
        500,
      );
    }

    const isLocalhost =
      appUrl.hostname === "localhost" ||
      appUrl.hostname === "127.0.0.1";

    if (
      appUrl.username ||
      appUrl.password ||
      (appUrl.protocol !== "https:" &&
        !(isLocalhost && appUrl.protocol === "http:"))
    ) {
      return respond(
        { error: "Marketplace checkout is not configured correctly." },
        500,
      );
    }

    let orderId: string;
    let reference: string;

    const { data: existingOrder, error: existingOrderError } =
      await supabaseServer
        .from("marketplace_orders")
        .select(
          "id, buyer_id, payment_status, paystack_reference, subtotal_kobo, quoted_total_kobo, paystack_transaction_id",
        )
        .eq("quote_id", quoteId)
        .maybeSingle();

    if (existingOrderError) {
      console.error("Quote payment: existing order lookup failed.");
      return respond(
        { error: "Unable to check the existing order." },
        500,
      );
    }

    if (existingOrder) {
      if (
        existingOrder.buyer_id &&
        existingOrder.buyer_id !== authData.user.id
      ) {
        console.error("Quote payment: existing order buyer mismatch.");
        return respond(
          { error: "The existing order requires support review." },
          409,
        );
      }

      if (
        existingOrder.subtotal_kobo !== totalKobo ||
        existingOrder.quoted_total_kobo !== totalKobo
      ) {
        console.error("Quote payment: existing order amount mismatch.");
        return respond(
          { error: "The existing order requires support review." },
          409,
        );
      }

      if (existingOrder.payment_status === "paid") {
        return respond(
          {
            error: "This quotation has already been paid.",
            orderId: existingOrder.id,
            paymentStatus: "paid",
          },
          409,
        );
      }

      if (
        existingOrder.payment_status === "pending" ||
        existingOrder.paystack_transaction_id !== null
      ) {
        return respond(
          {
            error:
              "An order already exists for this quotation. Refresh your quote history or contact support before retrying.",
            orderId: existingOrder.id,
            reference: existingOrder.paystack_reference,
            paymentStatus: existingOrder.payment_status,
          },
          409,
        );
      }

      if (existingOrder.payment_status !== "failed") {
        return respond(
          {
            error:
              "This order cannot be retried automatically. Please contact support.",
            orderId: existingOrder.id,
            paymentStatus: existingOrder.payment_status,
          },
          409,
        );
      }

      reference = `samiz-mkt-${Date.now()}-${crypto.randomUUID()}`;

      const { data: retriedOrder, error: retryError } =
        await supabaseServer
          .from("marketplace_orders")
          .update({
            buyer_id: authData.user.id,
            paystack_reference: reference,
            payment_status: "pending",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingOrder.id)
          .eq("payment_status", "failed")
          .is("paystack_transaction_id", null)
          .select("id")
          .maybeSingle();

      if (retryError || !retriedOrder) {
        return respond(
          {
            error:
              "This order changed before checkout could be retried. Refresh and try again.",
          },
          409,
        );
      }

      orderId = retriedOrder.id;
    } else {
      reference = `samiz-mkt-${Date.now()}-${crypto.randomUUID()}`;

      const quantity = Number(quoteRequest.quantity);

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        quantity > 10000
      ) {
        return respond(
          { error: "The requested quantity is invalid. Contact support." },
          409,
        );
      }

      const { data: newOrder, error: orderError } =
        await supabaseServer
          .from("marketplace_orders")
          .insert({
            buyer_id: authData.user.id,
            product_id: quoteRequest.product_id,
            supplier_id: quoteRequest.supplier_id,
            product_name: product.name,
            quantity,
            unit_price_kobo: totalKobo,
            subtotal_kobo: totalKobo,
            commission_kobo: commissionKobo,
            supplier_amount_kobo: supplierAmountKobo,
            currency: "NGN",
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
            payment_status: "pending",
            paystack_reference: reference,
            quote_request_id: requestId,
            quote_id: quoteId,
            quoted_total_kobo: totalKobo,
          })
          .select("id")
          .maybeSingle();

      if (orderError || !newOrder) {
        // A concurrent request may have won the unique quote_id index.
        console.error(
          "Quote payment: order creation failed or an order already exists.",
        );
        return respond(
          {
            error:
              "Unable to create a new order for this quotation. Refresh your quote history before retrying.",
          },
          409,
        );
      }

      orderId = newOrder.id;
    }

    const callbackUrl = new URL(
      "/marketplace/payment/callback",
      appUrl,
    ).toString();

    let gatewayResponse: Response;

    try {
      gatewayResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
          body: JSON.stringify({
            email: customerEmail,
            amount: totalKobo,
            currency: "NGN",
            reference,
            callback_url: callbackUrl,
            subaccount: supplier.payout_subaccount_code,
            metadata: {
              marketplace_order_id: orderId,
              quote_request_id: requestId,
              quote_id: quoteId,
              product_id: quoteRequest.product_id,
              supplier_id: quoteRequest.supplier_id,
            },
          }),
        },
      );
    } catch {
      console.error(
        "Quote payment: gateway initialization outcome is uncertain.",
      );
      return respond(
        {
          error:
            "We could not confirm checkout initialization. Do not retry repeatedly; contact support with your order reference.",
          orderId,
          reference,
          paymentStatus: "pending",
        },
        502,
      );
    }

    let gatewayResult: PaystackInitializeResult | null = null;

    try {
      gatewayResult =
        (await gatewayResponse.json()) as PaystackInitializeResult;
    } catch {
      // An unreadable response does not prove that no transaction was created.
    }

    if (gatewayResult?.status === false) {
      const { error: updateError } = await supabaseServer
        .from("marketplace_orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("payment_status", "pending");

      if (updateError) {
        console.error("Quote payment: gateway rejection update failed.");
      }

      console.error("Quote payment: Paystack rejected initialization.");

      return respond(
        {
          error:
            "Paystack could not initialize this payment. Please try again.",
          orderId,
          paymentStatus: updateError ? "pending" : "failed",
        },
        502,
      );
    }

    const authorizationUrl = gatewayResult?.data?.authorization_url;

    if (
      !gatewayResponse.ok ||
      gatewayResult?.status !== true ||
      typeof authorizationUrl !== "string" ||
      gatewayResult?.data?.reference !== reference
    ) {
      console.error(
        "Quote payment: initialization response requires reconciliation.",
      );
      return respond(
        {
          error:
            "Payment initialization could not be confirmed. Contact support before retrying.",
          orderId,
          reference,
          paymentStatus: "pending",
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
          error:
            "Payment initialization needs support review. Please do not retry yet.",
          orderId,
          reference,
          paymentStatus: "pending",
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
            "Payment initialization needs support review. Please do not retry yet.",
          orderId,
          reference,
          paymentStatus: "pending",
        },
        502,
      );
    }

    return respond({
      success: true,
      orderId,
      reference,
      checkoutUrl: checkoutUrl.toString(),
      amountKobo: totalKobo,
      currency: "NGN",
      paymentStatus: "pending",
    });
  } catch {
    console.error("Unexpected quote payment initialization failure.");
    return respond(
      { error: "Unable to initialize quotation payment." },
      500,
    );
  }
}
