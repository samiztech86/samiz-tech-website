import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";
import { createAdminNotification } from "@/lib/admin/notifications";

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

    if (!origin || origin !== new URL(request.url).origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Authentication required." }, 401);
    }

    const body = (await request.json().catch(() => null)) as
      | { productId?: unknown }
      | null;

    const productId =
      typeof body?.productId === "string" ? body.productId : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        productId,
      )
    ) {
      return respond({ error: "A valid product ID is required." }, 400);
    }

    const { data: supplier, error: supplierError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id, verification_status, business_name, contact_name")
        .eq("id", authData.user.id)
        .maybeSingle();

    if (supplierError) {
      console.error("Supplier submission eligibility lookup failed.");
      return respond({ error: "Unable to verify supplier approval." }, 500);
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond(
        { error: "Only approved suppliers can submit products for review." },
        403,
      );
    }

    const { data: product, error: updateError } = await supabaseServer
      .from("marketplace_products")
      .update({ product_status: "submitted" })
      .eq("id", productId)
      .eq("supplier_id", authData.user.id)
      .eq("product_status", "draft")
      .select("id, name, product_status")
      .maybeSingle();

    if (updateError) {
      console.error("Product draft submission failed.");
      return respond({ error: "Unable to submit this product." }, 500);
    }

    if (!product) {
      return respond(
        {
          error:
            "Draft not found, not owned by your account, or no longer a draft. Refresh your listings.",
        },
        409,
      );
    }

    await createAdminNotification({
      eventType: "product_submitted",
      title: "Marketplace product submitted for review",
      message: `The product "${product.name}" was submitted for admin review by ${supplier.business_name || supplier.contact_name || "a supplier"}.`,
      entityType: "product",
      entityId: product.id,
      metadata: {
        productName: product.name,
        supplierId: supplier.id,
        supplierBusinessName: supplier.business_name,
      },
      emailSubject: "Marketplace product submitted for review",
      emailLines: [
        "A supplier has submitted a product for admin review.",
        `Product: ${product.name}`,
        `Product reference: ${product.id}`,
        `Supplier: ${supplier.business_name || supplier.contact_name || "Not provided"}`,
        `Supplier reference: ${supplier.id}`,
        "Please review the product in the admin marketplace dashboard.",
      ],
    });

    return respond({
      success: true,
      product,
      message: "Product submitted for admin review.",
    });
  } catch {
    return respond({ error: "Unable to submit this product for review." }, 500);
  }
}
