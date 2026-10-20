import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import {
  hashSupportVisitorToken,
  isValidSupportVisitorToken,
} from "@/lib/support/visitor-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_PREFIX = "samiz_support_";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

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

async function authorizeVisitor(
  request: NextRequest,
  conversationId: string,
): Promise<{ id: string; status: string } | null> {
  if (!UUID_PATTERN.test(conversationId)) return null;

  const token = request.cookies.get(`${COOKIE_PREFIX}${conversationId}`)?.value;
  if (!isValidSupportVisitorToken(token)) return null;

  const tokenHash = hashSupportVisitorToken(token);

  const { data, error } = await supabaseServer
    .from("support_conversations")
    .select("id, status")
    .eq("id", conversationId)
    .eq("visitor_token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("Support visitor authorization lookup failed:", error.message);
    throw new Error("SUPPORT_LOOKUP_FAILED");
  }

  return data;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const conversation = await authorizeVisitor(request, id);

    if (!conversation) {
      return respond({ error: "Conversation not found or access denied." }, 404);
    }

    const { data: messages, error } = await supabaseServer
      .from("support_messages")
      .select("id, sender_type, message, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Support message retrieval failed:", error.message);
      return respond({ error: "Unable to retrieve messages." }, 500);
    }

    return respond({
      conversation: {
        id: conversation.id,
        status: conversation.status,
      },
      messages: messages ?? [],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SUPPORT_LOOKUP_FAILED") {
      return respond({ error: "Unable to verify conversation access." }, 500);
    }

    console.error("Support message retrieval failed unexpectedly.");
    return respond({ error: "Unable to retrieve messages." }, 500);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!validOrigin(request)) {
    return respond({ error: "Invalid request origin." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return respond({ error: "Content-Type must be application/json." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return respond({ error: "Request is too large." }, 413);
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
    return respond({ error: "Message must contain between 1 and 5000 characters." }, 400);
  }

  const { id } = await context.params;

  try {
    const conversation = await authorizeVisitor(request, id);

    if (!conversation) {
      return respond({ error: "Conversation not found or access denied." }, 404);
    }

    const { data: savedMessage, error: messageError } = await supabaseServer
      .from("support_messages")
      .insert({
        conversation_id: conversation.id,
        sender_type: "visitor",
        message,
      })
      .select("id, sender_type, message, created_at")
      .single();

    if (messageError || !savedMessage) {
      console.error(
        "Support visitor reply failed:",
        messageError?.message ?? "No message returned",
      );
      return respond({ error: "Unable to send your message." }, 500);
    }

    // A visitor reply reopens a resolved conversation.
    const { error: updateError } = await supabaseServer
      .from("support_conversations")
      .update({
        status: "open",
        last_message_at: savedMessage.created_at,
        updated_at: savedMessage.created_at,
      })
      .eq("id", conversation.id);

    if (updateError) {
      // The message is already saved; report this for operational follow-up.
      console.error("Support conversation timestamp update failed:", updateError.message);
    }

    return respond({
      success: true,
      message: savedMessage,
      conversation: {
        id: conversation.id,
        status: "open",
      },
    }, 201);
  } catch (error) {
    if (error instanceof Error && error.message === "SUPPORT_LOOKUP_FAILED") {
      return respond({ error: "Unable to verify conversation access." }, 500);
    }

    console.error("Support visitor reply failed unexpectedly.");
    return respond({ error: "Unable to send your message." }, 500);
  }
}
