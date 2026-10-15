import "server-only";

import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Authentication required." }, 401);
    }

    // Scope every request to the identity verified by Supabase.
    const { data: requests, error: requestsError } = await supabaseServer
      .from("marketplace_quote_requests")
      .select(
        "id, product_id, supplier_id, customer_name, customer_email, organization_name, quantity, quantity_unit, delivery_location, customer_message, request_status, accepted_quote_id, created_at, updated_at",
      )
      .eq("buyer_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Buyer quote request lookup failed.");
      return respond(
        { error: "Unable to load your quote requests. Please try again." },
        500,
      );
    }

    if (!requests || requests.length === 0) {
      return respond({ quotes: [] });
    }

    const requestIds = requests.map((item) => item.id);
    const productIds = [...new Set(requests.map((item) => item.product_id))];
    const supplierIds = [...new Set(requests.map((item) => item.supplier_id))];

    const [supplierQuotesResult, productsResult, suppliersResult, ordersResult] =
      await Promise.all([
        supabaseServer
          .from("marketplace_supplier_quotes")
          .select(
            "id, request_id, supplier_id, quote_amount, currency, estimated_lead_time, quote_valid_until, supplier_message, quote_status, created_at, updated_at",
          )
          .in("request_id", requestIds),
        supabaseServer
          .from("marketplace_products")
          .select(
            "id, name, brand, model_number, image_urls, price_type, indicative_price, currency",
          )
          .in("id", productIds),
        supabaseServer
          .from("marketplace_supplier_profiles")
          .select("id, business_name")
          .in("id", supplierIds),
        supabaseServer
          .from("marketplace_orders")
          .select("id, quote_request_id, quote_id, payment_status, subtotal_kobo, quoted_total_kobo, created_at, fulfilment_status, fulfilment_updated_at, dispatched_at, delivered_at")
          .in("quote_request_id", requestIds),
      ]);


    if (
      supplierQuotesResult.error ||
      productsResult.error ||
      suppliersResult.error || ordersResult.error
    ) {
      console.error("Buyer quote details lookup failed.");
      return respond(
        { error: "Unable to load quote details. Please try again." },
        500,
      );
    }

    const quotesByRequest = new Map(
      (supplierQuotesResult.data ?? []).map((quote) => [
        quote.request_id,
        quote,
      ]),
    );
    const productsById = new Map(
      (productsResult.data ?? []).map((product) => [product.id, product]),
    );
    const suppliersById = new Map(
      (suppliersResult.data ?? []).map((supplier) => [
        supplier.id,
        supplier,
      ]),
    );

    const ordersByQuoteId = new Map(
      (ordersResult.data ?? []).map((order) => [order.quote_id, order]),
    );
    const result = requests.map((requestItem) => ({
      ...requestItem,
      product: productsById.get(requestItem.product_id) ?? null,
      supplier: suppliersById.get(requestItem.supplier_id) ?? null,
      quote: quotesByRequest.get(requestItem.id) ?? null,
      order: requestItem.accepted_quote_id
        ? ordersByQuoteId.get(requestItem.accepted_quote_id) ?? null
        : null,
      isAccepted: requestItem.accepted_quote_id !== null,
    }));

    return respond({ quotes: result });
  } catch {
    console.error("Unexpected buyer quote history failure.");
    return respond(
      { error: "Unable to load your quote history. Please try again." },
      500,
    );
  }
}
