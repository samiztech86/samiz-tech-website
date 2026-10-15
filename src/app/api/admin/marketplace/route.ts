import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: responseHeaders },
      );
    }

    const [supplierResult, productResult, orderResult] = await Promise.all([
      supabaseServer
        .from("marketplace_supplier_profiles")
        .select(
          [
            "id",
            "business_name",
            "contact_name",
            "contact_email",
            "contact_phone",
            "business_address",
            "website_url",
            "verification_status",
            "admin_review_note",
            "created_at",
            "updated_at",
          ].join(", "),
        )
        .order("created_at", { ascending: false })
        .limit(100),

      supabaseServer
        .from("marketplace_products")
        .select(
          [
            "id",
            "supplier_id",
            "name",
            "slug",
            "category",
            "description",
            "brand",
            "model_number",
            "image_urls",
            "price_type",
            "indicative_price",
            "currency",
            "product_status",
            "admin_review_note",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
          ].join(", "),
        )
        .order("created_at", { ascending: false })
        .limit(100),

      supabaseServer
        .from("marketplace_orders")
        .select("id, product_id, supplier_id, product_name, quantity, unit_price_kobo, subtotal_kobo, commission_kobo, supplier_amount_kobo, currency, customer_name, customer_email, customer_phone, payment_status, paystack_reference, paystack_transaction_id, paid_at, created_at, updated_at, quote_request_id, quote_id, quoted_total_kobo, fulfilment_status, fulfilment_updated_at, dispatched_at, delivered_at, settlement_status, settlement_reference, settlement_evidence_note, settlement_verified_at, settlement_verified_by",
        )
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (supplierResult.error || productResult.error || orderResult.error) {
      console.error("Admin marketplace queue query failed:", {
        suppliers: supplierResult.error?.message,
        products: productResult.error?.message,
        orders: orderResult.error?.message,
      });

      return NextResponse.json(
        { error: "Unable to load marketplace review queues." },
        { status: 500, headers: responseHeaders },
      );
    }

    const orderIds = (orderResult.data ?? []).map((order) => order.id);

    let auditEvents: {
      id: string;
      order_id: string;
      event_type: string;
      previous_status: string | null;
      new_status: string;
      actor_role: string;
      note: string | null;
      evidence_reference: string | null;
      created_at: string;
    }[] = [];

    if (orderIds.length > 0) {
      const auditResult = await supabaseServer
        .from("marketplace_order_status_events")
        .select(
          "id, order_id, event_type, previous_status, new_status, actor_role, note, evidence_reference, created_at",
        )
        .in("order_id", orderIds)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (auditResult.error) {
        console.error("Admin marketplace audit query failed:", auditResult.error.message);

        return NextResponse.json(
          { error: "Unable to load marketplace order audit history." },
          { status: 500, headers: responseHeaders },
        );
      }

      auditEvents = auditResult.data ?? [];
    }

    return NextResponse.json(
      {
        suppliers: supplierResult.data ?? [],
        products: productResult.data ?? [],
        orders: orderResult.data ?? [],
        auditEvents,
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Admin marketplace queue request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to load marketplace review queues." },
      { status: 500, headers: responseHeaders },
    );
  }
}
