import "server-only";

import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACCEPTANCE_STATEMENT =
  "I confirm that I am authorised to accept this Supplier Agreement for the supplier account identified above. I have read and agree to the Supplier Agreement, version displayed to me, and understand that it becomes effective for this supplier account when I select 'I Agree and Accept'.";

type AgreementRow = {
  agreement_version: string;
  title: string;
  agreement_body: string;
  content_sha256: string;
  effective_at: string;
  is_current: boolean;
};

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function plainTextAgreement(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function getAuthenticatedSupplier() {
  const authClient = await createSupabaseRouteHandlerClient();
  const { data, error } = await authClient.auth.getUser();

  if (error || !data.user) {
    return {
      user: null,
      response: respond({ error: "Please sign in to access the supplier agreement." }, 401),
    };
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("marketplace_supplier_profiles")
    .select("id")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Supplier agreement profile lookup failed.");
    return {
      user: null,
      response: respond({ error: "Unable to verify your supplier account." }, 500),
    };
  }

  if (!profile) {
    return {
      user: null,
      response: respond({ error: "Complete supplier registration before accepting the agreement." }, 403),
    };
  }

  return { user: data.user, response: null };
}

async function getCurrentAgreement() {
  const { data, error } = await supabaseServer
    .from("marketplace_supplier_agreement_versions")
    .select("agreement_version, title, agreement_body, content_sha256, effective_at, is_current")
    .eq("is_current", true)
    .maybeSingle();

  if (error || !data) {
    console.error("Current supplier agreement lookup failed.");
    return {
      agreement: null,
      response: respond({ error: "The current supplier agreement is unavailable. Please try again later." }, 500),
    };
  }

  const agreement = data as AgreementRow;
  const calculatedHash = createHash("sha256")
    .update(agreement.agreement_body, "utf8")
    .digest("hex");

  if (calculatedHash !== agreement.content_sha256) {
    console.error("Supplier agreement content hash verification failed.");
    return {
      agreement: null,
      response: respond({ error: "The agreement could not be verified. Acceptance is temporarily unavailable." }, 500),
    };
  }

  return { agreement, response: null };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedSupplier();
    if (!auth.user) return auth.response;

    const current = await getCurrentAgreement();
    if (!current.agreement) return current.response;

    const { data: acceptance, error } = await supabaseServer
      .from("marketplace_supplier_agreement_acceptances")
      .select("agreement_version, agreement_sha256, accepted_at, signatory_name")
      .eq("supplier_id", auth.user.id)
      .eq("agreement_version", current.agreement.agreement_version)
      .maybeSingle();

    if (error) {
      console.error("Supplier agreement acceptance lookup failed.");
      return respond({ error: "Unable to check your agreement acceptance." }, 500);
    }

    const accepted =
      !!acceptance &&
      acceptance.agreement_sha256 === current.agreement.content_sha256;

    return respond({
      agreement: {
        agreement_version: current.agreement.agreement_version,
        title: current.agreement.title,
        agreement_body: plainTextAgreement(current.agreement.agreement_body),
        content_sha256: current.agreement.content_sha256,
        effective_at: current.agreement.effective_at,
      },
      acceptance_statement: ACCEPTANCE_STATEMENT,
      accepted,
      acceptance: accepted
        ? {
            accepted_at: acceptance.accepted_at,
            signatory_name: acceptance.signatory_name,
          }
        : null,
    });
  } catch {
    return respond({ error: "Unable to load the supplier agreement." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");

    if (!origin || origin !== new URL(request.url).origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    const auth = await getAuthenticatedSupplier();
    if (!auth.user) return auth.response;

    const body = (await request.json().catch(() => null)) as {
      accepted?: unknown;
      signatoryName?: unknown;
      acceptanceStatement?: unknown;
      agreementVersion?: unknown;
      agreementSha256?: unknown;
    } | null;

    if (
      body?.accepted !== true ||
      body.acceptanceStatement !== ACCEPTANCE_STATEMENT
    ) {
      return respond({
        error: "You must explicitly accept the displayed Supplier Agreement before continuing.",
      }, 400);
    }

    const signatoryName =
      typeof body.signatoryName === "string"
        ? body.signatoryName.trim()
        : "";

    if (signatoryName.length < 2 || signatoryName.length > 120) {
      return respond({
        error: "Enter the authorised signatory's name (2–120 characters).",
      }, 400);
    }

    const current = await getCurrentAgreement();
    if (!current.agreement) return current.response;

    if (
      body.agreementVersion !== current.agreement.agreement_version ||
      body.agreementSha256 !== current.agreement.content_sha256
    ) {
      return respond({
        error: "The agreement has changed or the displayed version is out of date. Reload it and review the current version before accepting.",
      }, 409);
    }

    const { data: existing, error: existingError } = await supabaseServer
      .from("marketplace_supplier_agreement_acceptances")
      .select("agreement_version, agreement_sha256, accepted_at, signatory_name")
      .eq("supplier_id", auth.user.id)
      .eq("agreement_version", current.agreement.agreement_version)
      .maybeSingle();

    if (existingError) {
      console.error("Existing supplier agreement acceptance lookup failed.");
      return respond({ error: "Unable to verify your acceptance." }, 500);
    }

    if (existing) {
      if (existing.agreement_sha256 !== current.agreement.content_sha256) {
        return respond({
          error: "An acceptance record exists for this version but its hash differs. An administrator must publish a correctly versioned agreement before you can continue.",
        }, 409);
      }

      return respond({
        success: true,
        alreadyAccepted: true,
        agreementVersion: current.agreement.agreement_version,
        acceptedAt: existing.accepted_at,
      });
    }

    const { data: inserted, error: insertError } = await supabaseServer
      .from("marketplace_supplier_agreement_acceptances")
      .insert({
        supplier_id: auth.user.id,
        agreement_version: current.agreement.agreement_version,
        agreement_sha256: current.agreement.content_sha256,
        signatory_name: signatoryName,
        acceptance_statement: ACCEPTANCE_STATEMENT,
        acceptance_method: "authenticated_web_explicit_acceptance",
        accepted_at: new Date().toISOString(),
      })
      .select("agreement_version, agreement_sha256, accepted_at, signatory_name")
      .maybeSingle();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: concurrentAcceptance, error: concurrentLookupError } =
          await supabaseServer
            .from("marketplace_supplier_agreement_acceptances")
            .select("agreement_version, agreement_sha256, accepted_at")
            .eq("supplier_id", auth.user.id)
            .eq("agreement_version", current.agreement.agreement_version)
            .maybeSingle();

        if (concurrentLookupError) {
          console.error("Concurrent supplier agreement acceptance lookup failed.");
          return respond({
            error: "Acceptance could not be verified. Refresh the agreement and try again.",
          }, 500);
        }

        if (
          concurrentAcceptance &&
          concurrentAcceptance.agreement_sha256 === current.agreement.content_sha256
        ) {
          return respond({
            success: true,
            alreadyAccepted: true,
            agreementVersion: concurrentAcceptance.agreement_version,
            acceptedAt: concurrentAcceptance.accepted_at,
          });
        }

        if (concurrentAcceptance) {
          return respond({
            error: "An acceptance record exists for this version but its hash differs. An administrator must publish a correctly versioned agreement before you can continue.",
          }, 409);
        }
      }

      console.error("Supplier agreement acceptance insert failed.");
      return respond({
        error: "Acceptance could not be recorded. Refresh the agreement and try again.",
      }, 500);
    }

    if (!inserted) {
      console.error("Supplier agreement acceptance insert returned no record.");
      return respond({
        error: "Acceptance could not be confirmed. Refresh the agreement and try again.",
      }, 500);
    }

    return respond({
      success: true,
      alreadyAccepted: false,
      agreementVersion: inserted.agreement_version,
      acceptedAt: inserted.accepted_at,
    });
  } catch {
    return respond({ error: "Unable to record supplier agreement acceptance." }, 500);
  }
}
