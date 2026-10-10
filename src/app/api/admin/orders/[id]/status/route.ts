import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: responseHeaders },
      );
    }

    const { id } = await context.params;

    if (!id || id.length > 100) {
      return NextResponse.json(
        { error: "A valid order ID is required." },
        { status: 400, headers: responseHeaders },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "A valid JSON request body is required." },
        { status: 400, headers: responseHeaders },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      (body.status !== "in_progress" && body.status !== "delivered")
    ) {
      return NextResponse.json(
        { error: "Status must be in_progress or delivered." },
        { status: 400, headers: responseHeaders },
      );
    }

    const nextStatus = body.status;

    const { data: order, error: lookupError } = await supabaseServer
      .from("engineering_orders")
      .select("id, service_type, payment_status, order_status")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin order-status lookup failed:", lookupError.message);

      return NextResponse.json(
        { error: "Unable to retrieve the order." },
        { status: 500, headers: responseHeaders },
      );
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404, headers: responseHeaders },
      );
    }

    if (
      order.service_type !== "remote_energy_assessment" ||
      order.payment_status !== "paid"
    ) {
      return NextResponse.json(
        { error: "Only paid remote energy assessment orders can be updated here." },
        { status: 409, headers: responseHeaders },
      );
    }

    const validTransition =
      (order.order_status === "queued" && nextStatus === "in_progress") ||
      (order.order_status === "in_progress" && nextStatus === "delivered");

    if (!validTransition) {
      return NextResponse.json(
        {
          error: `Cannot change order status from ${order.order_status} to ${nextStatus}.`,
        },
        { status: 409, headers: responseHeaders },
      );
    }

    const now = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await supabaseServer
      .from("engineering_orders")
      .update({
        order_status: nextStatus,
        updated_at: now,
      })
      .eq("id", id)
      .eq("service_type", "remote_energy_assessment")
      .eq("payment_status", "paid")
      .eq("order_status", order.order_status)
      .select("id, order_status, updated_at")
      .maybeSingle();

    if (updateError) {
      console.error("Admin order-status update failed:", updateError.message);

      return NextResponse.json(
        { error: "Unable to update the order status." },
        { status: 500, headers: responseHeaders },
      );
    }

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "The order status changed or could not be updated. Refresh the orders and try again." },
        { status: 409, headers: responseHeaders },
      );
    }

    return NextResponse.json(
      { order: updatedOrder },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Admin order-status request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to update the order status." },
      { status: 500, headers: responseHeaders },
    );
  }
}
