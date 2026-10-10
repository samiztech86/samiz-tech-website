import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  hashTrackingToken,
  isValidTrackingToken,
  isValidSignedAssessmentTrackingLink,
} from "@/lib/engineering-orders/tracking";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const token = params.get("token") ?? "";
    const orderId = params.get("orderId") ?? "";
    const expires = params.get("expires") ?? "";
    const signature = params.get("sig") ?? "";

    const validToken = isValidTrackingToken(token);
    const validSignedLink = !validToken &&
      isValidSignedAssessmentTrackingLink(orderId, expires, signature);

    if (!validToken && !validSignedLink) {
      return NextResponse.json(
        { error: "A valid tracking link is required." },
        {
          status: 400,
          headers: {
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }

    const columns =
      "service_type, payment_status, order_status, created_at, updated_at, paid_at, delivered_at";

    const tokenLookup = validToken
      ? await supabaseServer
          .from("engineering_orders")
          .select(columns)
          .eq("tracking_token_hash", hashTrackingToken(token))
          .maybeSingle()
      : null;

    const signedLookup = validSignedLink
      ? await supabaseServer
          .from("engineering_orders")
          .select(columns)
          .eq("id", orderId)
          .maybeSingle()
      : null;

    const order = tokenLookup?.data ?? signedLookup?.data ?? null;
    const error = tokenLookup?.error ?? signedLookup?.error ?? null;

    if (error) {
      console.error("Assessment tracking lookup failed:", error.message);

      return NextResponse.json(
        { error: "Unable to retrieve assessment status." },
        {
          status: 500,
          headers: {
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }

    if (
      !order ||
      order.service_type !== "remote_energy_assessment" ||
      order.payment_status !== "paid"
    ) {
      return NextResponse.json(
        { error: "Assessment tracking link is invalid or unavailable." },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderStatus: order.order_status,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        paidAt: order.paid_at,
        deliveredAt: order.delivered_at,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  } catch (error) {
    console.error(
      "Assessment tracking request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to retrieve assessment status." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
        },
      },
    );
  }
}
