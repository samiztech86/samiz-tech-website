"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

const packages = [
  {
    id: "marketplace_featured",
    name: "Marketplace Featured",
    placement: "marketplace_featured",
    price: 15000,
    description: "Featured visibility in the marketplace.",
  },
  {
    id: "category_featured",
    name: "Category Featured",
    placement: "category_featured",
    price: 25000,
    description: "Featured placement within the relevant category.",
  },
  {
    id: "homepage_banner",
    name: "Homepage Banner",
    placement: "homepage_banner",
    price: 50000,
    description: "Banner advertising on the marketplace homepage.",
  },
] as const;

type PackageId = (typeof packages)[number]["id"];

type InitializeResponse = {
  success?: boolean;
  error?: string;
  checkoutUrl?: string;
  reference?: string;
};

type SupplierProductForAd = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  product_status: string;
  is_listed: boolean;
  image_urls: string[] | null;
  imageUrl: string;
  targetUrl: string;
};

type SupplierDashboardProductsResponse = {
  products?: Array<{
    id: string;
    name: string;
    slug?: string | null;
    description?: string | null;
    product_status: string;
    is_listed: boolean;
    image_urls: string[] | null;
  }>;
  error?: string;
};

type AdvertisingCampaign = {
  id: string;
  package_id: string;
  package_name: string;
  amount_kobo: number;
  currency: string;
  placement: string;
  headline: string;
  payment_status: string;
  campaign_status: string;
  paystack_reference: string;
  paid_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  admin_review_note: string | null;
  created_at: string;
};

type CampaignHistoryResponse = {
  success?: boolean;
  campaigns?: AdvertisingCampaign[];
  error?: string;
};

function readableStatus(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCampaignDate(value: string | null): string {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export default function MarketplaceAdvertisingPage() {
  const [packageId, setPackageId] = useState<PackageId>("marketplace_featured");
  const [advertMode, setAdvertMode] = useState<"product" | "custom">("product");  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [adProducts, setAdProducts] = useState<SupplierProductForAd[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState("");

  const selectedPackage = packages.find((item) => item.id === packageId)!;

  const loadCampaigns = useCallback(async () => {
    setCampaignsError("");

    try {
      const response = await fetch("/api/marketplace/advertising/campaigns", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const result = (await response.json()) as CampaignHistoryResponse;

      if (!response.ok || !result.success || !Array.isArray(result.campaigns)) {
        setCampaignsError(
          result.error || "Unable to load campaign history. Please refresh and try again.",
        );
        return;
      }

      setCampaigns(result.campaigns);
    } catch {
      setCampaignsError("Could not reach the campaign history service.");
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCampaigns();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadCampaigns]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdvertisingProducts() {
      setProductsLoading(true);
      setProductsError("");

      try {
        const response = await fetch("/api/marketplace/supplier/dashboard", {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const payload =
          (await response.json()) as SupplierDashboardProductsResponse;

        if (!response.ok || !Array.isArray(payload.products)) {
          throw new Error(
            payload.error || "Unable to load your marketplace products.",
          );
        }

        const eligible = payload.products.flatMap((product) => {
          if (
            product.product_status !== "approved" ||
            product.is_listed !== true ||
            typeof product.slug !== "string" ||
            !product.slug.trim()
          ) {
            return [];
          }

          // Match the first HTTP(S) image used by the public product page.
          const firstPublicImage = Array.isArray(product.image_urls)
            ? product.image_urls.find(
                (value) =>
                  typeof value === "string" && /^https?:\/\//i.test(value),
              )
            : undefined;

          if (!firstPublicImage || !isHttpsUrl(firstPublicImage)) {
            return [];
          }

          const targetUrl =
            "https://www.samiztech.com.ng/marketplace/products/" +
            product.slug;

          if (!isHttpsUrl(targetUrl)) return [];

          return [{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description ?? null,
            product_status: product.product_status,
            is_listed: product.is_listed,
            image_urls: product.image_urls,
            imageUrl: firstPublicImage,
            targetUrl,
          }];
        });

        if (!cancelled) setAdProducts(eligible);
      } catch (loadError) {
        if (!cancelled) {
          setProductsError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load your marketplace products.",
          );
        }
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    }

    void loadAdvertisingProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleAdvertModeChange(mode: "product" | "custom") {
    setAdvertMode(mode);
    setSelectedProductId("");
    setHeadline("");
    setDescription("");
    setImageUrl("");
    setTargetUrl("");
    setError("");
    setReference("");
  }

  function handleProductSelection(productId: string) {
    setSelectedProductId(productId);
    setError("");
    setReference("");

    const product = adProducts.find((item) => item.id === productId);
    if (!product) {
      setHeadline("");
      setDescription("");
      setImageUrl("");
      setTargetUrl("");
      return;
    }

    setHeadline(product.name.slice(0, 160));
    setDescription((product.description ?? "").slice(0, 2000));
    setImageUrl(product.imageUrl);
    setTargetUrl(product.targetUrl);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setReference("");

    if (
      advertMode === "product" &&
      (!selectedProductId || !adProducts.some((item) => item.id === selectedProductId))
    ) {
      setError("Select one of your eligible marketplace products first.");
      return;
    }
    if (!isHttpsUrl(imageUrl.trim())) {
      setError("Enter a valid HTTPS image URL.");
      return;
    }

    if (!isHttpsUrl(targetUrl.trim())) {
      setError("Enter a valid HTTPS destination URL.");
      return;
    }

    if (!headline.trim() || headline.trim().length > 160) {
      setError("Enter a headline of 1–160 characters.");
      return;
    }

    if (description.trim().length > 2000) {
      setError("Description must not exceed 2,000 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/marketplace/advertising/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          packageId: selectedPackage.id,
          placement: selectedPackage.placement,
          creativeMode: advertMode,
          productId: advertMode === "product" ? selectedProductId : null,
          headline: headline.trim(),
          description: description.trim(),
          imageUrl: imageUrl.trim(),
          targetUrl: targetUrl.trim(),
        }),
      });

      const data = (await response.json()) as InitializeResponse;

      if (!response.ok || !data.success || !data.checkoutUrl) {
        if (data.reference) setReference(data.reference);
        setError(
          data.error ||
            "We could not start checkout. Check your supplier approval and try again.",
        );
        return;
      }

      // The API validates the checkout URL against Paystack's checkout host.
      window.location.assign(data.checkoutUrl);
    } catch {
      setError(
        "We could not reach the advertising payment service. Check your connection before trying again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-200">
          Samiz Tech Marketplace
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          Advertise your products
        </h1>
        <p className="mt-3 leading-7 text-slate-200">
          Promote your business and product listings to marketplace visitors.
          Choose a package, provide your campaign details and pay securely
          through Paystack.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label="Advertising packages">
        {packages.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPackageId(item.id)}
            aria-pressed={packageId === item.id}
            className={`text-left border p-5 transition ${
              packageId === item.id
                ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700"
                : "border-slate-200 bg-white hover:border-slate-400"
            }`}
          >
            <span className="block font-bold text-slate-900">{item.name}</span>
            <span className="mt-3 block text-2xl font-bold text-slate-900">
              {formatNaira(item.price)}
            </span>
            <span className="mt-1 block text-sm text-slate-600">
              7-day campaign
            </span>
            <span className="mt-3 block text-sm leading-6 text-slate-600">
              {item.description}
            </span>
            <span className="mt-4 block text-sm font-semibold text-blue-700">
              {packageId === item.id ? "Selected" : "Select package"}
            </span>
          </button>
        ))}
      </section>

      <section className="mt-8 border border-slate-200 bg-white p-5 sm:p-8">
        <h2 className="text-xl font-bold text-slate-900">
          Campaign details
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your advert will be reviewed by the Samiz admin team after payment.
          Payment alone does not publish the campaign.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold text-slate-800">
              Advert type
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleAdvertModeChange("product")}
                aria-pressed={advertMode === "product"}
                className={`border p-4 text-left ${
                  advertMode === "product"
                    ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700"
                    : "border-slate-300 bg-white"
                }`}
              >
                <span className="block font-semibold text-slate-900">
                  Existing product
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  Promote an approved, listed Samiz Marketplace product.
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleAdvertModeChange("custom")}
                aria-pressed={advertMode === "custom"}
                className={`border p-4 text-left ${
                  advertMode === "custom"
                    ? "border-blue-700 bg-blue-50 ring-1 ring-blue-700"
                    : "border-slate-300 bg-white"
                }`}
              >
                <span className="block font-semibold text-slate-900">
                  Custom advert
                </span>
                <span className="mt-1 block text-sm text-slate-600">
                  Supply your own advert image and destination link.
                </span>
              </button>
            </div>
          </fieldset>

          {advertMode === "product" ? (
            <div>
              <label htmlFor="ad-product" className="mb-1 block text-sm font-semibold text-slate-800">
                Select a product to advertise *
              </label>
              <select
                id="ad-product"
                required
                value={selectedProductId}
                onChange={(event) => handleProductSelection(event.target.value)}
                disabled={productsLoading || adProducts.length === 0}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-700 disabled:opacity-60"
              >
                <option value="">
                  {productsLoading
                    ? "Loading your products..."
                    : adProducts.length
                      ? "Choose one of your approved products"
                      : "No eligible products available"}
                </option>
                {adProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Choose an approved, publicly listed product. Its image and public product link will be filled in automatically.
              </p>
              {productsError ? (
                <p className="mt-2 text-sm text-red-700" role="alert">
                  {productsError}
                </p>
              ) : null}
              {!productsLoading && !productsError && adProducts.length === 0 ? (
                <p className="mt-2 text-sm text-amber-800">
                  You can switch to Custom advert if you do not have an eligible product listing.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-slate-700">
              Custom adverts are reviewed by Samiz before publication. Use a publicly accessible HTTPS image URL and a destination URL where customers can learn more or contact your business.
            </p>
          )}

          <div>
            <label htmlFor="ad-headline" className="mb-1 block text-sm font-semibold text-slate-800">
              Advertising headline *
            </label>
            <input
              id="ad-headline"
              required
              minLength={1}
              maxLength={160}
              value={headline}
              onChange={(event) => setHeadline(event.target.value)}
              placeholder="e.g. Reliable Solar Inverters for Homes and Businesses"
              className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-700"
            />
            <p className="mt-1 text-xs text-slate-500">{headline.length}/160 characters</p>
          </div>

          <div>
            <label htmlFor="ad-description" className="mb-1 block text-sm font-semibold text-slate-800">
              Description (optional)
            </label>
            <textarea
              id="ad-description"
              maxLength={2000}
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Briefly describe the product or offer you want to promote."
              className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-700"
            />
            <p className="mt-1 text-xs text-slate-500">{description.length}/2000 characters</p>
          </div>

          <div>
            <label htmlFor="ad-image" className="mb-1 block text-sm font-semibold text-slate-800">
              Advertising image URL *
            </label>
            <input
              id="ad-image"
              type="url"
              required
              value={imageUrl}
              readOnly={advertMode === "product"}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder={advertMode === "product" ? "Select a product to fill in its image" : "https://example.com/advert-image.jpg"}
              className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-700"
            />
            <p className="mt-1 text-xs text-slate-500">
              {advertMode === "product"
                ? "This uses the first public HTTPS image from your selected product."
                : "Enter a direct, publicly accessible HTTPS image URL. The image must be suitable for your advert."}
            </p>
          </div>

          <div>
            <label htmlFor="ad-target" className="mb-1 block text-sm font-semibold text-slate-800">
              Destination URL *
            </label>
            <input
              id="ad-target"
              type="url"
              required
              value={targetUrl}
              readOnly={advertMode === "product"}
              onChange={(event) => setTargetUrl(event.target.value)}
              placeholder={advertMode === "product" ? "Select a product to fill in its public page" : "https://example.com/your-page"}
              className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-700"
            />
            <p className="mt-1 text-xs text-slate-500">
              {advertMode === "product"
                ? "Visitors will be taken directly to this product's public Samiz Marketplace page."
                : "Enter an HTTPS page where visitors should land when they click your advert."}
            </p>
          </div>

          <div className="border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">Advert preview</h3>
            {imageUrl && targetUrl ? (
              <div className="mt-3 max-w-xl overflow-hidden border border-slate-200 bg-white">
                <img
                  src={imageUrl}
                  alt={headline || "Selected product advert"}
                  loading="lazy"
                  className="max-h-64 w-full object-contain"
                />
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Sponsored
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {headline || "Your advertising headline"}
                  </p>
                  {description ? (
                    <p className="mt-2 text-sm text-slate-600">{description}</p>
                  ) : null}
                  <p className="mt-3 break-all text-xs text-blue-700">{targetUrl}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                {advertMode === "product"
                  ? "Select a product to preview your advert before checkout."
                  : "Enter an image URL and destination URL to preview your custom advert."}
              </p>
            )}
          </div>

          <div className="border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-600">Selected package</p>
                <p className="font-semibold text-slate-900">{selectedPackage.name}</p>
                <p className="mt-1 text-sm text-slate-600">Duration: 7 days, subject to approval</p>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatNaira(selectedPackage.price)}
              </p>
            </div>
          </div>

          {error ? (
            <div className="border border-red-200 bg-red-50 p-4 text-sm text-red-800" role="alert">
              {error}
              {reference ? (
                <p className="mt-2 break-all">Reference: {reference}</p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting
              ? "Preparing secure checkout..."
              : `Continue to Paystack — ${formatNaira(selectedPackage.price)}`}
          </button>
        </form>
      </section>

      <section
        className="mt-10"
        aria-labelledby="campaign-history-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              id="campaign-history-heading"
              className="text-xl font-bold text-white"
            >
              Your advertising campaigns
            </h2>
            <p className="mt-1 text-sm text-slate-200">
              Track payment, admin review and campaign scheduling.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCampaignsLoading(true);
              void loadCampaigns();
            }}
            disabled={campaignsLoading}
            className="border border-white/40 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {campaignsLoading ? "Refreshing..." : "Refresh campaigns"}
          </button>
        </div>

        {campaignsError ? (
          <div
            className="mt-4 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            role="alert"
          >
            {campaignsError}
            <p className="mt-1">
              If the advertising database migration has not been applied yet,
              campaign history will not load until it is available.
            </p>
          </div>
        ) : null}

        {campaignsLoading && campaigns.length === 0 ? (
          <p className="mt-4 text-sm text-slate-200">
            Loading your campaigns...
          </p>
        ) : null}

        {!campaignsLoading && !campaignsError && campaigns.length === 0 ? (
          <div className="mt-4 border border-slate-200 bg-white p-5 text-sm text-slate-600">
            You have not created an advertising campaign yet. Your campaigns
            will appear here after you start checkout.
          </div>
        ) : null}

        <div className="mt-4 space-y-4">
          {campaigns.map((campaign) => (
            <article
              key={campaign.id}
              className="border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    {campaign.headline}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {campaign.package_name} · {formatNaira(campaign.amount_kobo / 100)}
                  </p>
                </div>
                <span className="border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {readableStatus(campaign.campaign_status)}
                </span>
              </div>

              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Payment</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {readableStatus(campaign.payment_status)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Placement</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {readableStatus(campaign.placement)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Campaign starts</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {formatCampaignDate(campaign.starts_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Campaign ends</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {formatCampaignDate(campaign.ends_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {formatCampaignDate(campaign.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Payment reference</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                    {campaign.paystack_reference}
                  </dd>
                </div>
              </dl>

              {campaign.admin_review_note ? (
                <div className="mt-4 border-l-2 border-slate-300 pl-3 text-sm text-slate-700">
                  <span className="font-semibold">Admin review note: </span>
                  {campaign.admin_review_note}
                </div>
              ) : null}

              {campaign.payment_status === "paid" &&
              campaign.campaign_status === "pending_review" ? (
                <p className="mt-4 text-sm text-amber-800">
                  Payment is confirmed. Your campaign is awaiting admin approval
                  and is not yet published.
                </p>
              ) : null}

              {campaign.campaign_status === "approved" ? (
                <p className="mt-4 text-sm text-green-800">
                  Approved. Publication is limited to the scheduled campaign
                  period and the relevant advert placement.
                </p>
              ) : null}

              {campaign.campaign_status === "rejected" ? (
                <p className="mt-4 text-sm text-slate-700">
                  This campaign was rejected. Contact Samiz support if you need
                  clarification about the review decision or payment.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <p className="mt-6 text-sm leading-6 text-slate-300">
        Advertising payments are separate from product purchases and Energy
        Tools subscriptions. Campaign publication requires verified payment
        and admin approval.
      </p>

      <p className="mt-4 text-sm">
        <a
          href="/marketplace/supplier/dashboard"
          className="font-semibold text-blue-200 underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          Return to supplier dashboard
        </a>
      </p>
    </main>
  );
}

