import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store",
};

type ModerationRequest = {
  entity: "supplier" | "product";
  id: string;
  action: "approve" | "reject";
  note?: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: responseHeaders },
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return jsonError("Authentication required.", 401);
    }

    const origin = request.headers.get("origin");

    if (!origin || origin !== new URL(request.url).origin) {
      return jsonError("Cross-origin request rejected.", 403);
    }

    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    ) {
      return jsonError("Content-Type must be application/json.", 415);
    }

    let body: ModerationRequest;

    try {
      body = (await request.json()) as ModerationRequest;
    } catch {
      return jsonError("Invalid JSON request body.", 400);
    }

    if (
      !body ||
      typeof body !== "object" ||
      !["supplier", "product"].includes(body.entity) ||
      !["approve", "reject"].includes(body.action) ||
      typeof body.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.id,
      )
    ) {
      return jsonError("Invalid moderation request.", 400);
    }

    const note =
      typeof body.note === "string" ? body.note.trim() : "";

    if (body.note !== undefined && typeof body.note !== "string") {
      return jsonError("The review note must be text.", 400);
    }

    if (note.length > 1000) {
      return jsonError("The review note cannot exceed 1000 characters.", 400);
    }

    if (body.action === "reject" && !note) {
      return jsonError("A reason is required when rejecting a submission.", 400);
    }

    const nextStatus = body.action === "approve" ? "approved" : "rejected";

    if (body.entity === "supplier") {
      const { data, error } = await supabaseAdmin
        .from("marketplace_supplier_profiles")
        .update({
          verification_status: nextStatus,
          admin_review_note: note || null,
        })
        .eq("id", body.id)
        .eq("verification_status", "pending")
        .select("id, business_name, verification_status, admin_review_note")
        .maybeSingle();

      if (error) {
        console.error("Supplier moderation failed:", error.message);
        return jsonError("Unable to update supplier status.", 500);
      }

      if (!data) {
        return jsonError(
          "Supplier not found, or it is no longer pending review. Refresh the queue.",
          409,
        );
      }

      return NextResponse.json(
        { success: true, entity: "supplier", record: data },
        { headers: responseHeaders },
      );
    }

    if (body.action === "approve") {
      const { data: product, error: productLookupError } =
        await supabaseAdmin
          .from("marketplace_products")
          .select("id, supplier_id, product_status")
          .eq("id", body.id)
          .maybeSingle();

      if (productLookupError) {
        console.error(
          "Product moderation lookup failed:",
          productLookupError.message,
        );
        return jsonError("Unable to verify product eligibility.", 500);
      }

      if (!product || product.product_status !== "submitted") {
        return jsonError(
          "Product not found, or it is no longer submitted for review. Refresh the queue.",
          409,
        );
      }

      const { data: supplier, error: supplierLookupError } =
        await supabaseAdmin
          .from("marketplace_supplier_profiles")
          .select("verification_status")
          .eq("id", product.supplier_id)
          .maybeSingle();

      if (supplierLookupError) {
        console.error(
          "Product supplier eligibility check failed:",
          supplierLookupError.message,
        );
        return jsonError("Unable to verify supplier eligibility.", 500);
      }

      if (supplier?.verification_status !== "approved") {
        return jsonError(
          "Approve the supplier before approving its products.",
          409,
        );
      }
    }

    const { data, error } = await supabaseAdmin
      .from("marketplace_products")
      .update({
        product_status: nextStatus,
        admin_review_note: note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("product_status", "submitted")
      .select("id, name, supplier_id, product_status, admin_review_note, reviewed_at")
      .maybeSingle();

    if (error) {
      console.error("Product moderation failed:", error.message);
      return jsonError("Unable to update product status.", 500);
    }

    if (!data) {
      return jsonError(
        "Product is no longer submitted for review. Refresh the queue.",
        409,
      );
    }

    return NextResponse.json(
      { success: true, entity: "product", record: data },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Marketplace moderation request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return jsonError("Unable to process the moderation request.", 500);
  }
}
