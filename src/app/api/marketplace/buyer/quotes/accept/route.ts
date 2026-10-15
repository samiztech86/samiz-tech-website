import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function mapAcceptanceError(message: string): {
  message: string;
  status: number;
} | null {
  const normalized = message.toLowerCase();

  if (normalized.includes("quote request not found")) {
    return {
      message: "Quote request not found for this buyer.",
      status: 404,
    };
  }

  if (
    normalized.includes("does not belong to this request") ||
    normalized.includes("does not belong to the selected request")
  ) {
    return {
      message: "This quotation does not belong to the selected request.",
      status: 404,
    };
  }

  if (normalized.includes("expired")) {
    return {
      message:
        "This quotation has expired. Contact the supplier for an updated quote.",
      status: 409,
    };
  }

  if (
    normalized.includes("amount or currency") ||
    normalized.includes("invalid amount") ||
    normalized.includes("invalid currency")
  ) {
    return {
      message: "This quotation has an invalid amount or currency.",
      status: 409,
    };
  }

  if (
    normalized.includes("no longer available") ||
    normalized.includes("only a sent quotation") ||
    normalized.includes("changed before acceptance") ||
    normalized.includes("already accepted") ||
    normalized.includes("quotation changed")
  ) {
    return {
      message:
        "This request or quotation is no longer available for acceptance. Refresh and try again.",
      status: 409,
    };
  }

  return null;
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

    const body = (await request.json().catch(() => null)) as {
      requestId?: unknown;
      quoteId?: unknown;
    } | null;

    const requestId =
      typeof body?.requestId === "string" ? body.requestId.trim() : "";
    const quoteId =
      typeof body?.quoteId === "string" ? body.quoteId.trim() : "";

    if (!UUID_PATTERN.test(requestId) || !UUID_PATTERN.test(quoteId)) {
      return respond(
        { error: "Valid quote request and quotation IDs are required." },
        400,
      );
    }

    const { data, error } = await supabaseServer.rpc(
      "accept_marketplace_quote",
      {
        p_request_id: requestId,
        p_quote_id: quoteId,
        p_buyer_id: authData.user.id,
      },
    );

    if (error) {
      const mapped = mapAcceptanceError(error.message ?? "");

      if (mapped) {
        return respond({ error: mapped.message }, mapped.status);
      }

      console.error(
        "Buyer quote acceptance: database function failed.",
        { code: error.code ?? "unknown" },
      );

      return respond(
        { error: "Unable to accept this quotation. Please refresh and try again." },
        500,
      );
    }

    const result = data as {
      success?: unknown;
      alreadyAccepted?: unknown;
      message?: unknown;
    } | null;

    if (!result || result.success !== true) {
      console.error(
        "Buyer quote acceptance: database function returned an unexpected result.",
      );

      return respond(
        { error: "Unable to confirm quotation acceptance. Refresh and check the quotation status." },
        500,
      );
    }

    const alreadyAccepted = result.alreadyAccepted === true;

    return respond({
      success: true,
      requestId,
      quoteId,
      accepted: true,
      alreadyAccepted,
      message: alreadyAccepted
        ? "This quotation has already been accepted."
        : "Quotation accepted. You can now proceed to payment.",
    });
  } catch {
    console.error("Unexpected buyer quote acceptance failure.");

    return respond(
      { error: "Unable to accept this quotation. Please try again." },
      500,
    );
  }
}
