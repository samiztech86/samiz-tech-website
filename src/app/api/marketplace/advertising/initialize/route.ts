import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";
import { supabaseServer } from "@/lib/supabase/server";
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

function safeHttpsUrl(value: unknown, maxLength = 2048): string | null {
  if (typeof value !== "string" || value.length > maxLength) return null;

  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

type PaystackInitializeResult = {
  status?: boolean;
  message?: string;
  data?: {
    authorization_url?: string;
    reference?: string;
  };
};

export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
      return respond({ error: "Cross-origin request rejected." }, 403);
    }

    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return respond({ error: "Content-Type must be application/json." }, 415);
    }

    const authClient = await createSupabaseRouteHandlerClient();
    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData.user) {
      return respond({ error: "Please sign in to create an advertising campaign." }, 401);
    }

    const email = authData.user.email?.trim().toLowerCase() ?? "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return respond({ error: "Your account needs a valid email address for payment." }, 400);
    }

    let parsed: unknown;
    try {
      parsed = await request.json();
    } catch {
      return respond({ error: "A valid JSON request body is required." }, 400);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return respond({ error: "Invalid campaign details." }, 400);
    }

    const body = parsed as Record<string, unknown>;
    const creativeMode = body.creativeMode;
    if (creativeMode !== "product" && creativeMode !== "custom") {
      return respond({ error: "Select an advert type." }, 400);
    }

    const packageId = typeof body.packageId === "string" ? body.packageId : "";
    const campaignPackage = getMarketplaceAdPackage(packageId);

    if (!campaignPackage) {
      return respond({ error: "Select a valid advertising package." }, 400);
    }

    const headline = typeof body.headline === "string" ? body.headline.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const placement = typeof body.placement === "string" ? body.placement : "";
    const imageUrl = safeHttpsUrl(body.imageUrl);
    const targetUrl = safeHttpsUrl(body.targetUrl);
    const productId = body.productId === undefined || body.productId === null || body.productId === ""
      ? null
      : typeof body.productId === "string" ? body.productId.trim() : "invalid";

    if (headline.length < 1 || headline.length > 160) {
      return respond({ error: "Headline must be between 1 and 160 characters." }, 400);
    }

    if (description.length > 2000) {
      return respond({ error: "Description must not exceed 2,000 characters." }, 400);
    }

    if (placement !== campaignPackage.placement) {
      return respond({ error: "Placement does not match the selected package." }, 400);
    }

    if (!imageUrl || !targetUrl) {
      return respond({ error: "Provide valid HTTPS image and destination URLs." }, 400);
    }

    if (creativeMode === "product" && productId === null) {
      return respond({ error: "Select one of your approved marketplace products." }, 400);
    }

    if (productId !== null && (typeof productId !== "string" || !isUuid(productId))) {
      return respond({ error: "Product ID must be a valid UUID." }, 400);
    }

    if (creativeMode === "custom" && productId !== null) {
      return respond({ error: "Custom adverts must not include a product ID." }, 400);
    }
    const { data: supplier, error: supplierError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, verification_status, business_name")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (supplierError) {
      console.error("Advertising: supplier eligibility lookup failed.");
      return respond({ error: "Unable to verify supplier approval." }, 500);
    }

    if (!supplier || supplier.verification_status !== "approved") {
      return respond({ error: "Only approved marketplace suppliers can advertise." }, 403);
    }

    if (creativeMode === "product") {
      const { data: product, error: productError } = await supabaseServer
        .from("marketplace_products")
        .select("id, supplier_id, product_status, is_listed, slug, image_urls")
        .eq("id", productId!)
        .eq("supplier_id", authData.user.id)
        .maybeSingle();

      if (productError) {
        console.error("Advertising: linked product lookup failed.");
        return respond({ error: "Unable to validate the selected product." }, 500);
      }

      if (
        !product ||
        product.product_status !== "approved" ||
        product.is_listed !== true ||
        typeof product.slug !== "string" ||
        !product.slug.trim()
      ) {
        return respond({
          error: "The selected product must belong to you and be approved, listed, and publicly accessible.",
        }, 400);
      }

      const firstPublicImage = Array.isArray(product.image_urls)
        ? product.image_urls.find(
            (value: unknown) =>
              typeof value === "string" && /^https?:\/\//i.test(value),
          )
        : null;

      const verifiedImageUrl = safeHttpsUrl(firstPublicImage);
      const verifiedTargetUrl = safeHttpsUrl(
        `https://www.samiztech.com.ng/marketplace/products/${product.slug}`,
      );

      if (
        !verifiedImageUrl ||
        !verifiedTargetUrl ||
        imageUrl !== verifiedImageUrl ||
        targetUrl !== verifiedTargetUrl
      ) {
        return respond({
          error: "The advert image and destination must match the selected product's public listing.",
        }, 400);
      }
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!secretKey || !configuredAppUrl) {
      console.error("Advertising: required payment configuration is missing.");
      return respond({ error: "Advertising payments are not configured." }, 500);
    }

    let appUrl: URL;
    try {
      appUrl = new URL(configuredAppUrl);
    } catch {
      return respond({ error: "Advertising payment configuration is invalid." }, 500);
    }

    const localHost = appUrl.hostname === "localhost" || appUrl.hostname === "127.0.0.1";
    if (
      appUrl.username ||
      appUrl.password ||
      (appUrl.protocol !== "https:" && !(localHost && appUrl.protocol === "http:"))
    ) {
      return respond({ error: "Advertising payment configuration is invalid." }, 500);
    }

    const reference = `samiz-ad-${Date.now()}-${crypto.randomUUID()}`;

    const { data: campaign, error: insertError } = await supabaseServer
      .from("marketplace_ad_campaigns")
      .insert({
        supplier_id: authData.user.id,
        product_id: productId,
        package_id: campaignPackage.id,
        package_name: campaignPackage.name,
        amount_kobo: campaignPackage.amountKobo,
        currency: "NGN",
        headline,
        description: description || null,
        image_url: imageUrl,
        target_url: targetUrl,
        placement: campaignPackage.placement,
        payment_status: "pending",
        campaign_status: "pending_review",
        paystack_reference: reference,
      })
      .select("id, package_id, package_name, amount_kobo, currency, payment_status, campaign_status, paystack_reference")
      .single();

    if (insertError || !campaign) {
      console.error("Advertising: campaign record creation failed.");
      return respond({ error: "Unable to create the campaign. Please try again." }, 500);
    }

    const callbackUrl = new URL("/marketplace/advertising/payment/callback", appUrl).toString();

    let gatewayResponse: Response;
    try {
      gatewayResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
        body: JSON.stringify({
          email,
          amount: campaignPackage.amountKobo,
          currency: "NGN",
          reference,
          callback_url: callbackUrl,
          metadata: {
            product: "samiz-marketplace-advertising",
            campaign_id: campaign.id,
            supplier_id: authData.user.id,
            package_id: campaignPackage.id,
            package_name: campaignPackage.name,
            duration_days: campaignPackage.durationDays,
          },
        }),
      });
    } catch {
      // The gateway may have accepted the request before the connection failed.
      // Keep the campaign pending for reconciliation; do not claim payment failed.
      console.error("Advertising: Paystack initialization outcome is uncertain.");
      return respond({
        error: "We could not confirm checkout initialization. Do not retry repeatedly; contact support with this reference.",
        campaignId: campaign.id,
        reference,
        paymentStatus: "pending",
      }, 502);
    }

    let gatewayResult: PaystackInitializeResult | null = null;
    try {
      gatewayResult = await gatewayResponse.json() as PaystackInitializeResult;
    } catch {
      // An unreadable response is not proof that the transaction was not created.
    }

    if (gatewayResult?.status === false) {
      const { error: updateError } = await supabaseServer
        .from("marketplace_ad_campaigns")
        .update({
          payment_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaign.id)
        .eq("payment_status", "pending");

      if (updateError) {
        console.error("Advertising: explicit Paystack rejection could not be recorded.");
      }

      return respond({
        error: "Paystack could not initialize this payment. Please try again.",
        campaignId: campaign.id,
        paymentStatus: updateError ? "pending" : "failed",
      }, 502);
    }

    const authorizationUrl = gatewayResult?.data?.authorization_url;
    const returnedReference = gatewayResult?.data?.reference;

    if (
      !gatewayResponse.ok ||
      gatewayResult?.status !== true ||
      returnedReference !== reference ||
      typeof authorizationUrl !== "string"
    ) {
      console.error("Advertising: Paystack initialization needs reconciliation.");
      return respond({
        error: "Payment initialization could not be confirmed. Contact support before retrying.",
        campaignId: campaign.id,
        reference,
        paymentStatus: "pending",
      }, 502);
    }

    let checkoutUrl: URL;
    try {
      checkoutUrl = new URL(authorizationUrl);
    } catch {
      return respond({
        error: "Payment initialization needs support review. Do not retry yet.",
        campaignId: campaign.id,
        reference,
        paymentStatus: "pending",
      }, 502);
    }

    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.paystack.com") {
      return respond({
        error: "Payment initialization needs support review. Do not retry yet.",
        campaignId: campaign.id,
        reference,
        paymentStatus: "pending",
      }, 502);
    }

    return respond({
      success: true,
      campaignId: campaign.id,
      packageId: campaignPackage.id,
      packageName: campaignPackage.name,
      amountKobo: campaignPackage.amountKobo,
      currency: "NGN",
      durationDays: campaignPackage.durationDays,
      checkoutUrl: checkoutUrl.toString(),
      reference,
      paymentStatus: "pending",
    });
  } catch {
    console.error("Unexpected advertising initialization failure.");
    return respond({ error: "Unable to initialize advertising payment." }, 500);
  }
}
