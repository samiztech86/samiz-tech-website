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

type PaystackResult = {
  status?: boolean;
  message?: string;
  data?: {
    account_name?: string;
    account_number?: string;
    settlement_bank?: string;
    subaccount_code?: string;
    active?: boolean;
    percentage_charge?: number;
  };
};

export async function POST(request: NextRequest) {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    const user = authData.user;

    if (authError || !user) {
      return response({ error: "Please sign in to configure supplier payouts." }, 401);
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("Marketplace payout: Paystack is not configured.");
      return response({ error: "Payout service is not configured." }, 500);
    }

    if (!secretKey.startsWith("sk_live_")) {
      return response(
        {
          error:
            "Supplier payout setup requires the live Paystack configuration. No payout account was created.",
        },
        409,
      );
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

    let selectedBankIsValid = false;
    let nextCursor: string | null = null;
    let paginationComplete = false;
    const visitedCursors = new Set<string>();

    for (let page = 0; page < 10; page += 1) {
      const bankListUrl = new URL("https://api.paystack.co/bank");
      bankListUrl.searchParams.set("country", "nigeria");
      bankListUrl.searchParams.set("currency", "NGN");
      bankListUrl.searchParams.set("perPage", "100");
      bankListUrl.searchParams.set("use_cursor", "true");

      if (nextCursor) {
        bankListUrl.searchParams.set("next", nextCursor);
      }

      let bankListResponse: Response;

      try {
        bankListResponse = await fetch(bankListUrl.toString(), {
          method: "GET",
          headers: { Authorization: `Bearer ${secretKey}` },
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        return response(
          { error: "Unable to verify the selected bank. Please try again." },
          502,
        );
      }

      const bankListData = (await bankListResponse.json().catch(() => null)) as
        | {
            status?: boolean;
            data?: Array<{
              code?: string;
              active?: boolean;
              is_deleted?: boolean;
            }>;
            meta?: { next?: string | null };
          }
        | null;

      if (
        !bankListResponse.ok ||
        !bankListData?.status ||
        !Array.isArray(bankListData.data)
      ) {
        console.error("Marketplace payout bank validation failed.");
        return response(
          { error: "Unable to verify the selected bank. Please try again." },
          502,
        );
      }

      selectedBankIsValid = bankListData.data.some(
        (bank) =>
          bank.code === bankCode &&
          bank.active === true &&
          bank.is_deleted !== true,
      );

      if (selectedBankIsValid) {
        break;
      }

      const returnedCursor =
        typeof bankListData.meta?.next === "string"
          ? bankListData.meta.next
          : null;

      if (!returnedCursor) {
        paginationComplete = true;
        break;
      }

      if (visitedCursors.has(returnedCursor)) {
        console.error("Marketplace payout bank-list cursor repeated.");
        return response(
          { error: "Unable to verify the selected bank. Please try again." },
          502,
        );
      }

      visitedCursors.add(returnedCursor);
      nextCursor = returnedCursor;

      if (page === 9) {
        console.error("Marketplace payout bank-list pagination limit reached.");
        return response(
          { error: "Bank verification is incomplete. Please try again later." },
          502,
        );
      }
    }

    if (!selectedBankIsValid && !paginationComplete) {
      return response(
        { error: "Bank verification is incomplete. Please try again later." },
        502,
      );
    }

    if (!selectedBankIsValid) {
      return response(
        { error: "Select an active Nigerian bank from the supported bank list." },
        400,
      );
    }
    if (!/^\d{10}$/.test(accountNumber)) {
      return response({ error: "Enter a valid 10-digit Nigerian bank account number." }, 400);
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select(
        "id, business_name, contact_name, contact_email, contact_phone, verification_status, payout_status, payout_bank_code, payout_account_last4, payout_subaccount_code",
      )
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Marketplace payout profile lookup failed:", profileError.message);
      return response({ error: "Unable to verify your supplier profile." }, 500);
    }

    if (!profile || profile.verification_status !== "approved") {
      return response({
        error: "Only approved suppliers can configure payout details.",
      }, 403);
    }

    // Do not create a second subaccount or silently replace an active payout account.
    if (
      profile.payout_status === "active" &&
      profile.payout_subaccount_code
    ) {
      return response({
        error: "A payout account is already configured. Contact Samiz support to change it.",
      }, 409);
    }

    const headers = {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    };

    const resolveUrl = new URL("https://api.paystack.co/bank/resolve");
    resolveUrl.searchParams.set("account_number", accountNumber);
    resolveUrl.searchParams.set("bank_code", bankCode);

    const resolveResponse = await fetch(resolveUrl.toString(), {
      method: "GET",
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const resolveData = (await resolveResponse.json()) as PaystackResult;

    if (
      !resolveResponse.ok ||
      !resolveData.status ||
      !resolveData.data?.account_name
    ) {
      return response({
        error: "Paystack could not verify that account. Check the bank and account number.",
      }, 422);
    }

    const resolvedName = resolveData.data.account_name.trim();
    const businessName =
      typeof profile.business_name === "string"
        ? profile.business_name.trim()
        : "";

    if (!businessName) {
      return response({ error: "Complete your supplier business profile first." }, 422);
    }

    // Atomically claim payout setup before creating a remote subaccount.
    // A pending claim blocks concurrent requests and unsafe retries.
    const { data: claim, error: claimError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .update({
        payout_status: "pending",
        payout_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .in("payout_status", ["not_configured", "failed"])
      .is("payout_subaccount_code", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      console.error("Marketplace payout claim failed:", claimError.message);
      return response(
        { error: "Unable to reserve payout setup. Please try again later." },
        500,
      );
    }

    if (!claim) {
      return response(
        {
          error:
            "Payout setup is already active or in progress. If a previous attempt failed, contact Samiz support before retrying.",
        },
        409,
      );
    }
    const subaccountResponse = await fetch(
      "https://api.paystack.co/subaccount",
      {
        method: "POST",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          business_name: businessName,
          settlement_bank: bankCode,
          account_number: accountNumber,
          percentage_charge: 5,
          description: "Samiz marketplace supplier settlement",
          primary_contact_name: profile.contact_name ?? undefined,
          primary_contact_email: profile.contact_email ?? user.email ?? undefined,
          primary_contact_phone: profile.contact_phone ?? undefined,
        }),
      },
    );

    const subaccountData =
      (await subaccountResponse.json()) as PaystackResult;

    if (
      !subaccountResponse.ok ||
      !subaccountData.status ||
      !subaccountData.data?.subaccount_code ||
      subaccountData.data.active !== true
    ) {
      console.error(
        "Marketplace payout subaccount creation failed:",
        subaccountData.message ?? "Invalid Paystack response",
      );

      // Keep the claim pending: a failed or ambiguous HTTP response does
      // not prove that Paystack did not create a remote subaccount.
      // Reconcile with Paystack before allowing another creation attempt.
      return response({
        error:
          "Paystack did not confirm payout setup. The request is on hold to prevent duplicate subaccounts. Contact Samiz support before retrying.",
      }, 502);
    }

    const { error: updateError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .update({
        payout_bank_code: bankCode,
        payout_bank_name: subaccountData.data.settlement_bank ?? bankCode,
        payout_account_name: resolvedName,
        payout_account_last4: accountNumber.slice(-4),
        payout_subaccount_code: subaccountData.data.subaccount_code,
        payout_status: "active",
        payout_updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      // The remote subaccount may exist, but checkout remains blocked because
      // the trusted database record was not saved successfully.
      console.error(
        "Marketplace payout database update failed:",
        updateError.message,
      );

      return response({
        error: "The payout account was created but could not be saved. Contact Samiz support before retrying.",
      }, 500);
    }

    return response({
      success: true,
      payout: {
        status: "active",
        bankCode,
        accountName: resolvedName,
        accountLast4: accountNumber.slice(-4),
      },
      message: "Payout account configured successfully.",
    });
  } catch (error) {
    console.error(
      "Marketplace payout setup failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return response({ error: "Unable to configure the payout account right now." }, 500);
  }
}
