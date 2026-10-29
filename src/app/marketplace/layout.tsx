import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    absolute: "Samiz Tech Marketplace | Solar & Electrical Products",
  },
  description:
    "Shop solar panels, inverters, batteries and electrical products on Samiz Tech Marketplace. Browse supplier listings and request quotations in Nigeria.",
  keywords: [
    "Samiz Tech Marketplace",
    "solar equipment marketplace Nigeria",
    "solar panels and inverters Nigeria",
    "solar batteries Nigeria",
    "electrical materials suppliers Nigeria",
    "electrical equipment marketplace",
    "industrial electrical equipment Nigeria",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/marketplace",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/marketplace",
    title: "Samiz Tech Marketplace | Solar & Electrical Products",
    description:
      "Browse solar panels, inverters, batteries and electrical products from supplier listings, or request a quotation.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Samiz Tech Marketplace | Solar & Electrical Products",
    description:
      "Explore solar, electrical and industrial power products from supplier listings on Samiz Tech Marketplace.",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
