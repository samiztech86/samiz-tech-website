import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return respond({ error: "Authentication required." }, 401);
    }

    const { data, error } = await supabaseServer
      .from("support_conversations")
      .select(
        "id, visitor_name, visitor_email, subject, status, last_message_at, created_at, updated_at",
      )
      .order("last_message_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Admin support conversation list failed:", error.message);
      return respond({ error: "Unable to load support conversations." }, 500);
    }

    return respond({ conversations: data ?? [] });
  } catch (error) {
    console.error(
      "Admin support list request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to load support conversations." }, 500);
  }
}
