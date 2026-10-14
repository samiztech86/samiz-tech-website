import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
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

    const user = authData.user;

    if (authError || !user) {
      return response({ error: "Please sign in to access your supplier dashboard." }, 401);
    }

    const { data: existingProfile, error: profileError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id, business_name, contact_name, contact_email, contact_phone, verification_status, payout_status, payout_bank_name, payout_account_name, payout_account_last4, created_at")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError) {
      console.error("Supplier profile query failed:", profileError.message);
      return response({ error: "Unable to load your supplier profile." }, 500);
    }

    let profile = existingProfile;

    // Registration metadata is untrusted. New profiles are always pending.
    if (!profile) {
      const metadata = user.user_metadata ?? {};
      const businessName =
        typeof metadata.business_name === "string"
          ? metadata.business_name.trim()
          : "";
      const contactName =
        typeof metadata.full_name === "string"
          ? metadata.full_name.trim()
          : "";
      const contactPhone =
        typeof metadata.phone === "string" ? metadata.phone.trim() : "";
      const contactEmail = user.email?.trim() ?? "";

      if (
        businessName.length >= 2 &&
        businessName.length <= 160 &&
        contactName.length >= 2 &&
        contactName.length <= 120 &&
        contactPhone.length >= 7 &&
        contactPhone.length <= 40 &&
        contactEmail.length >= 3 &&
        contactEmail.length <= 254
      ) {
        const { data: createdProfile, error: createError } =
          await supabaseServer
            .from("marketplace_supplier_profiles")
            .insert({
              id: user.id,
              business_name: businessName,
              contact_name: contactName,
              contact_email: contactEmail,
              contact_phone: contactPhone,
              verification_status: "pending",
            })
            .select("id, business_name, contact_name, contact_email, contact_phone, verification_status, payout_status, payout_bank_name, payout_account_name, payout_account_last4, created_at")
            .single();

        if (createError) {
          console.error("Supplier profile creation failed:", createError.message);
          return response({ error: "Unable to initialise your supplier profile." }, 500);
        }

        profile = createdProfile;
      }
    }

    if (!profile) {
      return response({
        profile: null,
        products: [],
        requests: [],
        message: "Your supplier profile needs complete registration details. Please contact Samiz support.",
      });
    }

    const { data: products, error: productsError } = await supabaseServer
      .from("marketplace_products")
      .select("id, name, category, description, brand, model_number, price_type, indicative_price, currency, product_status, is_available, is_listed, image_urls, created_at")
      .eq("supplier_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (productsError) {
      console.error("Supplier product query failed:", productsError.message);
      return response({ error: "Unable to load your products." }, 500);
    }

    let requests: Array<Record<string, unknown>> = [];

    if (profile.verification_status === "approved" && products?.length) {
      const productIds = products
        .filter((product) => product.product_status === "approved")
        .map((product) => product.id);

      if (productIds.length === 0) {
        return response({
          profile,
          products: products ?? [],
          requests: [],
          message: null,
        });
      }

      const { data: requestRows, error: requestsError } =
        await supabaseServer
          .from("marketplace_quote_requests")
          .select("id, product_id, organization_name, quantity, quantity_unit, delivery_location, customer_message, request_status, created_at")
          .in("product_id", productIds)
          .in("request_status", ["new", "viewed", "quoted"])
          .order("created_at", { ascending: false })
          .limit(100);

      if (requestsError) {
        console.error("Supplier request query failed:", requestsError.message);
        return response({ error: "Unable to load available quote requests." }, 500);
      }

      requests = requestRows ?? [];
    }

    return response({
      profile,
      products: products ?? [],
      requests,
      message:
        profile.verification_status === "approved"
          ? null
          : "Your supplier account is awaiting approval. Product enquiries will be available after approval.",
    });
  } catch (error) {
    console.error(
      "Supplier dashboard failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return response({ error: "Unable to load the supplier dashboard." }, 500);
  }
}

