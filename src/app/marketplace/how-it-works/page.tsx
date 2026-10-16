import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Use the Marketplace | Samiz Tech",
  description:
    "Learn how to browse Samiz Tech Marketplace, buy products at listed prices, request supplier quotations, complete payments and track orders.",
  alternates: {
    canonical: "https://www.samiztech.com.ng/marketplace/how-it-works",
  },
  openGraph: {
    type: "article",
    url: "https://www.samiztech.com.ng/marketplace/how-it-works",
    title: "How to Use the Marketplace | Samiz Tech",
    description:
      "Learn how to purchase electrical and solar products, request quotations and track marketplace orders.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
};

const buyingMethods = [
  {
    number: "01",
    title: "Buy at a listed price",
    description:
      "Browse marketplace products, review the listed price and product details, select your quantity, and proceed through checkout. Complete payment through Paystack and keep your payment reference.",
    steps: [
      "Open the Marketplace and select a product.",
      "Review its price, details and available quantity.",
      "Enter the required buyer and delivery information.",
      "Complete checkout through Paystack.",
      "Sign in to your buyer account and open My Orders to track the purchase.",
    ],
  },
  {
    number: "02",
    title: "Request a quotation",
    description:
      "Use the quotation option when you need a supplier to provide a price before you commit to a purchase.",
    steps: [
      "Open the relevant product or quotation request option.",
      "Provide the requested product, quantity and project details.",
      "Submit your request and wait for the supplier's response.",
      "Open My Quotes to review the supplier's quotation.",
      "If the quotation is suitable, accept it and follow the payment instructions provided.",
      "After payment, open My Orders to track the resulting order.",
    ],
  },
];

const orderStages = [
  {
    title: "Payment pending",
    description:
      "Payment has not yet been confirmed. Check the order status before attempting another payment.",
  },
  {
    title: "Paid",
    description:
      "The payment has been recorded as confirmed. Follow the order's fulfilment updates.",
  },
  {
    title: "Dispatched",
    description:
      "The supplier has recorded that the order has been dispatched.",
  },
  {
    title: "Delivered",
    description:
      "The order has been marked as delivered in the marketplace fulfilment records.",
  },
];

export default function MarketplaceHowItWorksPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link
            href="/marketplace"
            className="font-medium text-blue-700 hover:underline"
          >
            Marketplace
          </Link>
          <Link
            href="/marketplace/my-quotes"
            className="font-medium text-blue-700 hover:underline"
          >
            My Quotes
          </Link>
          <Link
            href="/marketplace/my-orders"
            className="font-medium text-blue-700 hover:underline"
          >
            My Orders
          </Link>
        </nav>

        <header className="rounded-2xl bg-slate-900 px-6 py-10 text-white sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
            Samiz Tech Marketplace
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            How to Use the Marketplace
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-slate-300">
            Learn how to find products, buy at a listed price, request a
            quotation, make payments and track your order through delivery.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Browse Marketplace
            </Link>
            <Link
              href="/marketplace/my-orders"
              className="rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Track My Orders
            </Link>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">
            Choose how you want to buy
          </h2>
          <p className="mt-2 leading-6 text-slate-600">
            Available options depend on the product and the supplier&apos;s
            marketplace settings.
          </p>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {buyingMethods.map((method) => (
              <article
                key={method.number}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-bold tracking-widest text-blue-700">
                  {method.number}
                </p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  {method.title}
                </h3>
                <p className="mt-3 leading-6 text-slate-600">
                  {method.description}
                </p>
                <ol className="mt-5 space-y-3">
                  {method.steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-3 text-sm">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                        {index + 1}
                      </span>
                      <span className="pt-1 leading-6 text-slate-700">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-slate-900">
            Understand your order status
          </h2>
          <p className="mt-2 leading-6 text-slate-600">
            Open My Orders to see the payment and fulfilment information
            recorded for orders linked to your buyer account.
          </p>

          <div className="mt-5 space-y-3">
            {orderStages.map((stage, index) => (
              <article
                key={stage.title}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {stage.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {stage.description}
                  </p>
                </div>
              </article>
            ))}
          </div>

          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Payment and delivery are separate processes. A delivered status
            records fulfilment progress; it does not mean Paystack has just
            released funds. Settlement follows the configured payment
            arrangement.
          </p>
        </section>

        <section className="mt-12 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">
            Where can I find my information?
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-slate-900">My Quotes</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review quotation requests and supplier responses, and follow
                the available quote acceptance and payment steps.
              </p>
              <Link
                href="/marketplace/my-quotes"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                Open My Quotes →
              </Link>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">My Orders</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Check linked purchases, payment status, supplier details and
                recorded dispatch and delivery updates.
              </p>
              <Link
                href="/marketplace/my-orders"
                className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
              >
                Open My Orders →
              </Link>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-600">
            Sign in with the buyer account used for the purchase. Guest
            purchases and older orders not linked to your account may not
            appear automatically. If a payment or order status seems
            incorrect, contact Samiz Tech support before paying again.
          </p>
        </section>

        <footer className="mt-10 border-t border-slate-200 py-6 text-sm text-slate-600">
          Ready to get started?{" "}
          <Link
            href="/marketplace"
            className="font-semibold text-blue-700 hover:underline"
          >
            Return to the Marketplace
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}
