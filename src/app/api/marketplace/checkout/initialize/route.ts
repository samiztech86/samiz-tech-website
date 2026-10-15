import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type PaystackInitializeResult = {
  status?: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    access_code?: string;
    reference?: string;
  };
};

function isValidEmail(value: string): boolean {
  return (
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

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
      return respond({ error: "Invalid checkout details." }, 400);
    }

    const input = body as Record<string, unknown>;

    const productId =
      typeof input.productId === "string"
        ? input.productId.trim()
        : "";

    const quantity = input.quantity;

    const customerName =
      typeof input.customerName === "string"
        ? input.customerName.trim()
        : "";

    const customerEmail =
      typeof input.customerEmail === "string"
        ? input.customerEmail.trim().toLowerCase()
        : "";

    const customerPhone =
      typeof input.customerPhone === "string"
        ? input.customerPhone.trim()
        : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId,
      )
    ) {
      return respond({ error: "A valid product is required." }, 400);
    }

    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000
    ) {
      return respond(
        { error: "Quantity must be a whole number between 1 and 10,000." },
        400,
      );
    }

    if (customerName.length < 2 || customerName.length > 120) {
      return respond(
        { error: "Enter a name between 2 and 120 characters." },
        400,
      );
    }

    if (!isValidEmail(customerEmail)) {
      return respond({ error: "Enter a valid email address." }, 400);
    }

    if (customerPhone.length < 7 || customerPhone.length > 40) {
      return respond(
        { error: "Enter a valid customer phone number." },
        400,
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey || !configuredAppUrl) {
      console.error(
        "Marketplace checkout: required server configuration is missing.",
      );
      return respond(
        { error: "Marketplace checkout is not configured." },
        500,
      );
    }

    let appUrl: URL;

    try {
      appUrl = new URL(configuredAppUrl);
    } catch {
      console.error("Marketplace checkout: invalid application URL.");
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
      console.error("Marketplace checkout: unsafe application URL.");
      return respond(
        { error: "Marketplace checkout is not configured correctly." },
        500,
      );
    }

    const { data: product, error: productError } =
      await supabaseServer
        .from("marketplace_products")
        .select(
          "id, supplier_id, name, price_type, indicative_price, currency, product_status, is_available, is_listed",
        )
        .eq("id", productId)
        .eq("product_status", "approved")
        .maybeSingle();

    if (productError) {
      console.error("Marketplace checkout: product lookup failed.");
      return respond(
        { error: "Unable to validate this product. Please try again." },
        500,
      );
    }

    if (!product) {
      return respond(
        { error: "This product is unavailable or has not been approved." },
        404,
      );
    }

    if (product.is_listed !== true) {
      return respond(
        { error: "This product is no longer listed for purchase." },
        404,
      );
    }

    if (product.is_available !== true) {
      return respond(
        { error: "This product is currently out of stock." },
        409,
      );
    }
    if (product.price_type !== "indicative") {
      return respond(
        {
          error:
            "This product requires a supplier quotation and cannot be purchased through direct checkout.",
        },
        409,
      );
    }

    if (product.currency !== "NGN") {
      return respond(
        { error: "This product is not available for NGN checkout." },
        409,
      );
    }

    const unitPriceNaira = Number(product.indicative_price);

    if (
      !Number.isFinite(unitPriceNaira) ||
      unitPriceNaira <= 0 ||
      !Number.isSafeInteger(Math.round(unitPriceNaira * 100))
    ) {
      return respond(
        { error: "This product does not have a valid purchase price." },
        409,
      );
    }

    const unitPriceKobo = Math.round(unitPriceNaira * 100);
    const subtotalKobo = unitPriceKobo * quantity;

    if (
      !Number.isSafeInteger(subtotalKobo) ||
      subtotalKobo <= 0
    ) {
      return respond(
        { error: "The order total exceeds the supported payment limit." },
        400,
      );
    }

    const commissionKobo = Math.round(subtotalKobo * 0.05);
    const supplierAmountKobo = subtotalKobo - commissionKobo;

    if (
      !Number.isSafeInteger(commissionKobo) ||
      !Number.isSafeInteger(supplierAmountKobo)
    ) {
      return respond(
        { error: "The order total exceeds the supported payment limit." },
        400,
      );
    }

    const { data: supplier, error: supplierError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select(
          "id, verification_status, payout_status, payout_subaccount_code",
        )
        .eq("id", product.supplier_id)
        .maybeSingle();

    if (supplierError) {
      console.error("Marketplace checkout: supplier lookup failed.");
      return respond(
        { error: "Unable to validate the supplier. Please try again." },
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
      !/^ACCT_[A-Za-z0-9]+$/.test(
        supplier.payout_subaccount_code,
      )
    ) {
      return respond(
        {
          error:
            "This supplier has not completed payout setup. Please try another product or contact support.",
        },
        409,
      );
    }

    let buyerId: string | null = null;

    try {
      const authClient = await createSupabaseRouteHandlerClient();
      const { data: authData, error: authError } =
        await authClient.auth.getUser();

      if (!authError && authData.user) {
        buyerId = authData.user.id;
      }
    } catch {
      // Guest checkout remains available if no usable session exists.
    }

    const reference =
      `samiz-mkt-${Date.now()}-${crypto.randomUUID()}`;

    const { data: order, error: orderError } =
      await supabaseServer
        .from("marketplace_orders")
        .insert({
          buyer_id: buyerId,
          product_id: product.id,
          supplier_id: product.supplier_id,
          product_name: product.name,
          quantity,
          unit_price_kobo: unitPriceKobo,
          subtotal_kobo: subtotalKobo,
          commission_kobo: commissionKobo,
          supplier_amount_kobo: supplierAmountKobo,
          currency: "NGN",
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          payment_status: "pending",
          paystack_reference: reference,
        })
        .select("id")
        .single();

    if (orderError || !order) {
      console.error("Marketplace checkout: order creation failed.");
      return respond(
        { error: "Unable to create the order. Please try again." },
        500,
      );
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
            amount: subtotalKobo,
            currency: "NGN",
            reference,
            callback_url: callbackUrl,
            subaccount: supplier.payout_subaccount_code,
            metadata: {
              marketplace_order_id: order.id,
              product_id: product.id,
              supplier_id: product.supplier_id,
              quantity,
            },
          }),
        },
      );
    } catch {
      // The gateway may have received the request before the connection
      // failed. Keep the order pending for safe reconciliation.
      console.error(
        "Marketplace checkout: gateway initialization outcome is uncertain.",
      );
      return respond(
        {
          error:
            "We could not confirm checkout initialization. Do not retry repeatedly; contact support with your order reference.",
          reference,
          orderId: order.id,
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
      // A response that cannot be interpreted is not proof that no
      // transaction was created.
    }

    if (gatewayResult?.status === false) {
      const { error: updateError } = await supabaseServer
        .from("marketplace_orders")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("payment_status", "pending");

      if (updateError) {
        console.error(
          "Marketplace checkout: explicit gateway rejection could not be recorded.",
        );
      }

      const gatewayMessage =
        typeof gatewayResult.message === "string"
          ? gatewayResult.message.slice(0, 300)
          : "No gateway message returned";

      console.error(
        "Marketplace checkout: Paystack rejected initialization.",
        {
          httpStatus: gatewayResponse.status,
          gatewayMessage,
        },
      );

      return respond(
        {
          error:
            "Paystack could not initialize this payment. Please try again.",
          orderId: order.id,
          paymentStatus: updateError ? "pending" : "failed",
        },
        502,
      );
    }

    const authorizationUrl =
      gatewayResult?.data?.authorization_url;

    const returnedReference =
      gatewayResult?.data?.reference;

    if (
      !gatewayResponse.ok ||
      gatewayResult?.status !== true ||
      typeof authorizationUrl !== "string" ||
      !returnedReference ||
      returnedReference !== reference
    ) {
      // Do not mark this order failed: the gateway's outcome is unclear.
      console.error(
        "Marketplace checkout: initialization response requires reconciliation.",
      );
      return respond(
        {
          error:
            "Payment initialization could not be confirmed. Please contact support before retrying.",
          orderId: order.id,
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
      console.error(
        "Marketplace checkout: Paystack returned an invalid authorization URL.",
      );
      return respond(
        {
          error:
            "Payment initialization needs support review. Please do not retry yet.",
          orderId: order.id,
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
      console.error(
        "Marketplace checkout: Paystack returned an unexpected checkout host.",
      );
      return respond(
        {
          error:
            "Payment initialization needs support review. Please do not retry yet.",
          orderId: order.id,
          reference,
          paymentStatus: "pending",
        },
        502,
      );
    }

    return respond({
      success: true,
      orderId: order.id,
      reference,
      checkoutUrl: checkoutUrl.toString(),
      amountKobo: subtotalKobo,
      currency: "NGN",
      paymentStatus: "pending",
    });
  } catch {
    console.error("Unexpected marketplace checkout initialization error.");
    return respond(
      { error: "Unable to initialize marketplace checkout." },
      500,
    );
  }
}
