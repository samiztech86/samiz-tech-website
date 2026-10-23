import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

type PaystackVerificationResult = {
  status?: boolean;
  message?: string;
  data?: {
    id?: number;
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    paid_at?: string | null;
    metadata?: {
      product?: string;
      campaign_id?: string;
      supplier_id?: string;
      package_id?: string;
    } | null;
  };
};

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    if (
      !request.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json")
    ) {
      return respond(
        { error: "Content-Type must be application/json." },
        415,
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return respond({ error: "A valid JSON body is required." }, 400);
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return respond({ error: "Invalid verification request." }, 400);
    }

    const reference =
      typeof (body as Record<string, unknown>).reference === "string"
        ? ((body as Record<string, unknown>).reference as string).trim()
        : "";

    if (
      reference.length > 200 ||
      !/^samiz-ad-[0-9]{10,}-[0-9a-f-]{36}$/i.test(reference)
    ) {
      return respond({ error: "Invalid advertising payment reference." }, 400);
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;

    if (!secretKey) {
      console.error("Advertising verification: Paystack configuration missing.");
      return respond({ error: "Payment verification is not configured." }, 500);
    }

    const { data: campaign, error: campaignError } = await supabaseServer
      .from("marketplace_ad_campaigns")
      .select(
        "id, supplier_id, package_id, amount_kobo, currency, payment_status, campaign_status, paystack_reference, paystack_transaction_id, paid_at",
      )
      .eq("paystack_reference", reference)
      .maybeSingle();

    if (campaignError) {
      console.error("Advertising verification: campaign lookup failed.");
      return respond({ error: "Unable to locate the advertising payment." }, 500);
    }

    if (!campaign) {
      return respond({ error: "Advertising payment reference not found." }, 404);
    }

    let gatewayResponse: Response;

    try {
      gatewayResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${secretKey}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: AbortSignal.timeout(20000),
        },
      );
    } catch {
      console.error("Advertising verification: Paystack request failed.");
      return respond(
        {
          error: "We could not reach Paystack. Please retry verification later.",
          verified: false,
          reference,
        },
        502,
      );
    }

    let gatewayResult: PaystackVerificationResult;

    try {
      gatewayResult =
        (await gatewayResponse.json()) as PaystackVerificationResult;
    } catch {
      return respond(
        {
          error: "Paystack returned an unreadable verification response.",
          verified: false,
          reference,
        },
        502,
      );
    }

    if (!gatewayResponse.ok || gatewayResult.status !== true) {
      return respond(
        {
          error: "Paystack could not confirm this transaction.",
          verified: false,
          reference,
        },
        502,
      );
    }

    const transaction = gatewayResult.data;

    if (!transaction) {
      return respond(
        { error: "Paystack returned no transaction data.", verified: false },
        502,
      );
    }

    if (transaction.status !== "success") {
      return respond({
        success: true,
        verified: false,
        paymentStatus: campaign.payment_status,
        transactionStatus: transaction.status ?? "unknown",
        reference,
      });
    }

    const metadata = transaction.metadata;

    if (
      transaction.reference !== reference ||
      !Number.isSafeInteger(transaction.id) ||
      Number(transaction.id) <= 0 ||
      !Number.isSafeInteger(transaction.amount) ||
      Number(transaction.amount) !== Number(campaign.amount_kobo) ||
      transaction.currency !== "NGN" ||
      campaign.currency !== "NGN" ||
      metadata?.product !== "samiz-marketplace-advertising" ||
      metadata.campaign_id !== campaign.id ||
      metadata.supplier_id !== campaign.supplier_id ||
      metadata.package_id !== campaign.package_id
    ) {
      console.error(
        "Advertising verification: transaction details did not match the stored campaign.",
      );

      return respond(
        {
          error:
            "Payment details could not be matched to this campaign. Contact Samiz support with your reference.",
          verified: false,
          reference,
        },
        409,
      );
    }

    if (campaign.payment_status === "paid") {
      if (Number(campaign.paystack_transaction_id) !== transaction.id) {
        console.error(
          "Advertising verification: paid campaign has a transaction ID mismatch.",
        );

        return respond(
          {
            error:
              "This campaign is marked paid, but its transaction requires support review.",
            verified: false,
            reference,
          },
          409,
        );
      }

      return respond({
        success: true,
        verified: true,
        campaignId: campaign.id,
        paymentStatus: "paid",
        campaignStatus: campaign.campaign_status,
        reference,
        paidAt: campaign.paid_at,
        message:
          "Payment is confirmed. The campaign remains subject to admin approval.",
      });
    }

    if (campaign.payment_status !== "pending") {
      return respond(
        {
          error:
            "This campaign payment requires support review before it can be updated.",
          paymentStatus: campaign.payment_status,
          reference,
        },
        409,
      );
    }

    const paidAt =
      transaction.paid_at && Number.isFinite(Date.parse(transaction.paid_at))
        ? new Date(transaction.paid_at).toISOString()
        : new Date().toISOString();

    const { data: updatedCampaign, error: updateError } =
      await supabaseServer
        .from("marketplace_ad_campaigns")
        .update({
          payment_status: "paid",
          paystack_transaction_id: transaction.id,
          paid_at: paidAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("paystack_reference", reference)
        .eq("payment_status", "pending")
        .select(
          "id, payment_status, campaign_status, paystack_transaction_id, paid_at",
        )
        .maybeSingle();

    if (updateError) {
      console.error(
        "Advertising verification: Paystack payment was verified, but the campaign update failed.",
      );

      return respond(
        {
          error:
            "Payment was verified, but the campaign record could not be updated. Contact Samiz support with your reference.",
          verified: true,
          reference,
        },
        500,
      );
    }

    if (!updatedCampaign) {
      const { data: latestCampaign, error: latestError } =
        await supabaseServer
          .from("marketplace_ad_campaigns")
          .select(
            "id, payment_status, campaign_status, paystack_transaction_id, paid_at",
          )
          .eq("id", campaign.id)
          .eq("paystack_reference", reference)
          .maybeSingle();

      if (
        latestError ||
        !latestCampaign ||
        latestCampaign.payment_status !== "paid" ||
        Number(latestCampaign.paystack_transaction_id) !== transaction.id
      ) {
        console.error(
          "Advertising verification: concurrent update requires reconciliation.",
        );

        return respond(
          {
            error:
              "Payment was verified, but the campaign update requires support review.",
            verified: true,
            reference,
          },
          500,
        );
      }

      return respond({
        success: true,
        verified: true,
        campaignId: latestCampaign.id,
        paymentStatus: "paid",
        campaignStatus: latestCampaign.campaign_status,
        reference,
        paidAt: latestCampaign.paid_at,
        message:
          "Payment is confirmed. The campaign remains subject to admin approval.",
      });
    }

    return respond({
      success: true,
      verified: true,
      campaignId: updatedCampaign.id,
      paymentStatus: "paid",
      campaignStatus: updatedCampaign.campaign_status,
      reference,
      paidAt: updatedCampaign.paid_at,
      message:
        "Payment is confirmed. The campaign remains subject to admin approval.",
    });
  } catch {
    console.error("Unexpected advertising payment verification failure.");
    return respond(
      { error: "Unable to verify the advertising payment." },
      500,
    );
  }
}
