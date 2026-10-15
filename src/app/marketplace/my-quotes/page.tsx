"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  model_number: string | null;
  image_urls: string[];
  price_type: string;
  indicative_price: number | null;
  currency: string;
};

type Supplier = {
  id: string;
  business_name: string;
};

type SupplierQuote = {
  id: string;
  request_id: string;
  quote_amount: number;
  currency: string;
  estimated_lead_time: string | null;
  quote_valid_until: string | null;
  supplier_message: string;
  quote_status: string;
  created_at: string;
};

type MarketplaceOrder = {
  id: string;
  quote_request_id: string;
  quote_id: string | null;
  payment_status: string;
  subtotal_kobo: number | string;
  quoted_total_kobo: number | string | null;
  created_at: string;
  fulfilment_status: string | null;
  fulfilment_updated_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
};
type BuyerQuoteRequest = {
  id: string;
  product_id: string;
  supplier_id: string;
  quantity: number | null;
  quantity_unit: string | null;
  delivery_location: string | null;
  customer_message: string | null;
  request_status: string;
  accepted_quote_id: string | null;
  created_at: string;
  product: Product | null;
  supplier: Supplier | null;
  quote: SupplierQuote | null;
  order: MarketplaceOrder | null;
  isAccepted: boolean;
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatMoney(amount: number, currency: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) return "Amount unavailable";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency.trim() || "NGN",
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

export default function BuyerQuotesPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [items, setItems] = useState<BuyerQuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/marketplace/buyer/quotes", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        quotes?: BuyerQuoteRequest[];
        error?: string;
      };

      if (response.status === 401) {
        setSignedIn(false);
        setItems([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load your quote history.");
      }

      setItems(Array.isArray(payload.quotes) ? payload.quotes : []);
      setSignedIn(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your quote history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the authenticated buyer's quote history on page entry.
    void loadQuotes();
  }, [loadQuotes]);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/marketplace/my-quotes`,
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setNotice(
            "Registration submitted. Check your email for the confirmation link, then return here to sign in.",
          );
          setIsSignUp(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) throw signInError;
      }

      await loadQuotes();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Authentication could not be completed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    setError("");
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      setItems([]);
      setSignedIn(false);
      setPassword("");
      setNotice("You have signed out.");
    } catch {
      setError("Unable to sign out. Please try again.");
    }
  }

  async function handleAcceptQuote(item: BuyerQuoteRequest) {
    if (!item.quote || item.isAccepted || actionBusyId !== null) return;
    if (item.quote.quote_status.toLowerCase() !== "sent") return;

    setActionBusyId(item.id);
    setActionError("");
    setActionNotice("");

    try {
      const response = await fetch(
        "/api/marketplace/buyer/quotes/accept",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: item.id,
            quoteId: item.quote.id,
          }),
        },
      );

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || payload.success !== true) {
        throw new Error(payload.error || "Unable to accept this quotation.");
      }

      await loadQuotes();
      setActionNotice("Quotation accepted. Review the updated status before proceeding to payment.");
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Unable to accept this quotation. Please refresh and try again.",
      );
    } finally {
      setActionBusyId(null);
    }
  }

  async function handlePayNow(item: BuyerQuoteRequest) {
    if (
      !item.quote ||
      !item.isAccepted ||
      item.accepted_quote_id !== item.quote.id ||
      actionBusyId !== null
    ) {
      return;
    }

    const paymentStatus = item.order?.payment_status.toLowerCase();
    if (paymentStatus && paymentStatus !== "failed") return;

    setActionBusyId(item.id);
    setActionError("");
    setActionNotice("");

    try {
      const response = await fetch("/api/marketplace/buyer/quotes/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: item.id,
          quoteId: item.quote.id,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
        checkoutUrl?: string;
      };

      if (!response.ok || payload.success !== true) {
        // Refresh the order status before allowing another payment attempt.
        await loadQuotes();
        throw new Error(
          payload.error ||
            "Unable to initialize payment. Refresh the quote status before trying again.",
        );
      }

      if (typeof payload.checkoutUrl !== "string") {
        await loadQuotes();
        throw new Error(
          "No checkout link was returned. Refresh the quote status before trying again.",
        );
      }

      const checkoutUrl = new URL(payload.checkoutUrl);
      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.paystack.com"
      ) {
        throw new Error("The payment checkout link could not be validated.");
      }

      // Payment starts only after the buyer clicks Pay Now.
      window.location.assign(checkoutUrl.toString());
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? caught.message
          : "Unable to initialize payment. Refresh the quote status before trying again.",
      );
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/marketplace"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          &larr; Back to Marketplace
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Samiz Tech Marketplace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            My Quote Requests
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            View your supplier quote requests and quotations in one place.
          </p>
        </header>

        {error ? (
          <div
            className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {notice ? (
          <div
            className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
            role="status"
          >
            {notice}
          </div>
        ) : null}

        {actionError ? (
          <div
            className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            role="alert"
          >
            {actionError}
          </div>
        ) : null}

        {actionNotice ? (
          <div
            className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
            role="status"
          >
            {actionNotice}
          </div>
        ) : null}
        {loading ? (
          <p className="mt-8 text-sm text-slate-600" role="status">
            Loading your quote history...
          </p>
        ) : signedIn ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {items.length} quote request{items.length === 1 ? "" : "s"}
              </p>
              <button
                type="button"
                onClick={() => void loadQuotes()}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
              >
                Refresh
              </button>
            </div>

            {items.length === 0 ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">
                  No linked quote requests yet
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Quote requests submitted while signed in will appear here.
                  Earlier enquiries submitted anonymously may not be linked to
                  this account.
                </p>
                <Link
                  href="/marketplace"
                  className="mt-5 inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Browse Marketplace
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold">
                          {item.product?.name || "Marketplace product"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          Supplier: {item.supplier?.business_name || "Supplier"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                        {item.isAccepted
                          ? "Accepted"
                          : item.quote?.quote_status || item.request_status}
                      </span>
                    </div>

                    <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-500">Quantity</dt>
                        <dd className="mt-1 font-medium">
                          {item.quantity ?? "Not specified"}{" "}
                          {item.quantity_unit || ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Delivery location</dt>
                        <dd className="mt-1 font-medium">
                          {item.delivery_location || "Not specified"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Request submitted</dt>
                        <dd className="mt-1 font-medium">
                          {formatDate(item.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Request reference</dt>
                        <dd className="mt-1 break-all font-mono text-xs">
                          {item.id}
                        </dd>
                      </div>
                    </dl>

                    {item.customer_message ? (
                      <div className="mt-5 border-t border-slate-100 pt-4">
                        <h3 className="text-sm font-semibold">
                          Your message
                        </h3>
                        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {item.customer_message}
                        </p>
                      </div>
                    ) : null}

                    {item.quote ? (
                      <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <h3 className="font-semibold text-blue-950">
                          Supplier quotation
                        </h3>
                        <p className="mt-3 text-2xl font-bold text-blue-950">
                          {formatMoney(
                            item.quote.quote_amount,
                            item.quote.currency,
                          )}
                        </p>
                        <p className="mt-1 text-xs text-blue-900">
                          Total quoted amount, not a unit price
                        </p>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-blue-800">Estimated lead time</dt>
                            <dd className="mt-1 font-medium text-blue-950">
                              {item.quote.estimated_lead_time || "Not specified"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-blue-800">Valid until</dt>
                            <dd className="mt-1 font-medium text-blue-950">
                              {item.quote.quote_valid_until
                                ? formatDate(item.quote.quote_valid_until)
                                : "Not specified"}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-blue-950">
                            Supplier message
                          </h4>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-blue-900">
                            {item.quote.supplier_message}
                          </p>
                        </div>

                        {item.isAccepted ? (
                          <div className="mt-4 space-y-3">
                            {item.order?.payment_status.toLowerCase() === "paid" ? (
                              <p className="text-sm font-semibold text-green-800" role="status">
                                Payment confirmed for this quotation.
                              </p>
                            ) : item.order &&
                              item.order.payment_status.toLowerCase() !== "failed" ? (
                              <p className="text-sm text-blue-900" role="status">
                                Payment status: {item.order.payment_status}.
                                Do not start another payment while this transaction is being confirmed.
                                Use Refresh to check for an update.
                              </p>
                            ) : item.accepted_quote_id === item.quote.id ? (
                              <button
                                type="button"
                                onClick={() => void handlePayNow(item)}
                                disabled={actionBusyId !== null}
                                className="inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {actionBusyId === item.id
                                  ? "Preparing secure checkout..."
                                  : "Pay Now"}
                              </button>
                            ) : (
                              <p className="text-sm text-blue-900">
                                This request is accepted, but its accepted quotation details need to be refreshed before payment can proceed.
                              </p>
                            )}

                            {item.order?.payment_status.toLowerCase() === "paid" ? (
                              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                                <h4 className="text-sm font-semibold text-slate-900">
                                  Order fulfilment
                                </h4>
                                <p className="mt-2 text-sm text-slate-700">
                                  Status:{" "}
                                  <span className="font-medium capitalize">
                                    {item.order.fulfilment_status
                                      ? item.order.fulfilment_status.replaceAll("_", " ")
                                      : "Awaiting supplier update"}
                                  </span>
                                </p>

                                {item.order.fulfilment_updated_at ? (
                                  <p className="mt-1 text-sm text-slate-600">
                                    Last update: {formatDate(item.order.fulfilment_updated_at)}
                                  </p>
                                ) : null}

                                {item.order.dispatched_at ? (
                                  <p className="mt-1 text-sm text-slate-600">
                                    Dispatched: {formatDate(item.order.dispatched_at)}
                                  </p>
                                ) : null}

                                {item.order.delivered_at ? (
                                  <p className="mt-1 text-sm text-slate-600">
                                    Delivered: {formatDate(item.order.delivered_at)}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        ) : item.quote.quote_status.toLowerCase() === "sent" ? (
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => void handleAcceptQuote(item)}
                              disabled={actionBusyId !== null}
                              className="inline-flex rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {actionBusyId === item.id
                                ? "Accepting quotation..."
                                : "Accept Quote"}
                            </button>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm text-blue-900">
                            This quotation is not currently available for acceptance.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                        Waiting for the supplier to submit a quotation.
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}

            <div className="mt-8 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="text-sm font-semibold text-slate-700 underline hover:text-slate-950"
              >
                Sign out
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-8 max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              {isSignUp ? "Create a buyer account" : "Sign in to your account"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {isSignUp
                ? "Register to access quote requests linked to your account."
                : "Sign in to view your saved marketplace quote requests."}
            </p>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="buyer-email"
                  className="mb-1 block text-sm font-medium"
                >
                  Email address
                </label>
                <input
                  id="buyer-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="buyer-password"
                  className="mb-1 block text-sm font-medium"
                >
                  Password
                </label>
                <input
                  id="buyer-password"
                  type="password"
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
                {isSignUp ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Use at least 6 characters. Your Supabase project may enforce
                    a stronger password policy.
                  </p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-5 text-sm text-slate-600">
              {isSignUp
                ? "Already registered?"
                : "New to the marketplace?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp((value) => !value);
                  setError("");
                  setNotice("");
                }}
                className="font-semibold text-blue-800 underline"
              >
                {isSignUp ? "Sign in" : "Create a buyer account"}
              </button>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
