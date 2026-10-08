"use client";

import Link from "next/link";
import { useSubscription } from "@/lib/subscription/provider";
import { checkToolAccess } from "@/lib/subscription/access";
import type { ToolId } from "@/lib/subscription/plans";
import type { ReactNode } from "react";

type SubscriptionGateProps = {
  tool: ToolId;
  children: ReactNode;
  returnTo?: string;
};

export default function SubscriptionGate({
  tool,
  children,
  returnTo,
}: SubscriptionGateProps) {
  const { state, hydrated } = useSubscription();

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          Checking your Energy Tools subscription...
        </p>
      </div>
    );
  }

  const access = checkToolAccess({
    plan: state.plan,
    coins: state.coins,
    tool,
    subscriptionExpiresAt: state.subscriptionExpiresAt,
  });

  if (!access.allowed) {
    const destination =
      returnTo ||
      (typeof window !== "undefined"
        ? window.location.pathname
        : "/energy-tools");

    const pricingUrl = `/pricing?returnTo=${encodeURIComponent(
      destination,
    )}`;

    return (
      <section className="rounded-2xl border border-slate-200 bg-[#07111f] p-6 text-white shadow-xl sm:p-8 lg:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-400">
            Overall calculation locked
          </p>

          <div className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/15 ring-1 ring-blue-400/30">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-8 w-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
              />
              <path
                d="M8 10V7a4 4 0 0 1 8 0v3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <h2 className="mt-5 text-2xl font-black text-white sm:text-3xl">
            Unlock your Energy Assessment results
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
            Your assessment inputs are ready. Subscribe to unlock the
            overall calculation, detailed energy results, and Energy Report.
          </p>

          <div className="mt-6 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-blue-400">
                01
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Overall calculation
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-blue-400">
                02
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Detailed results
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-blue-400">
                03
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Energy Report
              </p>
            </div>
          </div>

          <Link
            href={pricingUrl}
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:bg-blue-500 sm:w-auto sm:min-w-[260px]"
          >
            Unlock Overall Calculation
          </Link>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Available with an active Starter, Pro, or Business Energy Tools
            subscription.
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
