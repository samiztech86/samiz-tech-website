import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

const APPLICATION_STATUSES = [
  "new",
  "reviewing",
  "shortlisted",
  "contacted",
  "closed",
] as const;

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

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
      .from("team_applications")
      .select(
        "id, full_name, email, phone, location, application_type, interest_area, experience, portfolio_url, status, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Admin team applications list failed:", error.message);
      return respond({ error: "Unable to load team applications." }, 500);
    }

    return respond({ applications: data ?? [] });
  } catch (error) {
    console.error(
      "Admin team applications GET failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond({ error: "Unable to load team applications." }, 500);
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
    const status =
      typeof input.status === "string" ? input.status : "";

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return respond({ error: "A valid application reference is required." }, 400);
    }

    if (
      !APPLICATION_STATUSES.includes(status as ApplicationStatus)
    ) {
      return respond({ error: "Invalid application status." }, 400);
    }

    const { data, error } = await supabaseServer
      .from("team_applications")
      .update({
        status: status as ApplicationStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, status, updated_at")
      .single();

    if (error || !data) {
      if (error?.code === "PGRST116") {
        return respond({ error: "Application not found." }, 404);
      }

      console.error(
        "Admin team application status update failed:",
        error?.message ?? "No application returned",
      );

      return respond({ error: "Unable to update application status." }, 500);
    }

    return respond({ application: data });
  } catch (error) {
    console.error(
      "Admin team applications PATCH failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond({ error: "Unable to update application status." }, 500);
  }
}
