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

    const { data: orders, error: ordersError } = await supabaseServer
      .from("marketplace_orders")
      .select(
        "id, buyer_id, product_id, supplier_id, product_name, quantity, unit_price_kobo, subtotal_kobo, currency, payment_status, paystack_reference, created_at, quote_request_id, quote_id, quoted_total_kobo, fulfilment_status, fulfilment_updated_at, dispatched_at, delivered_at",
      )
      .eq("buyer_id", authData.user.id)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Buyer orders lookup failed.");
      return respond(
        { error: "Unable to load your orders. Please try again." },
        500,
      );
    }

    if (!orders || orders.length === 0) {
      return respond({ orders: [] });
    }

    const supplierIds = [
      ...new Set(orders.map((order) => order.supplier_id)),
    ];

    const { data: suppliers, error: suppliersError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, business_name")
      .in("id", supplierIds);

    if (suppliersError) {
      console.error("Buyer order supplier lookup failed.");
      return respond(
        { error: "Unable to load order details. Please try again." },
        500,
      );
    }

    const suppliersById = new Map(
      (suppliers ?? []).map((supplier) => [supplier.id, supplier]),
    );

    return respond({
      orders: orders.map((order) => ({
        ...order,
        order_type: order.quote_id ? "quotation" : "fixed_price",
        supplier: suppliersById.get(order.supplier_id) ?? null,
      })),
    });
  } catch {
    console.error("Unexpected buyer orders failure.");
    return respond(
      { error: "Unable to load your orders. Please try again." },
      500,
    );
  }
}
