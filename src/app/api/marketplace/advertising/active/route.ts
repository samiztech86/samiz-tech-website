import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PLACEMENTS = ["homepage_banner", "marketplace_featured"] as const;
type PublicPlacement = (typeof ALLOWED_PLACEMENTS)[number];

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isSafeHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const placement = url.searchParams.get("placement");

    if (!placement || !ALLOWED_PLACEMENTS.includes(placement as PublicPlacement)) {
      return respond({
        success: false,
        error: "A supported advertising placement is required.",
        campaigns: [],
      }, 400);
    }

    const now = new Date().toISOString();
    const limit = placement === "homepage_banner" ? 1 : 3;

    const { data, error } = await supabaseAdmin
      .from("marketplace_ad_campaigns")
      .select("id, headline, description, image_url, target_url, placement, starts_at, ends_at")
      .eq("placement", placement)
      .eq("payment_status", "paid")
      .eq("campaign_status", "approved")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Public advertising: active campaign lookup failed.");
      return respond({
        success: false,
        error: "Unable to load sponsored placements.",
        campaigns: [],
      }, 500);
    }

    const campaigns = (data ?? [])
      .filter((campaign) =>
        isSafeHttpsUrl(campaign.image_url) &&
        isSafeHttpsUrl(campaign.target_url) &&
        campaign.placement === placement
      )
      .map((campaign) => ({
        id: campaign.id,
        headline: campaign.headline,
        description: campaign.description,
        image_url: campaign.image_url,
        target_url: campaign.target_url,
        placement: campaign.placement,
        starts_at: campaign.starts_at,
        ends_at: campaign.ends_at,
      }));

    return respond({ success: true, campaigns });
  } catch {
    console.error("Public advertising: unexpected serving failure.");
    return respond({
      success: false,
      error: "Unable to load sponsored placements.",
      campaigns: [],
    }, 500);
  }
}
