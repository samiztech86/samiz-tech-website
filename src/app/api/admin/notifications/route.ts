import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store, max-age=0" };

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers });
}

async function requireAdmin() {
  try {
    return await isAdminAuthenticated();
  } catch (error) {
    console.error(
      "Admin notification authentication failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return false;
  }
}

export async function GET() {
  if (!(await requireAdmin())) {
    return respond({ error: "Admin authentication required." }, 401);
  }

  try {
    const [notificationsResult, unreadResult] = await Promise.all([
      supabaseServer
        .from("admin_notifications")
        .select(
          "id, event_type, title, message, entity_type, entity_id, metadata, created_at, read_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseServer
        .from("admin_notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);

    if (notificationsResult.error || unreadResult.error) {
      console.error(
        "Admin notification query failed:",
        notificationsResult.error?.message ??
          unreadResult.error?.message ??
          "Unknown database error",
      );
      return respond({ error: "Unable to load admin notifications." }, 500);
    }

    return respond({
      notifications: notificationsResult.data ?? [],
      unreadCount: unreadResult.count ?? 0,
    });
  } catch (error) {
    console.error(
      "Admin notification retrieval failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to load admin notifications." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return respond({ error: "Admin authentication required." }, 401);
  }

  const origin = request.headers.get("origin");

  if (!origin || origin !== new URL(request.url).origin) {
    return respond({ error: "Cross-origin request rejected." }, 403);
  }

  const body = (await request.json().catch(() => null)) as
    | { id?: unknown; markAllRead?: unknown }
    | null;

  if (!body || typeof body !== "object") {
    return respond({ error: "A valid JSON request body is required." }, 400);
  }

  try {
    let query = supabaseServer
      .from("admin_notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);

    if (body.markAllRead === true) {
      // Mark all currently unread notifications as read.
    } else if (
      typeof body.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.id,
      )
    ) {
      query = query.eq("id", body.id);
    } else {
      return respond(
        { error: "Provide a valid notification ID or markAllRead: true." },
        400,
      );
    }

    const { error } = await query;

    if (error) {
      console.error("Admin notification update failed:", error.message);
      return respond({ error: "Unable to update admin notification." }, 500);
    }

    return respond({ success: true });
  } catch (error) {
    console.error(
      "Admin notification update failed unexpectedly:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to update admin notification." }, 500);
  }
}
