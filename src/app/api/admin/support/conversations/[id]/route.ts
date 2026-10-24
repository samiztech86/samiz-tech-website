import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ["open", "waiting", "resolved"] as const;

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: responseHeaders });
}

function validOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function getAuthorizedId(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<string | null> {
  if (!(await isAdminAuthenticated())) return null;

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) return null;

  return id;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = await getAuthorizedId(request, context);

    if (!id) {
      if (!(await isAdminAuthenticated())) {
        return respond({ error: "Authentication required." }, 401);
      }
      return respond({ error: "Invalid conversation ID." }, 400);
    }

    const { data: conversation, error: conversationError } =
      await supabaseServer
        .from("support_conversations")
        .select(
          "id, visitor_name, visitor_email, subject, status, last_message_at, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();

    if (conversationError) {
      console.error("Admin support conversation lookup failed:", conversationError.message);
      return respond({ error: "Unable to load this conversation." }, 500);
    }

    if (!conversation) {
      return respond({ error: "Conversation not found." }, 404);
    }

    const { data: messages, error: messagesError } = await supabaseServer
      .from("support_messages")
      .select("id, sender_type, message, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Admin support message lookup failed:", messagesError.message);
      return respond({ error: "Unable to load conversation messages." }, 500);
    }

    return respond({ conversation, messages: messages ?? [] });
  } catch (error) {
    console.error(
      "Admin support conversation request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to load this conversation." }, 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return respond({ error: "Authentication required." }, 401);
  }

  if (!validOrigin(request)) {
    return respond({ error: "Invalid request origin." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return respond({ error: "Content-Type must be application/json." }, 415);
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return respond({ error: "Invalid conversation ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ error: "A valid JSON request body is required." }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respond({ error: "Invalid request body." }, 400);
  }

  const message =
    typeof (body as Record<string, unknown>).message === "string"
      ? ((body as Record<string, unknown>).message as string).trim()
      : "";

  if (message.length < 1 || message.length > 5000) {
    return respond({ error: "Reply must contain between 1 and 5000 characters." }, 400);
  }

  try {
    const { data: conversation, error: lookupError } = await supabaseServer
      .from("support_conversations")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin support reply lookup failed:", lookupError.message);
      return respond({ error: "Unable to send the reply." }, 500);
    }

    if (!conversation) {
      return respond({ error: "Conversation not found." }, 404);
    }

    const { data: savedMessage, error: insertError } = await supabaseServer
      .from("support_messages")
      .insert({
        conversation_id: id,
        sender_type: "admin",
        message,
      })
      .select("id, sender_type, message, created_at")
      .single();

    if (insertError || !savedMessage) {
      console.error(
        "Admin support reply insert failed:",
        insertError?.message ?? "No message returned",
      );
      return respond({ error: "Unable to send the reply." }, 500);
    }

    const { error: updateError } = await supabaseServer
      .from("support_conversations")
      .update({
        status: "waiting",
        last_message_at: savedMessage.created_at,
        updated_at: savedMessage.created_at,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Admin support reply status update failed:", updateError.message);
      return respond(
        {
          success: true,
          warning: "Reply was saved, but conversation status could not be updated.",
          message: savedMessage,
        },
        200,
      );
    }

    return respond({ success: true, message: savedMessage }, 201);
  } catch (error) {
    console.error(
      "Admin support reply request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to send the reply." }, 500);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return respond({ error: "Authentication required." }, 401);
  }

  if (!validOrigin(request)) {
    return respond({ error: "Invalid request origin." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return respond({ error: "Content-Type must be application/json." }, 415);
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return respond({ error: "Invalid conversation ID." }, 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ error: "A valid JSON request body is required." }, 400);
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respond({ error: "Invalid request body." }, 400);
  }

  const status = (body as Record<string, unknown>).status;
  if (
    typeof status !== "string" ||
    !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])
  ) {
    return respond({ error: "Status must be open, waiting, or resolved." }, 400);
  }

  try {
    const { data, error } = await supabaseServer
      .from("support_conversations")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status, updated_at")
      .maybeSingle();

    if (error) {
      console.error("Admin support status update failed:", error.message);
      return respond({ error: "Unable to update conversation status." }, 500);
    }

    if (!data) {
      return respond({ error: "Conversation not found." }, 404);
    }

    return respond({ success: true, conversation: data });
  } catch (error) {
    console.error(
      "Admin support status request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return respond({ error: "Unable to update conversation status." }, 500);
  }
}
