import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type PaystackResponse = {
  status?: boolean;
  message?: string;
  data?: {
    account_name?: string;
    account_number?: string;
    settlement_bank?: string;
    subaccount_code?: string;
    active?: boolean;
  };
};

type PaystackBankResponse = {
  status?: boolean;
  message?: string;
  data?: Array<{
    name?: string;
    code?: string;
    active?: boolean;
    is_deleted?: boolean;
  }>;
  meta?: { next?: string | null };
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(request: NextRequest) {
  let claimAcquired = false;
  let userId = "";
  let subaccountCode = "";

  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    const user = authData.user;

    if (authError || !user) {
      return response({ error: "Please sign in to change your payout account." }, 401);
    }

    userId = user.id;

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      return response({ error: "Payout service is not configured." }, 500);
    }

    if (!secretKey.startsWith("sk_live_")) {
      return response({
        error: "Payout account changes require the live Paystack configuration. No account was changed.",
      }, 409);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return response({ error: "A valid JSON request body is required." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return response({ error: "Invalid payout details." }, 400);
    }

    const input = body as Record<string, unknown>;
    const bankCode =
      typeof input.bankCode === "string" ? input.bankCode.trim() : "";
    const accountNumber =
      typeof input.accountNumber === "string"
        ? input.accountNumber.trim()
        : "";

    if (!/^[A-Za-z0-9_-]{2,20}$/.test(bankCode)) {
      return response({ error: "Please select a valid bank." }, 400);
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      return response({
        error: "Enter a valid 10-digit Nigerian bank account number.",
      }, 400);
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select(
        "id, verification_status, payout_status, payout_subaccount_code",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Payout change profile lookup failed:", profileError.message);
      return response({ error: "Unable to verify your supplier profile." }, 500);
    }

    if (!profile || profile.verification_status !== "approved") {
      return response({
        error: "Only approved suppliers can change payout details.",
      }, 403);
    }

    if (
      profile.payout_status !== "active" ||
      typeof profile.payout_subaccount_code !== "string" ||
      !/^ACCT_[A-Za-z0-9]+$/.test(profile.payout_subaccount_code)
    ) {
      return response({
        error: "An active existing payout account is required. If a previous change is pending, contact Samiz support before retrying.",
      }, 409);
    }

    subaccountCode = profile.payout_subaccount_code;

    // Validate the selected bank against Paystack's active Nigerian NGN banks.
    let nextCursor: string | null = null;
    let selectedBankName = "";
    const visitedCursors = new Set<string>();
    let bankListComplete = false;

    for (let page = 0; page < 10; page += 1) {
      const bankUrl = new URL("https://api.paystack.co/bank");
      bankUrl.searchParams.set("country", "nigeria");
      bankUrl.searchParams.set("currency", "NGN");
      bankUrl.searchParams.set("perPage", "100");
      bankUrl.searchParams.set("use_cursor", "true");

      if (nextCursor) {
        bankUrl.searchParams.set("next", nextCursor);
      }

      let bankResponse: Response;

      try {
        bankResponse = await fetch(bankUrl.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${secretKey}` },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        return response({ error: "Unable to verify the selected bank. Please try again." }, 502);
      }

      const bankPayload = (await bankResponse.json().catch(() => null)) as
        | PaystackBankResponse
        | null;

      if (!bankResponse.ok || !bankPayload?.status || !Array.isArray(bankPayload.data)) {
        return response({ error: "Unable to verify the selected bank. Please try again." }, 502);
      }

      const matchedBank = bankPayload.data.find(
        (bank) =>
          bank.code === bankCode &&
          bank.active === true &&
          bank.is_deleted !== true &&
          typeof bank.name === "string" &&
          bank.name.trim().length > 0,
      );

      if (matchedBank?.name) {
        selectedBankName = matchedBank.name.trim();
        bankListComplete = true;
        break;
      }

      const returnedCursor =
        typeof bankPayload.meta?.next === "string"
          ? bankPayload.meta.next
          : null;

      if (!returnedCursor) {
        bankListComplete = true;
        break;
      }

      if (visitedCursors.has(returnedCursor)) {
        return response({ error: "Paystack returned an invalid bank-list cursor." }, 502);
      }

      visitedCursors.add(returnedCursor);
      nextCursor = returnedCursor;

      if (page === 9) {
        return response({ error: "Bank verification is incomplete. Please try again later." }, 502);
      }
    }

    if (!bankListComplete) {
      return response({ error: "Bank verification is incomplete. Please try again later." }, 502);
    }

    if (!selectedBankName) {
      return response({
        error: "Select an active Nigerian bank from the supported bank list.",
      }, 400);
    }

    // Resolve the new account before placing the existing payout account on hold.
    const resolveUrl = new URL("https://api.paystack.co/bank/resolve");
    resolveUrl.searchParams.set("account_number", accountNumber);
    resolveUrl.searchParams.set("bank_code", bankCode);

    let resolveResponse: Response;

    try {
      resolveResponse = await fetch(resolveUrl.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      return response({ error: "Unable to verify the new account. No payout change was attempted." }, 502);
    }

    const resolved = (await resolveResponse.json().catch(() => null)) as
      | PaystackResponse
      | null;

    if (
      !resolveResponse.ok ||
      !resolved?.status ||
      typeof resolved.data?.account_name !== "string" ||
      !resolved.data.account_name.trim()
    ) {
      return response({
        error: "Paystack could not verify that account. Check the bank and account number. No payout change was attempted.",
      }, 422);
    }

    const resolvedAccountName = resolved.data.account_name.trim();

    // Compare-and-set claim: only one request can change this active account.
    // The existing subaccount code is preserved.
    const { data: claim, error: claimError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .update({
        payout_status: "pending",
        payout_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .eq("verification_status", "approved")
      .eq("payout_status", "active")
      .eq("payout_subaccount_code", subaccountCode)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Payout change claim failed:", claimError.message);
      return response({ error: "Unable to reserve the payout change. Please try again later." }, 500);
    }

    if (!claim) {
      return response({
        error: "The payout account changed state before this request could start. Refresh the dashboard and check its status.",
      }, 409);
    }

    claimAcquired = true;

    // Update the existing Paystack subaccount; never create a replacement.
    let updateResponse: Response;

    try {
      updateResponse = await fetch(
        `https://api.paystack.co/subaccount/${encodeURIComponent(subaccountCode)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
          body: JSON.stringify({
            bank_code: bankCode,
            account_number: accountNumber,
          }),
        },
      );
    } catch {
      // The remote operation may have succeeded despite a network timeout.
      // Leave the database pending until support reconciles the remote account.
      return response({
        error: "Paystack's update result could not be confirmed. Payouts remain on hold to prevent settlement to an uncertain account. Contact Samiz support before retrying.",
      }, 502);
    }

    const updatePayload = (await updateResponse.json().catch(() => null)) as
      | PaystackResponse
      | null;

    if (!updateResponse.ok || !updatePayload?.status) {
      console.error(
        "Paystack payout subaccount update was not confirmed:",
        updatePayload?.message ?? `HTTP ${updateResponse.status}`,
      );

      return response({
        error: "Paystack did not confirm the account update. Payouts remain on hold until the account is reconciled. Contact Samiz support before retrying.",
      }, 502);
    }

    // Read back the existing subaccount rather than trusting only the PUT result.
    let verifyResponse: Response;

    try {
      verifyResponse = await fetch(
        `https://api.paystack.co/subaccount/${encodeURIComponent(subaccountCode)}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${secretKey}` },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        },
      );
    } catch {
      return response({
        error: "The account update was submitted, but Paystack read-back verification failed. Payouts remain on hold. Contact Samiz support before retrying.",
      }, 502);
    }

    const verified = (await verifyResponse.json().catch(() => null)) as
      | PaystackResponse
      | null;

    const remoteAccount = verified?.data;
    const remoteBankMatches =
      typeof remoteAccount?.settlement_bank === "string" &&
      normalize(remoteAccount.settlement_bank) === normalize(selectedBankName);

    const remoteAccountNameMatches =
      typeof remoteAccount?.account_name === "string" &&
      normalize(remoteAccount.account_name) === normalize(resolvedAccountName);

    if (
      !verifyResponse.ok ||
      !verified?.status ||
      remoteAccount?.subaccount_code !== subaccountCode ||
      remoteAccount.account_number !== accountNumber ||
      remoteAccount.active !== true ||
      !remoteBankMatches ||
      !remoteAccountNameMatches
    ) {
      console.error("Paystack payout update read-back did not match the requested account.");

      return response({
        error: "Paystack's saved account details do not conclusively match the request. Payouts remain on hold while Samiz support reconciles the account.",
      }, 502);
    }

    // Restore active status only after Paystack read-back matches the request.
    const { data: saved, error: saveError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .update({
        payout_bank_code: bankCode,
        payout_bank_name: selectedBankName,
        payout_account_name: remoteAccount.account_name,
        payout_account_last4: accountNumber.slice(-4),
        payout_status: "active",
        payout_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .eq("payout_status", "pending")
      .eq("payout_subaccount_code", subaccountCode)
      .select("id")
      .maybeSingle();

    if (saveError || !saved) {
      console.error(
        "Confirmed Paystack payout update could not be saved:",
        saveError?.message ?? "Profile no longer matched the pending claim",
      );

      return response({
        error: "Paystack confirmed the new account, but Samiz could not safely save the matching profile. Payouts remain on hold. Contact Samiz support before retrying.",
      }, 500);
    }

    return response({
      success: true,
      message: "Payout account updated and verified successfully.",
      payout: {
        status: "active",
        bankName: selectedBankName,
        accountName: remoteAccount.account_name,
        accountLast4: accountNumber.slice(-4),
      },
    });
  } catch (error) {
    console.error(
      "Marketplace payout change failed:",
      error instanceof Error ? error.message : "Unknown error",
      claimAcquired ? "(payout claim remains pending)" : "",
      userId ? `(supplier ${userId})` : "",
      subaccountCode ? "(existing subaccount retained)" : "",
    );

    return response({
      error: claimAcquired
        ? "The payout change could not be confirmed. Payouts remain on hold. Contact Samiz support before retrying."
        : "Unable to process the payout change right now.",
    }, 500);
  }
}
