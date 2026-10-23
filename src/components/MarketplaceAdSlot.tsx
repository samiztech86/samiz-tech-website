"use client";

import { useEffect, useState } from "react";

type Placement =
  | "homepage_banner"
  | "marketplace_featured"
  | "category_featured";

type PublicCampaign = {
  id: string;
  headline: string;
  description: string | null;
  image_url: string;
  target_url: string;
  placement: Placement;
};

type CampaignResponse = {
  success?: boolean;
  campaigns?: PublicCampaign[];
};

export default function MarketplaceAdSlot({
  placement,
  category,
}: {
  placement: Placement;
  category?: string;
}) {
  const [campaignState, setCampaignState] = useState<{
    key: string;
    campaigns: PublicCampaign[];
  }>({ key: "", campaigns: [] });

  useEffect(() => {
    let cancelled = false;
    const requestKey = placement === "category_featured"
      ? `${placement}:${category ?? ""}`
      : placement;

    if (placement === "category_featured" && !category) {
      return () => {
        cancelled = true;
      };
    }

    async function loadAds() {
      try {
        const params = new URLSearchParams({ placement });

        if (placement === "category_featured" && category) {
          params.set("category", category);
        }

        const response = await fetch(
          `/api/marketplace/advertising/active?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            headers: { Accept: "application/json" },
          },
        );

        if (!response.ok) return;

        const result = (await response.json()) as CampaignResponse;

        if (!cancelled && result.success && Array.isArray(result.campaigns)) {
          setCampaignState({ key: requestKey, campaigns: result.campaigns });
        }
      } catch {
        // Advertising is non-critical; never disrupt the main page.
      }
    }

    void loadAds();

    return () => {
      cancelled = true;
    };
  }, [placement, category]);

  const currentKey = placement === "category_featured"
    ? `${placement}:${category ?? ""}`
    : placement;
  const campaigns = campaignState.key === currentKey
    ? campaignState.campaigns
    : [];

  if (campaigns.length === 0) return null;

  if (placement === "homepage_banner") {
    const campaign = campaigns[0];

    return (
      <section
        className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-10"
        aria-label="Sponsored advertising"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Sponsored
        </p>
        <a
          href={campaign.target_url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className="group block overflow-hidden border border-slate-200 bg-white transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <div className="grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="aspect-[16/7] overflow-hidden bg-slate-100 md:aspect-auto">
              <img
                src={campaign.image_url}
                alt={campaign.headline}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center p-5 sm:p-8">
              <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-700 sm:text-2xl">
                {campaign.headline}
              </h2>
              {campaign.description ? (
                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                  {campaign.description}
                </p>
              ) : null}
              <span className="mt-5 text-sm font-semibold text-blue-700">
                Learn more â†—
              </span>
            </div>
          </div>
        </a>
      </section>
    );
  }

  return (
    <section
      className="mx-auto w-full max-w-7xl px-5 pb-2 sm:px-8 lg:px-10"
      aria-label={
        placement === "category_featured"
          ? "Sponsored products in this category"
          : "Sponsored marketplace listings"
      }
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
        Sponsored
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaigns.map((campaign) => (
          <a
            key={campaign.id}
            href={campaign.target_url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            className="group overflow-hidden border border-slate-200 bg-white transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <div className="aspect-[16/9] overflow-hidden bg-slate-100">
              <img
                src={campaign.image_url}
                alt={campaign.headline}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700">
                {campaign.headline}
              </h3>
              {campaign.description ? (
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                  {campaign.description}
                </p>
              ) : null}
              <span className="mt-3 inline-block text-sm font-semibold text-blue-700">
                View offer â†—
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
