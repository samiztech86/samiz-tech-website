import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.samiztech.com.ng"),

  title: {
    default: "Samiz Tech Engineering Ltd. | Where Engineering Meets Energy",
    template: "%s | Samiz Tech Engineering Ltd.",
  },

  description:
    "Samiz Tech Engineering Ltd. provides electrical engineering, solar EPC, energy infrastructure, automation, energy management and intelligent energy solutions across Nigeria.",

  keywords: [
    "Samiz Tech Engineering Ltd.",
    "electrical engineering Nigeria",
    "electrical engineering Lagos",
    "solar EPC Nigeria",
    "solar installation Lagos",
    "solar power systems Nigeria",
    "energy infrastructure Nigeria",
    "electrical installation Lagos",
    "energy management Nigeria",
    "smart energy systems Nigeria",
    "building automation Nigeria",
    "Samiz EnergyOS",
  ],

  authors: [
    {
      name: "Samiz Tech Engineering Ltd.",
      url: "https://www.samiztech.com.ng",
    },
  ],

  creator: "Samiz Tech Engineering Ltd.",
  publisher: "Samiz Tech Engineering Ltd.",

  alternates: {
    canonical: "https://www.samiztech.com.ng/",
  },

  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://www.samiztech.com.ng/",
    siteName: "Samiz Tech Engineering Ltd.",
    title: "Samiz Tech Engineering Ltd. | Where Engineering Meets Energy",
    description:
      "Electrical engineering, solar EPC, energy infrastructure, automation and intelligent energy solutions across Nigeria.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Samiz Tech Engineering Ltd. | Where Engineering Meets Energy",
    description:
      "Electrical engineering, solar EPC, energy infrastructure, automation and intelligent energy solutions across Nigeria.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  category: "engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <StructuredData />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}


