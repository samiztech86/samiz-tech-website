import type { Metadata } from "next";
import ContactPage from "./ContactPage";

export const metadata: Metadata = {
  title: "Contact an Electrical & Solar Engineering Company in Lagos | Samiz Tech",
  description:
    "Discuss your electrical, solar EPC, power distribution, backup power or energy infrastructure project with Samiz Tech Engineering Ltd in Lagos and across Nigeria.",
  keywords: [
    "electrical contractor Lagos contact",
    "electrical engineering company Lagos contact",
    "electrical installation contractor Lagos",
    "solar EPC contractor Lagos",
    "solar installation contractor Lagos",
    "commercial electrical contractor Lagos",
    "industrial electrical contractor Nigeria",
    "power distribution contractor Lagos",
    "backup power contractor Lagos",
    "energy infrastructure contractor Nigeria",
    "estate electrical contractor Lagos",
    "estate solar contractor Lagos",
    "engineering project contractor Lagos",
    "electrical project enquiry Lagos",
    "solar project enquiry Lagos",
    "engineering company Lagos",
    "Samiz Tech Engineering Ltd.",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/contact",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/contact",
    title: "Contact an Electrical & Solar Engineering Company in Lagos | Samiz Tech",
    description:
      "Discuss your electrical, solar EPC, power distribution, backup power or energy infrastructure project with Samiz Tech Engineering Ltd in Lagos and across Nigeria.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact an Electrical & Solar Engineering Company in Lagos | Samiz Tech",
    description:
      "Start a project discussion with Samiz Tech Engineering Ltd for electrical, solar, power and energy infrastructure work.",
  },
};

export default function Contact() {
  return <ContactPage />;
}

