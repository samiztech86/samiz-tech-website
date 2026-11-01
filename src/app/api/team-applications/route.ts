import "server-only";

import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createAdminNotification } from "@/lib/admin/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const APPLICATION_TYPES = [
  "employment_interest",
  "project_collaboration",
  "volunteer_collaboration",
] as const;

const INTEREST_AREAS = [
  "software_development",
  "electrical_solar",
  "energyos_iot_automation",
  "business_development_sales",
  "operations_field_support",
  "other",
] as const;

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

function getClientAddress(request: NextRequest): string | null {
  // The hosting proxy must overwrite these headers rather than trust
  // arbitrary client-supplied forwarding values.
  const realAddress = request.headers.get("x-real-ip")?.trim();
  if (realAddress) return realAddress;

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const addresses = forwarded.split(",").map((value) => value.trim()).filter(Boolean);
    return addresses.length > 0 ? addresses[addresses.length - 1] : null;
  }

  return null;
}

function hashRateLimitIdentifier(address: string): string {
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!secret) {
    throw new Error("Rate-limit hashing secret is unavailable.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(`team-application:${address}`)
    .digest("hex");
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim();
  if (!normalized) return null;

  return normalized.length <= maxLength ? normalized : null;
}

function validPortfolioUrl(value: string | null): boolean {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
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
    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > 12_000) {
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

  // Basic honeypot: genuine applicants should leave this field empty.
  if (typeof input.website === "string" && input.website.trim() !== "") {
    return respond({ error: "Unable to process this request." }, 400);
  }

  if (
    (input.location !== undefined &&
      input.location !== null &&
      (typeof input.location !== "string" || input.location.trim().length > 120)) ||
    (input.portfolioUrl !== undefined &&
      input.portfolioUrl !== null &&
      (typeof input.portfolioUrl !== "string" ||
        input.portfolioUrl.trim().length > 2048))
  ) {
    return respond({ error: "One or more optional fields are too long or invalid." }, 400);
  }

  const fullName = optionalText(input.fullName, 120) ?? "";
  const email =
    typeof input.email === "string"
      ? input.email.trim().toLowerCase()
      : "";
  const phone = optionalText(input.phone, 40) ?? "";
  const location = optionalText(input.location, 120);
  const experience = optionalText(input.experience, 5000) ?? "";
  const portfolioUrl = optionalText(input.portfolioUrl, 2048);

  const applicationType =
    typeof input.applicationType === "string"
      ? input.applicationType
      : "";

  const interestArea =
    typeof input.interestArea === "string"
      ? input.interestArea
      : "";

  if (
    fullName.length < 2 ||
    !EMAIL_PATTERN.test(email) ||
    email.length > 254 ||
    phone.length < 7 ||
    experience.length < 20 ||
    !APPLICATION_TYPES.includes(
      applicationType as (typeof APPLICATION_TYPES)[number],
    ) ||
    !INTEREST_AREAS.includes(
      interestArea as (typeof INTEREST_AREAS)[number],
    ) ||
    input.consent !== true ||
    !validPortfolioUrl(portfolioUrl)
  ) {
    return respond(
      {
        error:
          "Check your name, email, phone, collaboration pathway, interest area, experience, consent, and portfolio URL.",
      },
      400,
    );
  }

  const clientAddress = getClientAddress(request);

  if (!clientAddress) {
    return respond(
      { error: "Unable to verify this submission. Please try again later." },
      503,
    );
  }

  try {
    const identifierHash = hashRateLimitIdentifier(clientAddress);

    const { data: rateLimitAllowed, error: rateLimitError } =
      await supabaseServer.rpc("check_team_application_rate_limit", {
        p_identifier_hash: identifierHash,
      });

    if (rateLimitError) {
      console.error(
        "Team application rate-limit check failed:",
        rateLimitError.message,
      );
      return respond(
        { error: "Unable to accept applications right now. Please try again later." },
        503,
      );
    }

    if (rateLimitAllowed !== true) {
      return respond(
        { error: "Too many submissions. Please try again later." },
        429,
      );
    }

    const { data: application, error: applicationError } =
      await supabaseServer
        .from("team_applications")
        .insert({
          full_name: fullName,
          email,
          phone,
          location,
          application_type: applicationType,
          interest_area: interestArea,
          experience,
          portfolio_url: portfolioUrl,
          consent: true,
          status: "new",
        })
        .select("id")
        .single();

    if (applicationError || !application) {
      console.error(
        "Team application save failed:",
        applicationError?.message ?? "No application returned",
      );
      return respond(
        { error: "Unable to submit your application. Please try again later." },
        500,
      );
    }

    const pathwayLabels: Record<(typeof APPLICATION_TYPES)[number], string> = {
      employment_interest: "Paid employment — future vacancies",
      project_collaboration: "Paid project engagement — subject to confirmed funding and agreed terms",
      volunteer_collaboration: "Volunteer collaboration — unpaid and optional",
    };
    const pathwayLabel = pathwayLabels[applicationType as (typeof APPLICATION_TYPES)[number]];

    await createAdminNotification({
      eventType: "team_application",
      title: "New team application",
      message: `A new ${pathwayLabel.toLowerCase()} application was received.`,
      entityType: "team_application",
      entityId: application.id,
      metadata: {
        applicationType,
        interestArea,
      },
      emailSubject: "Samiz Tech: new team application",
      emailLines: [
        "A new team application has been submitted.",
        "",
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Location: ${location ?? "Not provided"}`,
        `Pathway: ${pathwayLabel}`,
        `Interest area: ${interestArea}`,
        "",
        "Experience:",
        experience,
        "",
        `Portfolio: ${portfolioUrl ?? "Not provided"}`,
        `Application reference: ${application.id}`,
      ],
    });

    return respond(
      {
        success: true,
        message: "Your expression of interest has been submitted successfully.",
        reference: application.id,
      },
      201,
    );
  } catch (error) {
    console.error(
      "Team application request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      { error: "Unable to submit your application. Please try again later." },
      500,
    );
  }
}
