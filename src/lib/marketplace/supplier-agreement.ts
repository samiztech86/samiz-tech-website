import "server-only";

import { createHash } from "node:crypto";
import { supabaseServer } from "@/lib/supabase/server";

export type SupplierAgreementGuardResult =
  | { ok: true }
  | {
      ok: false;
      status: 403 | 409 | 500;
      code: string;
      error: string;
    };

export async function requireCurrentSupplierAgreementAcceptance(
  supplierId: string,
): Promise<SupplierAgreementGuardResult> {
  const { data: agreement, error: agreementError } = await supabaseServer
    .from("marketplace_supplier_agreement_versions")
    .select("agreement_version, agreement_body, content_sha256")
    .eq("is_current", true)
    .maybeSingle();

  if (agreementError || !agreement) {
    console.error("Current supplier agreement lookup failed.");
    return {
      ok: false,
      status: 500,
      code: "SUPPLIER_AGREEMENT_UNAVAILABLE",
      error: "The current supplier agreement is unavailable. Please try again later.",
    };
  }

  const calculatedHash = createHash("sha256")
    .update(agreement.agreement_body, "utf8")
    .digest("hex");

  if (calculatedHash !== agreement.content_sha256) {
    console.error("Supplier agreement content hash verification failed.");
    return {
      ok: false,
      status: 500,
      code: "SUPPLIER_AGREEMENT_INTEGRITY_ERROR",
      error: "The current supplier agreement could not be verified. Please try again later.",
    };
  }

  const { data: acceptance, error: acceptanceError } = await supabaseServer
    .from("marketplace_supplier_agreement_acceptances")
    .select("agreement_sha256")
    .eq("supplier_id", supplierId)
    .eq("agreement_version", agreement.agreement_version)
    .maybeSingle();

  if (acceptanceError) {
    console.error("Supplier agreement acceptance lookup failed.");
    return {
      ok: false,
      status: 500,
      code: "SUPPLIER_AGREEMENT_CHECK_FAILED",
      error: "Unable to verify your Supplier Agreement acceptance.",
    };
  }

  if (!acceptance) {
    return {
      ok: false,
      status: 403,
      code: "SUPPLIER_AGREEMENT_ACCEPTANCE_REQUIRED",
      error: "Review and accept the current Supplier Agreement before performing this action.",
    };
  }

  if (acceptance.agreement_sha256 !== agreement.content_sha256) {
    return {
      ok: false,
      status: 409,
      code: "SUPPLIER_AGREEMENT_VERSION_MISMATCH",
      error: "Your recorded acceptance does not match the current Supplier Agreement. Review and accept the current version before continuing.",
    };
  }

  return { ok: true };
}