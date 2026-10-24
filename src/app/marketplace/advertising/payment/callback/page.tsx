"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type VerificationResult = {
  success?: boolean;
  verified?: boolean;
  error?: string;
  message?: string;
  reference?: string;
  campaignId?: string;
  paymentStatus?: string;
  campaignStatus?: string;
};

function CallbackContent() {
  const searchParams = useSearchParams();
  const reference =
    searchParams.get("reference")?.trim() ||
    searchParams.get("trxref")?.trim() ||
    "";

  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setResult({
        verified: false,
        error: "No payment reference was supplied. Please check your payment link or contact Samiz support.",
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/marketplace/advertising/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ reference }),
      });

      const data = (await response.json()) as VerificationResult;

      if (!response.ok) {
        setResult({
          ...data,
          verified: data.verified === true,
          error:
            data.error ||
            "We could not verify this payment. Please try again.",
        });
        return;
      }

      setResult(data);
    } catch {
      setResult({
        verified: false,
        reference,
        error:
          "We could not connect to the verification service. Your payment status has not been confirmed here. Please retry.",
      });
    } finally {
      setLoading(false);
    }
  }, [reference]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verifyPayment();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [verifyPayment, attempt]);

  const paymentConfirmed = result?.verified === true;
  const paymentPending =
    result?.verified === false &&
    result?.paymentStatus === "pending" &&
    !result?.error;

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-16">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-9">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Samiz Tech Marketplace
        </p>

        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Advertising payment
        </h1>

        {loading ? (
          <div className="mt-6" role="status" aria-live="polite">
            <p className="font-medium text-gray-900">
              Verifying your payment…
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Please wait while we check the transaction directly with
              Paystack. Do not make another payment while verification is in
              progress.
            </p>
          </div>
        ) : paymentConfirmed ? (
          <div className="mt-6" aria-live="polite">
            <p className="font-semibold text-green-700">
              Payment confirmed
            </p>
            <p className="mt-2 text-gray-700">
              Your advertising payment has been verified. Your campaign is
              awaiting Samiz admin review and approval; it is not live yet.
            </p>
            {result?.campaignStatus ? (
              <p className="mt-3 text-sm text-gray-600">
                Campaign status: {result.campaignStatus.replaceAll("_", " ")}
              </p>
            ) : null}
            {reference ? (
              <p className="mt-3 break-all text-sm text-gray-600">
                Payment reference: {reference}
              </p>
            ) : null}
          </div>
        ) : paymentPending ? (
          <div className="mt-6" aria-live="polite">
            <p className="font-semibold text-amber-700">
              Payment not confirmed yet
            </p>
            <p className="mt-2 text-gray-700">
              Paystack has not reported a successful transaction. You can
              retry verification. Your campaign will not be published unless
              payment is verified and an admin approves it.
            </p>
          </div>
        ) : (
          <div className="mt-6" aria-live="polite">
            <p className="font-semibold text-red-700">
              Verification needs attention
            </p>
            <p className="mt-2 text-gray-700">
              {result?.error ||
                "We could not confirm the payment status. This does not by itself mean the payment failed."}
            </p>
            {reference ? (
              <p className="mt-3 break-all text-sm text-gray-600">
                Payment reference: {reference}
              </p>
            ) : null}
          </div>
        )}

        {!loading && !paymentConfirmed ? (
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
            className="mt-6 rounded-lg bg-gray-900 px-5 py-3 font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Retry verification
          </button>
        ) : null}

        <div className="mt-8 border-t border-gray-200 pt-5">
          <a
            href="/marketplace/advertising"
            className="font-medium text-blue-700 underline underline-offset-4"
          >
            Return to marketplace advertising
          </a>
        </div>
      </section>
    </main>
  );
}

export default function AdvertisingPaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-5 py-16">
          Loading payment details…
        </main>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

