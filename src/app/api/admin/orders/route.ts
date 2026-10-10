import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const { data, error } = await supabaseServer
      .from("engineering_orders")
      .select(
        [
          "id",
          "customer_name",
          "customer_email",
          "customer_phone",
          "service_type",
          "property_type",
          "property_location",
          "assessment_details",
          "amount_kobo",
          "currency",
          "payment_reference",
          "payment_status",
          "order_status",
          "created_at",
          "paid_at",
          "updated_at",
        ].join(", "),
      )
      .eq("service_type", "remote_energy_assessment")
      .eq("payment_status", "paid")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin order-list query failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load assessment orders." },
        {
          status: 500,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return NextResponse.json(
      { orders: data ?? [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(
      "Admin order-list request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to load assessment orders." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}