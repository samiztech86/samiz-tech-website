"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type TrackingData = {
  success: true;
  orderStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
  paidAt: string | null;
  deliveredAt: string | null;
};

type TrackingResponse = {
  error?: string;
} & Partial<TrackingData>;

function formatDate(value: string | null | undefined): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "queued":
      return "Queued";
    case "in_progress":
      return "In progress";
    case "delivered":
      return "Delivered";
    default:
      return "Status unavailable";
  }
}

function getStatusDescription(status: string): string {
  switch (status) {
    case "queued":
      return "Your payment is confirmed. Your assessment is waiting to be started by our engineering team.";
    case "in_progress":
      return "Our engineering team is working on your assessment.";
    case "delivered":
      return "Your assessment has been marked as delivered. Check your email or contact Samiz if you need help accessing your report.";
    default:
      return "We could not identify the current assessment status. Please contact Samiz for assistance.";
  }
}

const steps = [
  { key: "queued", label: "Order queued" },
  { key: "in_progress", label: "Assessment in progress" },
  { key: "delivered", label: "Assessment delivered" },
];

function statusRank(status: string): number {
  return steps.findIndex((step) => step.key === status);
}

function AssessmentTrackingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTracking = useCallback(async (manual = false) => {
    if (!token) {
      setError("This tracking link is missing its token. Please use the original link provided after payment.");
      setData(null);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (manual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `/api/engineering-orders/track?token=${encodeURIComponent(token)}`,
        {
          method: "GET",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      const result = (await response.json()) as TrackingResponse;

      if (!response.ok || !result.success || !result.orderStatus) {
        setData(null);
        setError(
          result.error ||
            "We could not retrieve your assessment status. Please try again.",
        );
        return;
      }

      setData({
        success: true,
        orderStatus: result.orderStatus,
        createdAt: result.createdAt ?? null,
        updatedAt: result.updatedAt ?? null,
        paidAt: result.paidAt ?? null,
        deliveredAt: result.deliveredAt ?? null,
      });
    } catch {
      setError("Unable to connect to the tracking service. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTracking();
  }, [loadTracking]);

  const currentRank = data ? statusRank(data.orderStatus) : -1;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          Samiz Tech Engineering Ltd
        </Link>

        <header className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
            Engineering services
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Track your assessment
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            View the latest status of your remote energy assessment using your
            private tracking link.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <p role="status" className="text-slate-600">
              Loading your assessment status…
            </p>
          ) : error ? (
            <div role="alert">
              <h2 className="text-lg font-bold">Tracking unavailable</h2>
              <p className="mt-2 text-slate-600">{error}</p>
              <button
                type="button"
                onClick={() => void loadTracking(true)}
                disabled={refreshing || !token}
                className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? "Checking…" : "Try again"}
              </button>
            </div>
          ) : data ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Current status</p>
                  <h2 className="mt-1 text-2xl font-bold">
                    {getStatusLabel(data.orderStatus)}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => void loadTracking(true)}
                  disabled={refreshing}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {refreshing ? "Refreshing…" : "Refresh status"}
                </button>
              </div>

              <p className="mt-4 leading-7 text-slate-600">
                {getStatusDescription(data.orderStatus)}
              </p>

              <ol className="mt-8 space-y-5">
                {steps.map((step, index) => {
                  const complete =
                    currentRank >= 0 && index <= currentRank;
                  const current = index === currentRank;

                  return (
                    <li key={step.key} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          complete
                            ? "bg-blue-700 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {complete ? "✓" : index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{step.label}</p>
                        {current && (
                          <p className="mt-1 text-sm text-blue-700">
                            Current stage
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-8 border-t border-slate-200 pt-6">
                <h3 className="font-bold">Order timeline</h3>
                <dl className="mt-4 space-y-4 text-sm">
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-slate-500">Order received</dt>
                    <dd className="font-medium">{formatDate(data.createdAt)}</dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-slate-500">Payment confirmed</dt>
                    <dd className="font-medium">{formatDate(data.paidAt)}</dd>
                  </div>
                  <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                    <dt className="text-slate-500">Last status update</dt>
                    <dd className="font-medium">{formatDate(data.updatedAt)}</dd>
                  </div>
                  {data.orderStatus === "delivered" && (
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
                      <dt className="text-slate-500">Marked delivered</dt>
                      <dd className="font-medium">{formatDate(data.deliveredAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          ) : null}
        </section>

        <footer className="mt-6 text-sm leading-6 text-slate-500">
          Keep this tracking link private. If you need help with your
          assessment, visit our{" "}
          <Link
            href="/contact"
            className="font-semibold text-blue-700 hover:text-blue-900"
          >
            contact page
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}

export default function AssessmentTrackingPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
          <div className="mx-auto max-w-3xl">
            <p role="status">Loading assessment tracking…</p>
          </div>
        </main>
      }
    >
      <AssessmentTrackingContent />
    </Suspense>
  );
}