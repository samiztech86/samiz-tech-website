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

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (origin) {
      if (!appUrl) {
        return respond({ error: "Marketplace origin validation is not configured." }, 500);
      }

      try {
        if (new URL(origin).origin !== new URL(appUrl).origin) {
          return respond({ error: "Request origin is not allowed." }, 403);
        }
      } catch {
        return respond({ error: "Request origin is invalid." }, 403);
      }
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } = await authClient.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      return respond({ error: "Please sign in to manage your listings." }, 401);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return respond({ error: "A valid JSON request body is required." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid listing update." }, 400);
    }

    const input = body as Record<string, unknown>;
    const productId = typeof input.productId === "string" ? input.productId.trim() : "";
    const field = input.field;
    const value = input.value;

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(productId)) {
      return respond({ error: "A valid product ID is required." }, 400);
    }

    if (field !== "is_available" && field !== "is_listed") {
      return respond({ error: "Only stock availability and listing visibility can be changed." }, 400);
    }

    if (typeof value !== "boolean") {
      return respond({ error: "The listing setting must be true or false." }, 400);
    }

    const { data: supplier, error: supplierError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status")
      .eq("id", user.id)
      .maybeSingle();

    if (supplierError) {
      console.error("Marketplace listing management: supplier lookup failed.");
      return respond({ error: "Unable to verify supplier status." }, 500);
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond({ error: "Only approved suppliers can manage approved listings." }, 403);
    }

    const update = field === "is_available"

      ? { is_available: value }

      : { is_listed: value };

    const { data: product, error: updateError } = await supabaseServer
      .from("marketplace_products")
      .update(update)
      .eq("id", productId)
      .eq("supplier_id", user.id)
      .eq("product_status", "approved")
      .select("id, name, is_available, is_listed")
      .maybeSingle();

    if (updateError) {
      console.error("Marketplace listing management: update failed.");
      return respond({ error: "Unable to update this listing." }, 500);
    }

    if (!product) {
      return respond({ error: "Approved listing not found for this supplier." }, 404);
    }

    return respond({
      success: true,
      product,
      message: field === "is_available"
        ? (value ? "Product marked in stock." : "Product marked out of stock.")
        : (value ? "Listing restored to the marketplace." : "Listing hidden from the marketplace."),
    });
  } catch {
    console.error("Unexpected marketplace listing management failure.");
    return respond({ error: "Unable to update this listing right now." }, 500);
  }
}