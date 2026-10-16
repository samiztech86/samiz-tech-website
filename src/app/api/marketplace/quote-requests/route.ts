import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { sendMarketplaceQuoteRequestNotification, sendMarketplaceEventNotifications } from "@/lib/email/marketplace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function textField(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return null;

  const valueTrimmed = value.trim();
  return valueTrimmed.length <= maxLength ? valueTrimmed : null;
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin) {
      return respond({ error: "Request origin is required." }, 403);
    }

    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return respond({ error: "Request origin is not allowed." }, 403);
      }
    } catch {
      return respond({ error: "Invalid request origin." }, 403);
    }

    // Link signed-in quote requests to a server-verified Supabase user.
    // Anonymous enquiries remain supported.
    let buyerId: string | null = null;

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: sessionData, error: sessionError } =
      await authClient.auth.getSession();

    if (sessionError) {
      console.error("Quote request session lookup failed.");
      return respond(
        { error: "Unable to validate your session. Please try again." },
        500,
      );
    }

    if (sessionData.session) {
      const { data: authData, error: authError } =
        await authClient.auth.getUser();

      if (authError || !authData.user) {
        return respond(
          { error: "Your session could not be verified. Please sign in again." },
          401,
        );
      }

      buyerId = authData.user.id;
    }
    const contentType = request.headers.get("content-type") ?? "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return respond({ error: "Expected a JSON request." }, 415);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond({ error: "Invalid request body." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid request body." }, 400);
    }

    const input = body as Record<string, unknown>;

    // Honeypot field for basic bot filtering. The form must keep this field hidden.
    const honeypot = textField(input.website, 200);

    if (honeypot === null) {
      return respond({ error: "Invalid form submission." }, 400);
    }

    if (honeypot.length > 0) {
      return respond({ success: true, message: "Your request has been received." }, 201);
    }

    const productId =
      typeof input.productId === "string" ? input.productId.trim() : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId,
      )
    ) {
      return respond({ error: "Please select a valid supplier product." }, 400);
    }

    const customerName = textField(input.customerName, 120);
    const customerEmail = textField(input.customerEmail, 254);
    const customerPhone = textField(input.customerPhone, 40);
    const organizationName = textField(input.organizationName, 160);
    const quantityUnit = textField(input.quantityUnit, 40);
    const deliveryLocation = textField(input.deliveryLocation, 250);
    const customerMessage = textField(input.customerMessage, 5000);

    if (
      customerName === null ||
      customerEmail === null ||
      customerPhone === null ||
      organizationName === null ||
      quantityUnit === null ||
      deliveryLocation === null ||
      customerMessage === null
    ) {
      return respond(
        { error: "One or more fields are invalid or exceed the allowed length." },
        400,
      );
    }

    const email = customerEmail.toLowerCase();

    if (customerName.length < 2) {
      return respond({ error: "Please enter your full name." }, 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return respond({ error: "Please enter a valid email address." }, 400);
    }

    if (customerPhone.length < 7) {
      return respond({ error: "Please enter a valid phone number." }, 400);
    }

    let quantity: number | null = null;

    if (input.quantity !== undefined && input.quantity !== null && input.quantity !== "") {
      const parsedQuantity =
        typeof input.quantity === "number" || typeof input.quantity === "string"
          ? Number(input.quantity)
          : Number.NaN;

      if (
        !Number.isFinite(parsedQuantity) ||
        parsedQuantity <= 0 ||
        parsedQuantity > 1_000_000_000 ||
        !/^\d+(?:\.\d{1,3})?$/.test(String(input.quantity).trim())
      ) {
        return respond({ error: "Quantity must be a positive number." }, 400);
      }

      quantity = parsedQuantity;
    }

    if (quantity !== null && !quantityUnit) {
      return respond({ error: "Please select a unit for the requested quantity." }, 400);
    }

    const { data: product, error: productError } = await supabaseServer
      .from("marketplace_products")
      .select("id, supplier_id, product_status, name, price_type, is_available, is_listed")
      .eq("id", productId)
      .eq("product_status", "approved")
      .maybeSingle();

    if (productError) {
      console.error("Quote request product lookup failed.");
      return respond({ error: "Unable to validate this product. Please try again." }, 500);
    }

    if (!product) {
      return respond(
        { error: "This product is no longer available for quote requests." },
        404,
      );
    }

    if (
      product.price_type !== "quote_only" ||
      product.is_available === false ||
      product.is_listed === false
    ) {
      return respond(
        { error: "This product is not currently accepting quote requests." },
        409,
      );
    }

    const { data: supplier, error: supplierError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status")
      .eq("id", product.supplier_id)
      .eq("verification_status", "approved")
      .maybeSingle();

    if (supplierError) {
      console.error("Quote request supplier verification failed.");
      return respond({ error: "Unable to validate the supplier. Please try again." }, 500);
    }

    if (!supplier) {
      return respond(
        { error: "This supplier is not currently approved to receive enquiries." },
        409,
      );
    }

    const { data: quoteRequest, error: insertError } = await supabaseServer
      .from("marketplace_quote_requests")
      .insert({
        buyer_id: buyerId,
        product_id: product.id,
        supplier_id: supplier.id,
        customer_name: customerName,
        customer_email: email,
        customer_phone: customerPhone,
        organization_name: organizationName || null,
        quantity,
        quantity_unit: quantityUnit || null,
        delivery_location: deliveryLocation || null,
        customer_message: customerMessage || null,
        request_status: "new",
      })
      .select("id")
      .single();

    if (insertError || !quoteRequest) {
      console.error("Marketplace quote request insert failed.");
      return respond(
        { error: "We could not submit your enquiry. Please try again." },
        500,
      );
    }

    // Notify the supplier after the request is saved. Email failure must not
    // make the customer resubmit a request that already exists.
    try {
      const { data: supplierAuthData, error: supplierAuthError } =
        await supabaseServer.auth.admin.getUserById(supplier.id);

      const supplierEmail = supplierAuthData.user?.email;

      if (supplierAuthError || !supplierEmail) {
        console.error(
          "Quote request saved, but supplier email lookup failed.",
          supplierAuthError?.message ?? "Supplier email unavailable.",
        );
      } else {
        const notification = await sendMarketplaceQuoteRequestNotification({
          requestId: quoteRequest.id,
          productName: product.name,
          supplierEmail,
          customerName,
          customerEmail: email,
          customerPhone,
          organizationName,
          quantity,
          quantityUnit,
          deliveryLocation,
          customerMessage,
        });

        if (!notification.success) {
          console.error(
            "Quote request saved, but supplier email notification failed:",
            notification.error,
          );
        }
      }
    } catch (notificationError) {
      console.error(
        "Quote request saved, but supplier notification could not be sent.",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error.",
      );
    }

    // Send buyer confirmation and admin alert after the request is persisted.
    // Notification failure must not cause the buyer to resubmit the request.
    try {
      const notification = await sendMarketplaceEventNotifications({
        recipientEmails: [email],
        subject: `Quote request submitted: ${product.name}`,
        adminSubject: "Marketplace admin alert: new quote request",
        lines: [
          "A new marketplace quote request has been saved.",
          "",
          `Request ID: ${quoteRequest.id}`,
          `Product: ${product.name}`,
          `Buyer: ${customerName}`,
          `Buyer email: ${email}`,
          `Buyer phone: ${customerPhone}`,
          `Organization: ${organizationName || "Not provided"}`,
          `Quantity: ${quantity} ${quantityUnit || ""}`.trim(),
          `Delivery location: ${deliveryLocation || "Not provided"}`,
          `Buyer message: ${customerMessage || "Not provided"}`,
          "",
          "Review the request in the Samiz Tech marketplace dashboard.",
        ],
      });

      if (!notification.success) {
        console.error(
          "Quote request saved, but buyer/admin notification failed:",
          notification.error,
        );
      }
    } catch (notificationError) {
      console.error(
        "Quote request saved, but buyer/admin notification could not be sent.",
        notificationError instanceof Error
          ? notificationError.message
          : "Unknown notification error.",
      );
    }

    return respond(
      {
        success: true,
        requestId: quoteRequest.id,
        message: "Your quote request has been submitted.",
      },
      201,
    );
  } catch {
    console.error("Unexpected marketplace quote request failure.");
    return respond(
      { error: "Unable to submit your enquiry right now. Please try again." },
      500,
    );
  }
}
