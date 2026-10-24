import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getMarketplaceAdPackage } from "@/lib/marketplace/advertising-packages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return respond({ error: "Admin authentication required." }, 401);
    }

    const { data: campaigns, error } = await supabaseAdmin
      .from("marketplace_ad_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Admin advertising: campaign queue lookup failed.");
      return respond({ error: "Unable to load advertising campaigns." }, 500);
    }

    const supplierIds = [
      ...new Set((campaigns ?? []).map((campaign) => campaign.supplier_id)),
    ];

    let supplierMap: Record<string, { business_name: string | null }> = {};

    if (supplierIds.length > 0) {
      const { data: suppliers, error: supplierError } = await supabaseAdmin
        .from("marketplace_supplier_profiles")
        .select("id, business_name")
        .in("id", supplierIds);

      if (supplierError) {
        console.error("Admin advertising: supplier lookup failed.");
        return respond({ error: "Unable to load campaign supplier details." }, 500);
      }

      supplierMap = Object.fromEntries(
        (suppliers ?? []).map((supplier) => [
          supplier.id,
          { business_name: supplier.business_name ?? null },
        ]),
      );
    }

    return respond({
      success: true,
      campaigns: (campaigns ?? []).map((campaign) => ({
        ...campaign,
        supplier: supplierMap[campaign.supplier_id] ?? null,
      })),
    });
  } catch {
    console.error("Admin advertising: unexpected queue failure.");
    return respond({ error: "Unable to load advertising campaigns." }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminAuthenticated())) {
      return respond({ error: "Admin authentication required." }, 401);
    }

    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    if (
      !request.headers.get("content-type")?.toLowerCase().includes("application/json")
    ) {
      return respond({ error: "Content-Type must be application/json." }, 415);
    }

    let parsed: unknown;

    try {
      parsed = await request.json();
    } catch {
      return respond({ error: "A valid JSON body is required." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return respond({ error: "Invalid review request." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const campaignId = typeof body.campaignId === "string" ? body.campaignId.trim() : "";
    const action = typeof body.action === "string" ? body.action : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!isUuid(campaignId)) {
      return respond({ error: "A valid campaign ID is required." }, 400);
    }

    if (action !== "approve" && action !== "reject") {
      return respond({ error: "Action must be approve or reject." }, 400);
    }

    if (note.length > 1000) {
      return respond({ error: "Review note must not exceed 1,000 characters." }, 400);
    }

    if (action === "reject" && note.length === 0) {
      return respond({ error: "Provide a reason when rejecting a campaign." }, 400);
    }

    const { data: campaign, error: lookupError } = await supabaseAdmin
      .from("marketplace_ad_campaigns")
      .select("id, supplier_id, package_id, payment_status, campaign_status")
      .eq("id", campaignId)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin advertising: review lookup failed.");
      return respond({ error: "Unable to retrieve the campaign for review." }, 500);
    }

    if (!campaign) {
      return respond({ error: "Campaign not found." }, 404);
    }

    if (
      campaign.payment_status !== "paid" ||
      campaign.campaign_status !== "pending_review"
    ) {
      return respond({
        error: "Only paid campaigns awaiting review can be approved or rejected.",
        paymentStatus: campaign.payment_status,
        campaignStatus: campaign.campaign_status,
      }, 409);
    }

    const now = new Date();
    const reviewedAt = now.toISOString();

    let update: Record<string, unknown>;

    if (action === "approve") {
      const campaignPackage = getMarketplaceAdPackage(campaign.package_id);

      if (!campaignPackage) {
        return respond({
          error: "The campaign package is not recognised. Review it manually.",
        }, 409);
      }

      const endsAt = new Date(
        now.getTime() + campaignPackage.durationDays * 24 * 60 * 60 * 1000,
      );

      update = {
        campaign_status: "approved",
        starts_at: reviewedAt,
        ends_at: endsAt.toISOString(),
        admin_review_note: note || null,
        reviewed_by: "admin",
        reviewed_at: reviewedAt,
        updated_at: reviewedAt,
      };
    } else {
      update = {
        campaign_status: "rejected",
        admin_review_note: note,
        reviewed_by: "admin",
        reviewed_at: reviewedAt,
        updated_at: reviewedAt,
      };
    }

    const { data: updatedCampaign, error: updateError } = await supabaseAdmin
      .from("marketplace_ad_campaigns")
      .update(update)
      .eq("id", campaignId)
      .eq("payment_status", "paid")
      .eq("campaign_status", "pending_review")
      .select("id, payment_status, campaign_status, starts_at, ends_at, admin_review_note, reviewed_at")
      .maybeSingle();

    if (updateError) {
      console.error("Admin advertising: campaign review update failed.");
      return respond({ error: "Unable to save the campaign review." }, 500);
    }

    if (!updatedCampaign) {
      return respond({
        error: "The campaign was changed by another action. Refresh the queue before reviewing it again.",
      }, 409);
    }

    return respond({
      success: true,
      campaign: updatedCampaign,
      message: action === "approve"
        ? "Campaign approved. Its seven-day period starts now."
        : "Campaign rejected. The payment has not been refunded.",
    });
  } catch {
    console.error("Admin advertising: unexpected review failure.");
    return respond({ error: "Unable to process the campaign review." }, 500);
  }
}
