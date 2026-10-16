import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";
import { sendMarketplaceSupplierQuoteNotification, sendMarketplaceEventNotifications } from "@/lib/email/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== new URL(request.url).origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Authentication required." }, 401);
    }

    const body = (await request.json().catch(() => null)) as {
      requestId?: unknown;
      unitPrice?: unknown;
      estimatedLeadTime?: unknown;
      quoteValidUntil?: unknown;
      supplierMessage?: unknown;
    } | null;

    const requestId =
      typeof body?.requestId === "string" ? body.requestId.trim() : "";

    if (!UUID_PATTERN.test(requestId)) {
      return respond({ error: "A valid quote request ID is required." }, 400);
    }

    const unitPrice =
      typeof body?.unitPrice === "number"
        ? body.unitPrice
        : typeof body?.unitPrice === "string" &&
            body.unitPrice.trim() !== ""
          ? Number(body.unitPrice)
          : NaN;

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice <= 0 ||
      unitPrice > 999999999999
    ) {
      return respond(
        { error: "Enter a unit price greater than zero." },
        400,
      );
    }

    const supplierMessage =
      typeof body?.supplierMessage === "string"
        ? body.supplierMessage.trim()
        : "";

    if (supplierMessage.length < 1 || supplierMessage.length > 5000) {
      return respond(
        { error: "The quotation message must contain 1–5000 characters." },
        400,
      );
    }

    const estimatedLeadTime =
      typeof body?.estimatedLeadTime === "string"
        ? body.estimatedLeadTime.trim()
        : "";

    if (estimatedLeadTime.length > 200) {
      return respond(
        { error: "Estimated lead time must not exceed 200 characters." },
        400,
      );
    }

    let quoteValidUntil: string | null = null;

    if (body?.quoteValidUntil !== undefined &&
        body.quoteValidUntil !== null &&
        body.quoteValidUntil !== "") {
      if (
        typeof body.quoteValidUntil !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(body.quoteValidUntil)
      ) {
        return respond(
          { error: "Enter a valid quotation expiry date." },
          400,
        );
      }

      const parsedDate = new Date(`${body.quoteValidUntil}T00:00:00.000Z`);

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== body.quoteValidUntil
      ) {
        return respond(
          { error: "Enter a valid quotation expiry date." },
          400,
        );
      }

      if (body.quoteValidUntil < new Date().toISOString().slice(0, 10)) {
        return respond(
          { error: "The quotation expiry date cannot be in the past." },
          400,
        );
      }

      quoteValidUntil = body.quoteValidUntil;
    }

    const { data: supplier, error: supplierError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id, verification_status")
        .eq("id", authData.user.id)
        .maybeSingle();

    if (supplierError) {
      console.error("Supplier quotation eligibility lookup failed.");
      return respond({ error: "Unable to verify supplier approval." }, 500);
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond(
        { error: "Only approved suppliers can submit quotations." },
        403,
      );
    }

    const { data: quoteRequest, error: requestError } =
      await supabaseServer
        .from("marketplace_quote_requests")
        .select("id, product_id, supplier_id, quantity, quantity_unit, request_status, customer_name, customer_email")
        .eq("id", requestId)
        .eq("supplier_id", authData.user.id)
        .maybeSingle();

    if (requestError) {
      console.error("Supplier quote request lookup failed.");
      return respond({ error: "Unable to verify this quote request." }, 500);
    }

    if (!quoteRequest) {
      return respond(
        { error: "Quote request not found or not owned by your account." },
        404,
      );
    }

    const requestedQuantity = Number(quoteRequest.quantity);

    if (
      quoteRequest.quantity === null ||
      !Number.isFinite(requestedQuantity) ||
      requestedQuantity <= 0
    ) {
      return respond(
        { error: "This request has no valid quantity. The customer must update the request before you can quote." },
        400,
      );
    }

    const quoteAmount = Math.round(unitPrice * requestedQuantity * 100) / 100;

    if (!Number.isFinite(quoteAmount) || quoteAmount <= 0 || quoteAmount > 999999999999) {
      return respond(
        { error: "The calculated total is outside the permitted quotation amount." },
        400,
      );
    }

    if (!["new", "viewed", "quoted"].includes(quoteRequest.request_status)) {
      return respond(
        { error: "This request is no longer eligible for a quotation." },
        409,
      );
    }

    const { data: product, error: productError } =
      await supabaseServer
        .from("marketplace_products")
        .select("id, name, product_status, price_type")
        .eq("id", quoteRequest.product_id)
        .eq("supplier_id", authData.user.id)
        .maybeSingle();

    if (productError) {
      console.error("Supplier quotation product lookup failed.");
      return respond({ error: "Unable to verify the requested product." }, 500);
    }

    if (
      !product ||
      product.product_status !== "approved" ||
      product.price_type !== "quote_only"
    ) {
      return respond(
        { error: "Quotations are available only for your approved quote-only products." },
        409,
      );
    }

    const { data: existingQuote, error: existingQuoteError } =
      await supabaseServer
        .from("marketplace_supplier_quotes")
        .select("id, quote_status")
        .eq("request_id", requestId)
        .maybeSingle();

    if (existingQuoteError) {
      console.error("Existing supplier quotation lookup failed.");
      return respond({ error: "Unable to check the existing quotation." }, 500);
    }

    if (existingQuote) {
      return respond(
        {
          error: "A quotation has already been submitted for this request.",
          quoteStatus: existingQuote.quote_status,
        },
        409,
      );
    }

    const { data: quote, error: insertError } =
      await supabaseServer
        .from("marketplace_supplier_quotes")
        .insert({
          request_id: requestId,
          supplier_id: authData.user.id,
          quote_amount: quoteAmount,
          currency: "NGN",
          estimated_lead_time: estimatedLeadTime || null,
          quote_valid_until: quoteValidUntil,
          supplier_message: supplierMessage,
        })
        .select(
          "id, request_id, quote_amount, currency, estimated_lead_time, quote_valid_until, supplier_message, quote_status, created_at",
        )
        .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return respond(
          { error: "A quotation has already been submitted for this request." },
          409,
        );
      }

      console.error("Supplier quotation insert failed:", insertError.code);
      return respond({ error: "Unable to submit this quotation." }, 500);
    }

    const { error: updateRequestError } = await supabaseServer
      .from("marketplace_quote_requests")
      .update({ request_status: "quoted" })
      .eq("id", requestId)
      .eq("supplier_id", authData.user.id);

    if (updateRequestError) {
      // The quotation is already saved. Do not report the submission as failed
      // and encourage the supplier to submit it again.
      console.error("Quotation saved but request status update failed.");
    }

    // Notify the customer after saving the quotation. A notification failure
    // must not encourage the supplier to submit a duplicate quotation.
    try {
      const notification = await sendMarketplaceSupplierQuoteNotification({
        requestId: quoteRequest.id,
        quoteId: quote.id,
        productName: product.name,
        customerName: quoteRequest.customer_name,
        customerEmail: quoteRequest.customer_email,
        quoteAmount: Number(quote.quote_amount),
        currency: quote.currency.trim(),
        estimatedLeadTime: quote.estimated_lead_time,
        quoteValidUntil: quote.quote_valid_until,
        supplierMessage: quote.supplier_message,
      });

      if (!notification.success) {
        console.error(
          "Quotation saved, but customer email notification failed:",
          notification.error,
        );
      }
    } catch (notificationError) {
      console.error(
        "Quotation saved, but customer notification could not be sent.",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error.",
      );
    }

// Notify the supplier and marketplace admin after the quotation is saved.
// The existing buyer notification above remains unchanged.
    try {
      const notification = await sendMarketplaceEventNotifications({
        recipientEmails: [authData.user.email],
        subject: `Quotation submitted: ${product.name}`,
        adminSubject: "Marketplace admin alert: supplier quotation submitted",
        lines: [
          "A supplier quotation has been saved in the Samiz Tech marketplace.",
          "",
          `Request ID: ${quoteRequest.id}`,
          `Quotation ID: ${quote.id}`,
          `Product: ${product.name}`,
          `Supplier email: ${authData.user.email || "Not available"}`,
          `Buyer: ${quoteRequest.customer_name}`,
          `Buyer email: ${quoteRequest.customer_email}`,
          `Quoted total: ${quote.currency.trim()} ${Number(quote.quote_amount).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          `Estimated lead time: ${quote.estimated_lead_time || "Not specified"}`,
          `Quotation valid until: ${quote.quote_valid_until || "Not specified"}`,
          "",
          "The quotation is saved. Acceptance and payment status must be checked in the marketplace.",
        ],
      });

      if (!notification.success) {
        console.error(
          "Quotation saved, but supplier/admin notification failed:",
          notification.error,
        );
      }
    } catch (notificationError) {
      console.error(
        "Quotation saved, but supplier/admin notification could not be sent.",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error.",
      );
    }

    return respond({
      success: true,
      quote,
      message: "Your quotation has been submitted.",
    }, 201);
  } catch {
    return respond({ error: "Unable to submit this quotation." }, 500);
  }
}
