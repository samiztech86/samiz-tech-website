"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationResult = {
  success?: boolean;
  verified?: boolean;
  paymentStatus?: string;
  reference?: string;
  error?: string;
};

type PageState =
  | { status: "checking"; message: string }
  | { status: "success"; message: string; reference: string }
  | { status: "error"; message: string; reference?: string };

export default function MarketplacePaymentCallbackPage() {
  const [pageState, setPageState] = useState<PageState>({
    status: "checking",
    message: "Preparing to verify your payment...",
  });

  useEffect(() => {
    let disposed = false;

    async function verifyPayment() {
      const params = new URLSearchParams(window.location.search);
      const reference =
        params.get("reference")?.trim() ||
        params.get("trxref")?.trim() ||
        "";

      if (!reference) {
        if (!disposed) {
          setPageState({
            status: "error",
            message:
              "No payment reference was provided. If you attempted payment, contact Samiz support before paying again.",
          });
        }
        return;
      }

      if (!disposed) {
        setPageState({
          status: "checking",
          message: "Confirming your payment securely with Paystack...",
        });
      }

      try {
        const response = await fetch(
          "/api/marketplace/checkout/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            cache: "no-store",
            body: JSON.stringify({ reference }),
          },
        );

        const result =
          (await response.json()) as VerificationResult;

        if (disposed) return;

        if (
          response.ok &&
          result.success === true &&
          result.verified === true &&
          result.paymentStatus === "paid"
        ) {
          setPageState({
            status: "success",
            message:
              "Paystack has confirmed your payment and your marketplace order has been recorded as paid.",
            reference: result.reference || reference,
          });
          return;
        }

        setPageState({
          status: "error",
          message:
            result.error ||
            "We could not confirm your payment yet. If you have already paid, wait briefly and retry verification or contact Samiz support. Do not pay again until your transaction has been checked.",
          reference,
        });
      } catch {
        if (!disposed) {
          setPageState({
            status: "error",
            message:
              "We could not reach the payment verification service. If you have already paid, please retry later or contact Samiz support before attempting another payment.",
            reference,
          });
        }
      }
    }

    void verifyPayment();

    return () => {
      disposed = true;
    };
  }, []);

  const isChecking = pageState.status === "checking";
  const isSuccess = pageState.status === "success";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex items-center gap-3">
          <Image
            src="/samiz-logo.png"
            alt="Samiz Tech Engineering Ltd logo"
            width={44}
            height={44}
            priority
            className="h-11 w-11 rounded-xl object-contain"
          />
          <div>
            <p className="font-semibold">Samiz Tech Engineering Ltd</p>
            <p className="text-sm text-slate-500">
              Marketplace payment
            </p>
          </div>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="border-t border-slate-200 pt-7"
        >
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${
              isChecking
                ? "bg-blue-100 text-blue-700"
                : isSuccess
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-800"
            }`}
          >
            {isChecking ? "…" : isSuccess ? "✓" : "!"}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {isChecking
              ? "Verifying your payment"
              : isSuccess
                ? "Payment confirmed"
                : "Payment not confirmed"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {pageState.message}
          </p>

          {"reference" in pageState && pageState.reference && (
            <div className="mt-6 rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Payment reference
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {pageState.reference}
              </p>
            </div>
          )}

          {isSuccess && (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Keep your payment reference for future enquiries.
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-200 pt-6">
          <Link
            href="/marketplace"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Return to marketplace
          </Link>

          {!isChecking && !isSuccess && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Retry verification
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
