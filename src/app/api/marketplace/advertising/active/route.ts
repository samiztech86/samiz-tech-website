import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PLACEMENTS = [
  "homepage_banner",
  "marketplace_featured",
  "category_featured",
] as const;

const ALLOWED_CATEGORIES = [
  "solar_backup_power",
  "electrical_materials",
  "industrial_distribution",
  "smart_energy_automation",
  "tools_accessories",
] as const;

type PublicPlacement = (typeof ALLOWED_PLACEMENTS)[number];
type SupportedCategory = (typeof ALLOWED_CATEGORIES)[number];

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

function isSupportedCategory(value: string | null): value is SupportedCategory {
  return value !== null &&
    (ALLOWED_CATEGORIES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const placement = url.searchParams.get("placement");
    const requestedCategory = url.searchParams.get("category");

    if (!placement || !ALLOWED_PLACEMENTS.includes(placement as PublicPlacement)) {
      return respond({
        success: false,
        error: "A supported advertising placement is required.",
        campaigns: [],
      }, 400);
    }

    if (
      placement === "category_featured" &&
      !isSupportedCategory(requestedCategory)
    ) {
      return respond({
        success: false,
        error: "A supported marketplace category is required.",
        campaigns: [],
      }, 400);
    }

    const now = new Date().toISOString();
    const isCategoryPlacement = placement === "category_featured";
    const limit = placement === "homepage_banner" ? 1 : 3;

    let campaignQuery = supabaseAdmin
      .from("marketplace_ad_campaigns")
      .select(
        "id, product_id, headline, description, image_url, target_url, placement, starts_at, ends_at",
      )
      .eq("placement", placement)
      .eq("payment_status", "paid")
      .eq("campaign_status", "approved")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("starts_at", { ascending: true });

    // Fetch candidates before applying the category filter so unrelated
    // category campaigns do not consume the three displayed slots.
    campaignQuery = campaignQuery.limit(isCategoryPlacement ? 1000 : limit);

    const { data, error } = await campaignQuery;

    if (error) {
      console.error("Public advertising: active campaign lookup failed.");
      return respond({
        success: false,
        error: "Unable to load sponsored placements.",
        campaigns: [],
      }, 500);
    }

    let eligibleCampaigns = data ?? [];

    if (isCategoryPlacement) {
      const productIds = [
        ...new Set(
          eligibleCampaigns
            .map((campaign) => campaign.product_id)
            .filter((id): id is string => typeof id === "string" && id.length > 0),
        ),
      ];

      if (productIds.length === 0) {
        return respond({ success: true, campaigns: [] });
      }

      const { data: products, error: productsError } = await supabaseAdmin
        .from("marketplace_products")
        .select("id, category, product_status, is_listed")
        .in("id", productIds);

      if (productsError || !products) {
        console.error("Public advertising: linked product validation failed.");
        return respond({
          success: false,
          error: "Unable to validate sponsored marketplace products.",
          campaigns: [],
        }, 500);
      }

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      eligibleCampaigns = eligibleCampaigns.filter((campaign) => {
        if (!campaign.product_id) return false;

        const product = productsById.get(campaign.product_id);

        return Boolean(
          product &&
          product.product_status === "approved" &&
          product.is_listed === true &&
          product.category === requestedCategory
        );
      });
    }

    const campaigns = eligibleCampaigns
      .filter((campaign) =>
        isSafeHttpsUrl(campaign.image_url) &&
        isSafeHttpsUrl(campaign.target_url) &&
        campaign.placement === placement
      )
      .slice(0, limit)
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