import "server-only";

import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackBank = {
  name?: string;
  code?: string;
  active?: boolean;
  is_deleted?: boolean;
};

type PaystackBankResponse = {
  status?: boolean;
  message?: string;
  data?: PaystackBank[];
  meta?: {
    next?: string | null;
  };
};

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  try {
    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } =
      await authClient.auth.getUser();

    if (authError || !authData.user) {
      return json({ error: "Please sign in to continue." }, 401);
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("verification_status")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "Marketplace bank-list profile lookup failed:",
        profileError.message,
      );
      return json({ error: "Unable to verify your supplier profile." }, 500);
    }

    if (!profile || profile.verification_status !== "approved") {
      return json(
        { error: "Only approved suppliers can configure payout details." },
        403,
      );
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("Marketplace bank list: Paystack is not configured.");
      return json({ error: "Bank-list service is not configured." }, 500);
    }

    const banks = new Map<string, { name: string; code: string }>();
    let nextCursor: string | null = null;
    const visitedCursors = new Set<string>();

    // Bound pagination so an unexpected response cannot cause an endless loop.
    for (let page = 0; page < 10; page += 1) {
      const url = new URL("https://api.paystack.co/bank");
      url.searchParams.set("country", "nigeria");
      url.searchParams.set("currency", "NGN");
      url.searchParams.set("perPage", "100");
      url.searchParams.set("use_cursor", "true");

      if (nextCursor) {
        url.searchParams.set("next", nextCursor);
      }

      const upstream = await fetch(url.toString(), {
        method: "GET",
        headers: { Authorization: `Bearer ${secretKey}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });

      const result = (await upstream.json()) as PaystackBankResponse;

      if (!upstream.ok || !result.status || !Array.isArray(result.data)) {
        console.error(
          "Marketplace bank-list request failed:",
          result.message ?? `HTTP ${upstream.status}`,
        );
        return json({ error: "Unable to retrieve supported banks." }, 502);
      }

      for (const bank of result.data) {
        const name = typeof bank.name === "string" ? bank.name.trim() : "";
        const code = typeof bank.code === "string" ? bank.code.trim() : "";

        if (
          name &&
          code &&
          bank.active === true &&
          bank.is_deleted !== true
        ) {
          banks.set(code, { name, code });
        }
      }

      const returnedCursor =
        typeof result.meta?.next === "string" ? result.meta.next : null;

      if (!returnedCursor) {
        nextCursor = null;
        break;
      }

      if (visitedCursors.has(returnedCursor)) {
        console.error("Marketplace bank-list pagination cursor repeated.");
        return json({ error: "Unable to retrieve the complete bank list." }, 502);
      }

      visitedCursors.add(returnedCursor);
      nextCursor = returnedCursor;

      if (page === 9) {
        console.error("Marketplace bank list exceeded the pagination limit.");
        return json(
          { error: "Bank list is incomplete. Please try again later." },
          502,
        );
      }
    }

    const data = [...banks.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    return json({ banks: data });
  } catch (error) {
    console.error(
      "Marketplace bank-list request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return json({ error: "Unable to retrieve supported banks." }, 502);
  }
}