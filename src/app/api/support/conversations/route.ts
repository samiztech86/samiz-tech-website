import "server-only";

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createSupportVisitorToken, hashSupportVisitorToken } from "@/lib/support/visitor-token";
import { getSamizAutoReply, SAMIZ_AI_MARKER } from "@/lib/support/auto-reply";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

const TOKEN_COOKIE_PREFIX = "samiz_support_";
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return respond({ error: "Content-Type must be application/json." }, 415);
  }

  if (!validOrigin(request)) {
    return respond({ error: "Invalid request origin." }, 403);
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

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";

  if (
    name.length < 1 ||
    name.length > 120 ||
    !EMAIL_PATTERN.test(email) ||
    email.length > 254 ||
    message.length < 1 ||
    message.length > 5000 ||
    subject.length > 200
  ) {
    return respond(
      { error: "Enter a valid name, email, message, and optional subject." },
      400,
    );
  }

  // Basic honeypot. Real users should leave this field empty.
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return respond({ error: "Unable to process this request." }, 400);
  }

  const conversationId = crypto.randomUUID();

  // One independent cookie per conversation supports multiple conversations
  // in the same browser without replacing another conversation's credential.
  const token = createSupportVisitorToken();
  const tokenHash = hashSupportVisitorToken(token);

  try {
    const { data: conversation, error: conversationError } =
      await supabaseServer
        .from("support_conversations")
        .insert({
          id: conversationId,
          visitor_name: name,
          visitor_email: email,
          visitor_token_hash: tokenHash,
          subject: subject || null,
          status: "open",
          last_message_at: new Date().toISOString(),
        })
        .select("id, status, created_at")
        .single();

    if (conversationError || !conversation) {
      console.error(
        "Support conversation creation failed:",
        conversationError?.message ?? "No conversation returned",
      );
      return respond({ error: "Unable to start a support conversation." }, 500);
    }

    const { error: messageError } = await supabaseServer
      .from("support_messages")
      .insert({
        conversation_id: conversationId,
        sender_type: "visitor",
        message,
      });

    if (messageError) {
      console.error("Initial support message creation failed:", messageError.message);

      // Best-effort cleanup so a failed first message does not leave an empty
      // conversation. The database foreign key removes any child messages.
      const { error: cleanupError } = await supabaseServer
        .from("support_conversations")
        .delete()
        .eq("id", conversationId);

      if (cleanupError) {
        console.error("Support conversation cleanup failed:", cleanupError.message);
      }

      return respond({ error: "Unable to send your first support message." }, 500);
    }

    let autoReplySent = false;

    try {
      const autoReply = getSamizAutoReply(message, subject);
      const { data: savedAutoReply, error: autoReplyError } =
        await supabaseServer
          .from("support_messages")
          .insert({
            conversation_id: conversationId,
            sender_type: "admin",
            message: `${SAMIZ_AI_MARKER}\n${autoReply}`,
          })
          .select("id, created_at")
          .single();

      if (autoReplyError || !savedAutoReply) {
        console.error(
          "Support auto-reply save failed:",
          autoReplyError?.message ?? "No auto-reply returned",
        );
      } else {
        autoReplySent = true;

        const { error: timestampError } = await supabaseServer
          .from("support_conversations")
          .update({ last_message_at: savedAutoReply.created_at })
          .eq("id", conversationId);

        if (timestampError) {
          console.error(
            "Support auto-reply timestamp update failed:",
            timestampError.message,
          );
        }
      }
    } catch (autoReplyError) {
      console.error(
        "Support auto-reply failed:",
        autoReplyError instanceof Error
          ? autoReplyError.message
          : "Unknown error",
      );
    }
    const response = respond(
      {
        success: true,
        autoReplySent,
        conversation: {
          id: conversation.id,
          status: conversation.status,
          created_at: conversation.created_at,
        },
      },
      201,
    );

    response.cookies.set(`${TOKEN_COOKIE_PREFIX}${conversationId}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/support",
      maxAge: TOKEN_TTL_SECONDS,
    });

    return response;
  } catch (error) {
    console.error(
      "Support conversation request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond({ error: "Unable to start a support conversation." }, 500);
  }
}
