"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type BuyerOrder = {
  id: string;
  product_id: string;
  supplier_id: string;
  product_name: string;
  quantity: number | string;
  unit_price_kobo: number | string;
  subtotal_kobo: number | string;
  currency: string;
  payment_status: string;
  paystack_reference: string | null;
  created_at: string;
  quote_request_id: string | null;
  quote_id: string | null;
  quoted_total_kobo: number | string | null;
  fulfilment_status: string | null;
  fulfilment_updated_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  order_type: "fixed_price" | "quotation";
  supplier: { id: string; business_name: string } | null;
};

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not recorded"
    : date.toLocaleString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function formatMoney(amountKobo: number | string | null, currency: string) {
  const amount = Number(amountKobo);

  if (amountKobo === null || !Number.isFinite(amount)) {
    return "Amount unavailable";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function readableStatus(value: string | null) {
  return value
    ? value.replaceAll("_", " ")
    : "Awaiting supplier update";
}

export default function BuyerOrdersPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/marketplace/buyer/orders", {
        method: "GET",
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        orders?: BuyerOrder[];
        error?: string;
      };

      if (response.status === 401) {
        setSignedIn(false);
        setOrders([]);
        return;
      }

      if (!response.ok) {
        throw new Error(payload.error || "Unable to load your orders.");
      }

      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
      setSignedIn(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load your orders. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Load the buyer's orders when the page opens.
    void loadOrders();
  }, [loadOrders]);

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
            emailRedirectTo: `${window.location.origin}/marketplace/my-orders`,
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

      await loadOrders();
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

  async function handleResumePayment(order: BuyerOrder) {
    setError("");
    setNotice("");
    setPayingOrderId(order.id);

    try {
      const response = await fetch("/api/marketplace/checkout/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        needsVerification?: boolean;
        authorizationUrl?: string;
        reference?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.error || "Unable to resume payment. Please try again.",
        );
      }

      if (payload.needsVerification && payload.reference) {
        const verifyResponse = await fetch(
          "/api/marketplace/checkout/verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: payload.reference }),
          },
        );

        const verifyPayload = (await verifyResponse.json()) as {
          verified?: boolean;
          paymentStatus?: string;
          error?: string;
          message?: string;
        };

        if (
          !verifyResponse.ok ||
          verifyPayload.verified !== true ||
          verifyPayload.paymentStatus?.toLowerCase() !== "paid"
        ) {
          throw new Error(
            verifyPayload.error ||
              verifyPayload.message ||
              "An existing transaction was found but payment is not yet confirmed. Refresh your orders before taking any further action.",
          );
        }

        setNotice("Payment verified successfully. Your orders are refreshing.");
        await loadOrders();
        return;
      }

      if (!payload.authorizationUrl) {
        throw new Error("Paystack did not return a checkout URL.");
      }

      window.location.assign(payload.authorizationUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to resume payment. Please refresh and try again.",
      );
    } finally {
      setPayingOrderId(null);
    }
  }

  async function handleSignOut() {
    setError("");
    setNotice("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) throw signOutError;

      setOrders([]);
      setSignedIn(false);
      setPassword("");
      setNotice("You have signed out.");
    } catch {
      setError("Unable to sign out. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap gap-4 text-sm font-medium">
          <Link
            href="/marketplace"
            className="text-blue-700 hover:underline"
          >
            Marketplace
          </Link>
          <Link
            href="/marketplace/my-quotes"
            className="text-blue-700 hover:underline"
          >
            My Quotes
          </Link>
        </nav>

        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Samiz Tech Marketplace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">My Orders</h1>
          <p className="mt-3 max-w-2xl leading-6 text-slate-600">
            Track your fixed-price purchases and accepted quotations, including
            payment confirmation and supplier fulfilment updates.
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

        {loading ? (
          <p className="mt-8 text-sm text-slate-600" role="status">
            Loading your orders...
          </p>
        ) : signedIn ? (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                {orders.length} order{orders.length === 1 ? "" : "s"}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => void loadOrders()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={() => void handleSignOut()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-100"
                >
                  Sign out
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="text-lg font-semibold">No linked orders yet</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Orders placed while signed in will appear here. Guest
                  purchases and older orders not linked to this account will
                  not appear automatically.
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
                {orders.map((order) => {
                  const paymentStatus = order.payment_status.toLowerCase();
                  const paid = paymentStatus === "paid";

                  return (
                    <article
                      key={order.id}
                      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-bold">
                            {order.product_name || "Marketplace product"}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Supplier:{" "}
                            {order.supplier?.business_name || "Supplier"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Order ID: {order.id}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            Placed: {formatDate(order.created_at)}
                          </p>
                        </div>

                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {order.order_type === "quotation"
                            ? "Quotation order"
                            : "Fixed-price order"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
                        <div>
                          <p className="text-sm text-slate-500">Quantity</p>
                          <p className="mt-1 font-semibold">{order.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Order total</p>
                          <p className="mt-1 text-lg font-bold">
                            {formatMoney(
                              order.quoted_total_kobo ?? order.subtotal_kobo,
                              order.currency,
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Payment</p>
                          <p className="mt-1 font-semibold capitalize">
                            {readableStatus(order.payment_status)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500">Fulfilment</p>
                          <p className="mt-1 font-semibold capitalize">
                            {readableStatus(order.fulfilment_status)}
                          </p>
                        </div>
                      </div>

                      {order.paystack_reference ? (
                        <p className="mt-4 break-all text-xs text-slate-500">
                          Payment reference: {order.paystack_reference}
                        </p>
                      ) : null}

                      <div className="mt-5 rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold">Delivery timeline</h3>
                        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-slate-500">Last status update</dt>
                            <dd className="mt-1 font-medium">
                              {formatDate(order.fulfilment_updated_at)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Dispatched</dt>
                            <dd className="mt-1 font-medium">
                              {formatDate(order.dispatched_at)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Delivered</dt>
                            <dd className="mt-1 font-medium">
                              {formatDate(order.delivered_at)}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {!paid ? (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm text-slate-600">
                            Payment is not yet confirmed. If you previously
                            started checkout, this action checks the existing
                            payment reference before attempting to resume it.
                          </p>

                          {order.order_type === "fixed_price" &&
                          paymentStatus === "pending" ? (
                            <button
                              type="button"
                              onClick={() => void handleResumePayment(order)}
                              disabled={payingOrderId !== null}
                              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {payingOrderId === order.id
                                ? "Checking payment..."
                                : "Pay / Resume Payment"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">
              Sign in to view your orders
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Use your buyer account to view purchases linked to your account.
            </p>

            <form onSubmit={handleAuth} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="buyer-email"
                  className="mb-2 block text-sm font-medium"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label
                  htmlFor="buyer-password"
                  className="mb-2 block text-sm font-medium"
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create buyer account"
                    : "Sign in"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setIsSignUp((current) => !current);
                setError("");
                setNotice("");
              }}
              className="mt-4 text-sm font-semibold text-blue-700 hover:underline"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "New buyer? Create an account"}
            </button>
          </section>
        )}
      </div>
    </main>
  );
}

