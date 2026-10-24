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
      return respond(
        { error: "Please sign in to view your advertising campaigns." },
        401,
      );
    }

    const { data: supplier, error: supplierError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (supplierError) {
      console.error("Advertising campaigns: supplier lookup failed.");
      return respond(
        { error: "Unable to verify supplier access." },
        500,
      );
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond(
        { error: "Only approved suppliers can view advertising campaigns." },
        403,
      );
    }

    const { data: campaigns, error: campaignsError } = await supabaseServer
      .from("marketplace_ad_campaigns")
      .select(
        "id, package_id, package_name, amount_kobo, currency, placement, headline, payment_status, campaign_status, paystack_reference, paid_at, starts_at, ends_at, admin_review_note, created_at",
      )
      .eq("supplier_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (campaignsError) {
      console.error("Advertising campaigns: campaign query failed.");
      return respond(
        { error: "Unable to load advertising campaigns." },
        500,
      );
    }

    return respond({ success: true, campaigns: campaigns ?? [] });
  } catch {
    console.error("Unexpected advertising campaign-history failure.");
    return respond(
      { error: "Unable to load advertising campaigns." },
      500,
    );
  }
}
