import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    absolute: "Industrial, Electrical & Solar Equipment Marketplace Nigeria | Samiz Tech",
  },
  description:
    "Source generators, solar and battery systems, electrical materials, switchgear and industrial power equipment in Nigeria. Browse supplier listings and request quotations through Samiz Tech Marketplace.",
  keywords: [
    "industrial equipment marketplace Nigeria",
    "electrical equipment suppliers Nigeria",
    "generator suppliers Nigeria",
    "industrial generators Nigeria",
    "solar equipment marketplace Nigeria",
    "inverters and batteries Nigeria",
    "electrical materials suppliers Nigeria",
    "switchgear and control panels Nigeria",
    "transformers and substation equipment Nigeria",
    "commercial power equipment procurement",
    "bulk electrical equipment orders Nigeria",
    "Samiz Tech Marketplace",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/marketplace",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/marketplace",
    title: "Industrial, Electrical & Solar Equipment Marketplace Nigeria | Samiz Tech",
    description:
      "Browse generators, solar systems, electrical materials and industrial power equipment. Request supplier quotations and source equipment through Samiz Tech Marketplace.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Industrial, Electrical & Solar Equipment Marketplace Nigeria | Samiz Tech",
    description:
      "Source generators, electrical materials, solar equipment and industrial power products in Nigeria through Samiz Tech Marketplace.",
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}