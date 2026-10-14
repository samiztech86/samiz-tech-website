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

    const [supplierResult, productResult] = await Promise.all([
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
    ]);

    if (supplierResult.error || productResult.error) {
      console.error("Admin marketplace queue query failed:", {
        suppliers: supplierResult.error?.message,
        products: productResult.error?.message,
      });

      return NextResponse.json(
        { error: "Unable to load marketplace review queues." },
        { status: 500, headers: responseHeaders },
      );
    }

    return NextResponse.json(
      {
        suppliers: supplierResult.data ?? [],
        products: productResult.data ?? [],
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
