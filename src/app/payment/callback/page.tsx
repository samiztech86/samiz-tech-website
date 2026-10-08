"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  loadSubscriptionState,
  saveSubscriptionState,
} from "@/lib/subscription/storage";

import type {
  SubscriptionPlan,
  SubscriptionStatus,
} from "@/lib/subscription/plans";

type VerificationState =
  | "checking"
  | "successful"
  | "failed"
  | "cancelled";

function addOneMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1);
  return result;
}

export default function PaymentCallbackPage() {
  const [state, setState] =
    useState<VerificationState>("checking");

  const [message, setMessage] =
    useState("Verifying your Paystack payment...");

  const [returnTo, setReturnTo] = useState("/energy-tools");

  useEffect(() => {
    const verifyPayment = async () => {
      const params = new URLSearchParams(
        window.location.search,
      );

      const reference =
        params.get("reference") ||
        params.get("trxref");

      const status = params.get("status");

      const requestedReturnTo =
        params.get("returnTo") || "";

      const returnTo =
        requestedReturnTo.startsWith("/") &&
        !requestedReturnTo.startsWith("//")
          ? requestedReturnTo
          : "/energy-tools";

      setReturnTo(returnTo);

      if (status === "cancelled") {
        setState("cancelled");
        setMessage("The payment was cancelled.");
        return;
      }

      if (!reference) {
        setState("failed");
        setMessage(
          "The Paystack payment reference was not found.",
        );
        return;
      }

      try {
        const response = await fetch(
          "/api/payments/paystack/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              reference,
            }),
          },
        );

        const data = await response.json();

        if (
          !response.ok ||
          !data.success ||
          !data.verified
        ) {
          setState("failed");

          setMessage(
            data.error ||
              "We could not verify your payment.",
          );

          return;
        }

        const plan =
          data.plan as SubscriptionPlan;

        if (
          plan !== "starter" &&
          plan !== "pro" &&
          plan !== "business"
        ) {
          setState("failed");
          setMessage(
            "The verified payment contains an invalid Samiz plan.",
          );
          return;
        }

        const now = new Date();
        const expiresAt = addOneMonth(now);

        const previousState =
          loadSubscriptionState();

        const nextState = {
          ...previousState,
          plan,
          status: "active" as SubscriptionStatus,
          coins: Infinity,
          customerEmail:
            data.customer?.email ||
            previousState.customerEmail,
          customerName:
            data.customer?.name ||
            previousState.customerName,
          subscriptionStartedAt:
            now.toISOString(),
          subscriptionExpiresAt:
            expiresAt.toISOString(),
        };

        saveSubscriptionState(nextState);

        window.setTimeout(() => {
          window.location.replace(returnTo);
        }, 1000);

        setState("successful");

        setMessage(
          `Your ${data.planName || plan} payment has been verified successfully and your subscription has been activated.`,
        );
      } catch (error) {
        console.error(
          "Payment callback verification failed:",
          error,
        );

        setState("failed");

        setMessage(
          "We could not complete payment verification. Please try again.",
        );
      }
    };

    void verifyPayment();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black ${
              state === "successful"
                ? "bg-emerald-100 text-emerald-700"
                : state === "checking"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {state === "successful"
              ? "✓"
              : state === "checking"
                ? "..."
                : "!"}
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Samiz Energy Tools
          </p>

          <h1 className="mt-3 text-3xl font-black">
            {state === "checking"
              ? "Verifying payment"
              : state === "successful"
                ? "Payment successful"
                : state === "cancelled"
                  ? "Payment cancelled"
                  : "Payment verification failed"}
          </h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            {message}
          </p>

          {state === "successful" && (
            <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm leading-6 text-emerald-900">
              <p className="font-bold">
                Your paid access is now active.
              </p>

              <p className="mt-2">
                Your subscription has been recorded on
                the Samiz server.
              </p>
            </div>
          )}

          {state === "successful" && (
            <Link
              href={returnTo}
              className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
            >
              Continue to Energy Tools
            </Link>
          )}

          {state !== "successful" && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/pricing"
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700"
              >
                Return to Pricing
              </Link>

              <Link
                href="/"
                className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-black text-slate-800 hover:border-blue-500 hover:text-blue-600"
              >
                Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
