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

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ALLOWED_STATUSES = new Set([
  "processing",
  "ready_to_dispatch",
  "dispatched",
  "delivered",
  "issue_reported",
]);

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (origin) {
      if (!appUrl) {
        return respond(
          { error: "Marketplace origin validation is not configured." },
          500,
        );
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
    const { data: authData, error: authError } =
      await authClient.auth.getUser();
    const user = authData.user;

    if (authError || !user) {
      return respond(
        { error: "Please sign in to update order fulfilment." },
        401,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond({ error: "A valid JSON request body is required." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid fulfilment update." }, 400);
    }

    const input = body as Record<string, unknown>;
    const orderId =
      typeof input.orderId === "string" ? input.orderId.trim() : "";
    const status = input.status;
    const note =
      typeof input.note === "string" ? input.note.trim() : "";

    if (!UUID_PATTERN.test(orderId)) {
      return respond({ error: "A valid order ID is required." }, 400);
    }

    if (typeof status !== "string" || !ALLOWED_STATUSES.has(status)) {
      return respond({ error: "A valid fulfilment status is required." }, 400);
    }

    if (typeof input.note !== "undefined" && typeof input.note !== "string") {
      return respond({ error: "The fulfilment note must be text." }, 400);
    }

    if (note.length > 1000) {
      return respond(
        { error: "The fulfilment note must not exceed 1000 characters." },
        400,
      );
    }

    const { data, error } = await supabaseServer.rpc(
      "update_marketplace_supplier_fulfilment",
      {
        p_order_id: orderId,
        p_supplier_id: user.id,
        p_new_status: status,
        p_note: note || null,
      },
    );

    if (error) {
      if (error.code === "P0002") {
        return respond(
          { error: "Order not found for this supplier." },
          404,
        );
      }

      if (error.code === "42501") {
        return respond(
          { error: "An approved supplier account is required." },
          403,
        );
      }

      if (error.code === "P0001") {
        return respond(
          { error: "Only paid orders can enter fulfilment." },
          409,
        );
      }

      if (error.code === "22023") {
        return respond(
          { error: error.message || "This fulfilment update is invalid." },
          400,
        );
      }

      console.error(
        "Supplier fulfilment update failed:",
        error.code ?? "unknown database error",
      );
      return respond(
        { error: "Unable to update order fulfilment right now." },
        500,
      );
    }

    return respond({
      success: true,
      fulfilment: data,
      message: "Order fulfilment status updated.",
    });
  } catch {
    console.error("Unexpected supplier fulfilment endpoint failure.");
    return respond(
      { error: "Unable to update order fulfilment right now." },
      500,
    );
  }
}
