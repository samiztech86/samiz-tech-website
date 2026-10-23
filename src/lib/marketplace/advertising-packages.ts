export const MARKETPLACE_AD_PACKAGES = {
  marketplace_featured: {
    id: "marketplace_featured",
    name: "Marketplace Featured",
    placement: "marketplace_featured",
    amountNaira: 15_000,
    amountKobo: 1_500_000,
    durationDays: 7,
  },
  category_featured: {
    id: "category_featured",
    name: "Category Featured",
    placement: "category_featured",
    amountNaira: 25_000,
    amountKobo: 2_500_000,
    durationDays: 7,
  },
  homepage_banner: {
    id: "homepage_banner",
    name: "Homepage Banner",
    placement: "homepage_banner",
    amountNaira: 50_000,
    amountKobo: 5_000_000,
    durationDays: 7,
  },
} as const;

export type MarketplaceAdPackageId =
  keyof typeof MARKETPLACE_AD_PACKAGES;

export function getMarketplaceAdPackage(
  packageId: string,
) {
  if (
    !Object.prototype.hasOwnProperty.call(
      MARKETPLACE_AD_PACKAGES,
      packageId,
    )
  ) {
    return null;
  }

  return MARKETPLACE_AD_PACKAGES[
    packageId as MarketplaceAdPackageId
  ];
}
