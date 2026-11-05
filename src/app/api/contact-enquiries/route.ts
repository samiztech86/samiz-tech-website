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

const SERVICES = [
  "Solar EPC",
  "Electrical Engineering",
  "Backup Power",
  "Energy Storage",
  "Smart Automation",
  "EnergyOS",
  "Facility Maintenance",
  "Other",
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
  const realAddress = request.headers.get("x-real-ip")?.trim();
  if (realAddress) return realAddress;

  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    const addresses = forwarded
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

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
    .update(`contact-enquiry:${address}`)
    .digest("hex");
}

function readText(
  value: unknown,
  maxLength: number,
  required = false,
): string | null {
  if (value === undefined && !required) return "";
  if (typeof value !== "string") return null;

  const normalized = value.trim();

  if (!normalized) return required ? null : "";

  return normalized.length <= maxLength ? normalized : null;
}

export async function POST(request: NextRequest) {
  if (!validOrigin(request)) {
    return respond({ error: "Invalid submission origin." }, 403);
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.includes("application/json")) {
    return respond({ error: "A JSON request body is required." }, 415);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > 12_000) {
    return respond({ error: "The submission is too large." }, 413);
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return respond({ error: "Unable to read the submission." }, 400);
  }

  if (Buffer.byteLength(rawBody, "utf8") > 12_000) {
    return respond({ error: "The submission is too large." }, 413);
  }

  let input: Record<string, unknown>;

  try {
    const parsed: unknown = JSON.parse(rawBody);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return respond({ error: "Invalid submission format." }, 400);
    }

    input = parsed as Record<string, unknown>;
  } catch {
    return respond({ error: "Invalid JSON submission." }, 400);
  }

  // Quietly accept bot submissions without storing or notifying.
  const website = readText(input.website, 200);

  if (website === null) {
    return respond({ error: "Invalid submission." }, 400);
  }

  if (website) {
    return respond({ success: true }, 200);
  }

  const fullName = readText(input.name, 120, true);
  const company = readText(input.company, 160);
  const phone = readText(input.phone, 40, true);
  const email = readText(input.email, 254);
  const service = readText(input.service, 60);
  const message = readText(input.message, 5000, true);

  if (
    fullName === null ||
    fullName.length < 2 ||
    company === null ||
    phone === null ||
    phone.length < 7 ||
    !/^[+()\d\s.-]+$/.test(phone) ||
    email === null ||
    (email !== "" && (email.length < 5 || !EMAIL_PATTERN.test(email))) ||
    service === null ||
    (service !== "" && !SERVICES.includes(service as (typeof SERVICES)[number])) ||
    message === null ||
    message.length < 10
  ) {
    return respond(
      {
        error:
          "Please check your name, phone number, email, selected service and project details.",
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
        "Contact enquiry rate-limit check failed:",
        rateLimitError.message,
      );

      return respond(
        { error: "Unable to accept enquiries right now. Please try again later." },
        503,
      );
    }

    if (rateLimitAllowed !== true) {
      return respond(
        { error: "Too many submissions. Please try again later." },
        429,
      );
    }

    const { data: enquiry, error: enquiryError } = await supabaseServer
      .from("contact_enquiries")
      .insert({
        full_name: fullName,
        company: company || null,
        phone,
        email: email || null,
        service: service || null,
        message,
        status: "new",
      })
      .select("id")
      .single();

    if (enquiryError || !enquiry) {
      console.error(
        "Contact enquiry save failed:",
        enquiryError?.message ?? "No enquiry returned",
      );

      return respond(
        { error: "Unable to save your enquiry. Please try again later." },
        500,
      );
    }

    await createAdminNotification({
      eventType: "contact_enquiry",
      title: "New website project enquiry",
      message: `${fullName} submitted a ${service || "general"} enquiry. Phone: ${phone}. Reference: ${enquiry.id}.`,
      entityType: "contact_enquiry",
      entityId: enquiry.id,
      metadata: {
        fullName,
        company: company || null,
        phone,
        email: email || null,
        service: service || null,
      },
      emailSubject: "Samiz Tech: new project enquiry",
      emailLines: [
        "A new project enquiry has been submitted through the Samiz Tech website.",
        "",
        `Reference: ${enquiry.id}`,
        `Name: ${fullName}`,
        `Company: ${company || "Not provided"}`,
        `Phone: ${phone}`,
        `Email: ${email || "Not provided"}`,
        `Service: ${service || "Not specified"}`,
        "",
        "Project details:",
        message,
      ],
    });

    return respond(
      {
        success: true,
        reference: enquiry.id,
        message: "Your project enquiry has been received.",
      },
      201,
    );
  } catch (error) {
    console.error(
      "Contact enquiry submission failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return respond(
      { error: "Unable to submit your enquiry right now. Please try again later." },
      500,
    );
  }
}
