"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentState = "checking" | "successful" | "failed";

export default function EngineeringPaymentCallbackPage() {
  const [state, setState] = useState<PaymentState>("checking");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [message, setMessage] = useState(
    "Verifying your engineering assessment payment...",
  );

  useEffect(() => {
    let active = true;

    async function verifyPayment() {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId") || "";
      const reference =
        params.get("reference") || params.get("trxref") || "";

      if (!orderId || !reference) {
        if (active) {
          setState("failed");
          setMessage(
            "The order ID or Paystack payment reference is missing. Please contact Samiz if you have completed payment.",
          );
        }
        return;
      }

      try {
        const response = await fetch(
          "/api/engineering-orders/verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, reference }),
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!active) return;

        if (!response.ok || !data.success || !data.verified) {
          setState("failed");
          setMessage(
            data.error ||
              "We could not verify your payment. If you have paid, please contact Samiz with your payment reference.",
          );
          return;
        }

        if (
          typeof data.trackingUrl === "string" &&
          data.trackingUrl.startsWith("/engineering-assessment/track?")
        ) {
          setTrackingUrl(data.trackingUrl);
        }

        setState("successful");
        const statusMessage =
          data.orderStatus === "queued"
            ? "Your engineering assessment order is queued for processing."
            : "Your engineering assessment payment is verified. Samiz will process your order according to its current status.";

        setMessage(
          `Your â‚¦10,000 payment has been verified. ${statusMessage}`,
        );
      } catch {
        if (!active) return;

        setState("failed");
        setMessage(
          "We could not reach the payment verification service. If you have paid, please contact Samiz with your payment reference before trying to pay again.",
        );
      }
    }

    void verifyPayment();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
          Samiz Tech Engineering Ltd
        </p>

        <h1 className="mt-4 text-3xl font-black">
          {state === "checking"
            ? "Verifying payment"
            : state === "successful"
              ? "Payment confirmed"
              : "Payment not confirmed"}
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-600">
          {message}
        </p>

        {state === "successful" && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-left text-sm leading-6 text-emerald-900">
            <p className="font-bold">What happens next?</p>
            <p className="mt-2">
              Your assessment order has been received. Samiz will review the
              information you submitted and contact you if additional details
              are needed.
            </p>
            <p className="mt-2">
              Keep your Paystack payment reference for your records.
            </p>
            {trackingUrl && (
              <Link
                href={trackingUrl}
                className="mt-4 inline-flex rounded-xl bg-blue-700 px-5 py-3 font-bold text-white hover:bg-blue-800"
              >
                Track your assessment
              </Link>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/contact"
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-800 hover:border-blue-500"
          >
            Contact Samiz
          </Link>
        </div>
      </div>
    </main>
  );
}
