import type { Metadata } from "next";
import ContactPage from "./ContactPage";

export const metadata: Metadata = {
  title: "Contact Samiz Tech Engineering Ltd.",
  description:
    "Contact Samiz Tech Engineering Ltd. for electrical engineering, solar EPC, energy infrastructure, automation, maintenance and intelligent energy solutions in Lagos and across Nigeria.",
  keywords: [
    "contact electrical company Lagos",
    "electrical contractor Lagos",
    "solar company Lagos",
    "solar EPC Nigeria",
    "electrical engineering Lagos",
    "electrical installation Lagos",
    "solar installation Nigeria",
    "energy solutions Lagos",
    "energy infrastructure Nigeria",
    "engineering company Lagos",
    "Samiz Tech Engineering Ltd.",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/contact",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/contact",
    title: "Contact Samiz Tech Engineering Ltd.",
    description:
      "Get in touch with Samiz Tech Engineering Ltd. for electrical engineering, solar EPC, energy infrastructure and intelligent energy solutions across Nigeria.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Samiz Tech Engineering Ltd.",
    description:
      "Contact Samiz Tech Engineering Ltd. for electrical, solar, energy infrastructure and automation solutions.",
  },
};

export default function Contact() {
  return <ContactPage />;
}

