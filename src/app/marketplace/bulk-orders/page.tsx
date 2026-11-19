import type { Metadata } from "next";
import Link from "next/link";
import BulkOrderForm from "./bulk-order-form";

export const metadata: Metadata = {
  title: "Bulk Orders & Factory Pricing | Samiz Tech Marketplace",
  description:
    "Request bulk quotations and factory pricing for solar equipment, electrical materials, energy storage systems and industrial power products through Samiz Tech.",
  alternates: {
    canonical: "/marketplace/bulk-orders",
  },
  openGraph: {
    title: "Bulk Orders & Factory Pricing | Samiz Tech",
    description:
      "Submit your bulk procurement requirements and request a tailored supplier or manufacturer quotation.",
    url: "/marketplace/bulk-orders",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function BulkOrdersPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/marketplace"
            className="text-sm font-medium text-blue-300 hover:text-white"
          >
            ← Back to Marketplace
          </Link>

          <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Samiz Tech Marketplace
          </p>

          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
            Bulk Orders & Factory Pricing
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300">
            Procuring for a project, business, installation or distribution
            operation? Tell us what you need and the quantities involved.
            We will review your requirements and coordinate a suitable
            supplier or manufacturer quotation.
          </p>
        </div>
      </section>

      <section className="px-5 py-12 sm:px-8">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold">Tell us what you need</h2>
            <p className="mt-2 mb-7 text-sm leading-6 text-slate-600">
              Provide your product requirements, quantities and delivery
              destination. Our team will review your request.
            </p>
            <BulkOrderForm />
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold">What can you request?</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Solar panels, inverters and batteries</li>
                <li>Energy storage systems and accessories</li>
                <li>Cables, breakers and electrical materials</li>
                <li>Distribution equipment and industrial power products</li>
                <li>Large project and recurring procurement requirements</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-blue-50 p-6">
              <h2 className="font-bold text-slate-900">How it works</h2>
              <ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700">
                <li>Submit your requirements.</li>
                <li>We review quantities and specifications.</li>
                <li>We check supplier or manufacturer terms.</li>
                <li>We follow up with the available quotation.</li>
              </ol>
            </div>

            <Link
              href="/marketplace"
              className="inline-flex font-semibold text-blue-700 hover:text-blue-900"
            >
              Browse marketplace products →
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}