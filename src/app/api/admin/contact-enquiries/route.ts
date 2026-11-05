import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

const ENQUIRY_STATUSES = [
  "new",
  "reviewing",
  "contacted",
  "closed",
] as const;

type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

const ENQUIRY_FIELDS =
  "id, full_name, company, phone, email, service, message, status, created_at, updated_at";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: RESPONSE_HEADERS,
  });
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

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return respond({ error: "Authentication required." }, 401);
    }

    const { data, error } = await supabaseServer
      .from("contact_enquiries")
      .select(ENQUIRY_FIELDS)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error(
        "Admin contact enquiries list failed:",
        error.message,
      );
      return respond({ error: "Unable to load contact enquiries." }, 500);
    }

    return respond({ enquiries: data ?? [] });
  } catch (error) {
    console.error(
      "Admin contact enquiries GET failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond({ error: "Unable to load contact enquiries." }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
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

    const contentLength = Number(request.headers.get("content-length") ?? "0");

    if (Number.isFinite(contentLength) && contentLength > 2_000) {
      return respond({ error: "Request is too large." }, 413);
    }

    let body: unknown;

    try {
      const rawBody = await request.text();

      if (new TextEncoder().encode(rawBody).byteLength > 2_000) {
        return respond({ error: "Request is too large." }, 413);
      }

      body = JSON.parse(rawBody);
    } catch {
      return respond({ error: "A valid JSON request body is required." }, 400);
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return respond({ error: "Invalid request body." }, 400);
    }

    const input = body as Record<string, unknown>;
    const id = typeof input.id === "string" ? input.id.trim() : "";
    const status = typeof input.status === "string" ? input.status : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      return respond({ error: "A valid enquiry reference is required." }, 400);
    }

    if (!ENQUIRY_STATUSES.includes(status as EnquiryStatus)) {
      return respond({ error: "Invalid enquiry status." }, 400);
    }

    const { data, error } = await supabaseServer
      .from("contact_enquiries")
      .update({
        status: status as EnquiryStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status, updated_at")
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return respond({ error: "Contact enquiry not found." }, 404);
      }

      console.error(
        "Admin contact enquiry status update failed:",
        error?.message ?? "No enquiry returned",
      );

      return respond({ error: "Unable to update enquiry status." }, 500);
    }

    return respond({ enquiry: data });
  } catch (error) {
    console.error(
      "Admin contact enquiries PATCH failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond({ error: "Unable to update enquiry status." }, 500);
  }
}
