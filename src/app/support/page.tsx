import type { Metadata } from "next";
import SupportChat from "@/components/support/SupportChat";

export const metadata: Metadata = {
  title: "Customer Support",
  description:
    "Contact Samiz Tech Engineering Ltd. for assistance with our engineering services and marketplace.",
  alternates: {
    canonical: "https://www.samiztech.com.ng/support",
  },
};

export default function SupportPage() {
  return (
    <section className="bg-slate-50 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Customer Care
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Samiz Tech Support
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Need help with a marketplace listing, quotation, order, or our
            engineering services? Send us a message below and check back for
            our reply.
          </p>
        </div>
        <SupportChat />
      </div>
    </section>
  );
}
