import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manufacturer Partnership | Samiz Tech Marketplace",
  description:
    "Partner with Samiz Tech to introduce your electrical, solar, power and energy technology products to the Nigerian market.",
};

export default function ManufacturerPartnershipPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Samiz Tech Marketplace
          </p>

          <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
            Bring Your Brand Closer to the Nigerian Market
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            We work with manufacturers and established brands in solar,
            electrical materials, power distribution, energy storage and
            related technology to make their products accessible to customers
            and project buyers through the Samiz Tech Marketplace.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="mailto:info@samiztech.com.ng?subject=Manufacturer%20Partnership%20Enquiry"
              className="inline-flex items-center justify-center bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Enquire About Partnership
            </a>

            <a
              href="/marketplace"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Explore Marketplace
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold">
            Manufacturer Onboarding Programme
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Our programme is designed for manufacturers and established
            brands seeking a structured marketplace presence and access to
            prospective customers in Nigeria.
          </p>

          <h3 className="mt-9 text-xl font-semibold">
            What the onboarding package covers
          </h3>

          <ul className="mt-4 space-y-3 text-slate-700">
            <li>Manufacturer and business information review and verification.</li>
            <li>Manufacturer or brand profile creation on the marketplace.</li>
            <li>Initial product catalogue configuration and listing.</li>
            <li>Marketplace integration and product enquiry access.</li>
            <li>Initial brand visibility and launch support within the agreed scope.</li>
          </ul>

          <h3 className="mt-9 text-xl font-semibold">
            Partnership process
          </h3>

          <ol className="mt-4 list-inside list-decimal space-y-3 text-slate-700">
            <li>Submit a manufacturer partnership enquiry.</li>
            <li>Samiz Tech reviews your company, product range and proposal.</li>
            <li>Both parties discuss and agree on the onboarding scope and terms.</li>
            <li>Onboarding and catalogue setup proceed following agreement.</li>
          </ol>
        </div>

        <aside className="h-fit border border-slate-200 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Standard Commercial Terms
          </p>

          <div className="mt-5">
            <p className="text-sm text-slate-500">
              One-time manufacturer onboarding fee
            </p>
            <p className="mt-1 text-3xl font-bold">&#8358;500,000</p>
          </div>

          <div className="my-6 border-t border-slate-200" />

          <div>
            <p className="text-sm text-slate-500">
              Marketplace sales commission
            </p>
            <p className="mt-1 text-3xl font-bold">5%</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Applied to successfully completed marketplace sales.
            </p>
          </div>

          <div className="my-6 border-t border-slate-200" />

          <p className="text-sm leading-6 text-slate-600">
            The onboarding fee is separate from the sales commission.
            Strategic partnership arrangements may be discussed and agreed
            separately where appropriate.
          </p>

          <a
            href="mailto:info@samiztech.com.ng?subject=Manufacturer%20Partnership%20Enquiry"
            className="mt-7 flex w-full items-center justify-center bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-500"
          >
            Contact Our Team
          </a>
        </aside>
      </section>

      <section className="border-t border-slate-200 bg-white px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-bold">
            Is this programme for every supplier?
          </h2>

          <p className="mt-4 max-w-4xl leading-7 text-slate-600">
            No. This manufacturer partnership programme is intended for
            manufacturers and established brands. Businesses and individuals
            applying through the ordinary supplier registration process
            should continue to use the standard supplier onboarding route.
            The manufacturer partnership fee does not automatically apply
            to ordinary supplier registration.
          </p>

          <p className="mt-5 text-sm leading-6 text-slate-500">
            Product enquiries, availability, specifications, pricing and
            delivery are confirmed individually. Marketplace participation
            does not guarantee sales or a particular level of customer demand.
          </p>
        </div>
      </section>
    </main>
  );
}