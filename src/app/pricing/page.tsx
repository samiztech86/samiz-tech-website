"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type PlanId = "starter" | "pro" | "business";

const plans = {
  starter: {
    name: "Starter",
    price: "NGN 8,500",
    description: "For homeowners and individuals who need practical energy planning.",
    features: [
      "Energy assessment",
      "Solar sizing",
      "Inverter sizing",
      "Battery sizing",
      "Generator analysis",
      "Energy reports",
      "Professional calculations",
    ],
  },
  pro: {
    name: "Pro",
    price: "NGN 15,000",
    description: "For professionals, installers and users who need deeper energy analysis.",
    features: [
      "Everything in Starter",
      "Advanced solar sizing",
      "Advanced inverter & battery sizing",
      "Advanced generator analysis",
      "Detailed energy reports",
      "Professional report generation",
      "Advanced engineering recommendations",
      "No advertising",
    ],
  },
  business: {
    name: "Business",
    price: "NGN 45,000",
    description: "For companies, consultants, facilities and organisations using Energy Tools professionally.",
    features: [
      "Everything in Pro",
      "Business energy assessments",
      "Multi-property planning",
      "Professional documentation",
      "Advanced generator analysis",
      "Detailed engineering reports",
      "Business-ready energy planning",
      "Priority product access",
    ],
  },
} as const;

const freeFeatures = [
  "1 free Energy Tools run",
  "Basic energy assessment",
  "Basic solar sizing",
  "Basic inverter sizing",
  "Basic battery estimate",
  "Basic generator analysis",
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startCheckout = async (plan: PlanId) => {
    setError("");
    setSelectedPlan(plan);

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address to continue.");
      return;
    }

    if (!name.trim()) {
      setError("Enter your name to continue.");
      return;
    }

    if (!phone.trim()) {
      setError("Enter your phone number to continue.");
      return;
    }

    setLoading(true);


    const requestedReturnTo =
      new URLSearchParams(window.location.search).get("returnTo") || "";

    const returnTo =
      requestedReturnTo.startsWith("/") &&
      !requestedReturnTo.startsWith("//")
        ? requestedReturnTo
        : "/energy-tools";
    try {
      const response = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          phone: phone.trim(),
          plan,
          returnTo,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.checkoutUrl) {
        setError(
          data.error || "Unable to start Paystack checkout.",
        );
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      setError("Unable to connect to the payment service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">

      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Plans & access
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            Professional energy tools for every level.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Start with one free Energy Tools run. Upgrade to Starter, Pro or
            Business when you need more powerful energy planning and
            professional reporting.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-4">
          <PlanCard
            name="Free"
            price="NGN 0"
            period="1 free run"
            description="Try Samiz Energy Tools and perform basic energy planning."
            features={freeFeatures}
            buttonText="Start Free"
            href="/energy-tools/calculator"
          />

          <PaidPlanCard
            plan="starter"
            {...plans.starter}
            selectedPlan={selectedPlan}
            loading={loading}
            onCheckout={startCheckout}
          />

          <PaidPlanCard
            plan="pro"
            {...plans.pro}
            selectedPlan={selectedPlan}
            loading={loading}
            onCheckout={startCheckout}
            recommended
          />

          <PaidPlanCard
            plan="business"
            {...plans.business}
            selectedPlan={selectedPlan}
            loading={loading}
            onCheckout={startCheckout}
          />
        </div>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Get started
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Enter your details once, then choose your plan.
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Your name, email and phone number are used to identify your
            purchase and prepare your payment checkout.
          </p>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            <Field
              label="Name"
              value={name}
              onChange={setName}
              type="text"
              placeholder="Your name"
            />

            <Field
              label="Email address"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@example.com"
            />

            <Field
              label="Phone"
              value={phone}
              onChange={setPhone}
              type="tel"
              placeholder="+234..."
            />
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
              {error}
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-slate-500">
            After choosing a paid plan, you will be redirected to Paystack
            to complete payment securely.
          </p>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            By proceeding with a paid plan, you acknowledge our{" "}
            <Link
              href="/refund-policy"
              className="font-bold text-blue-600 hover:underline"
            >
              Refund Policy
            </Link>
            .
          </p>
        </section>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
            Samiz Energy Tools
          </p>

          <h2 className="mt-3 text-2xl font-black">
            Simple pricing. Professional energy planning.
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            Starter is designed for everyday energy planning, Pro is built for
            deeper professional analysis, and Business is designed for
            organisations and professional users handling larger or multiple
            energy projects.
          </p>
        </div>
      </section>

    </div>
  );
}

function PaidPlanCard({
  plan,
  name,
  price,
  description,
  features,
  selectedPlan,
  loading,
  onCheckout,
  recommended = false,
}: {
  plan: PlanId;
  name: string;
  price: string;
  description: string;
  features: readonly string[];
  selectedPlan: PlanId | null;
  loading: boolean;
  onCheckout: (plan: PlanId) => void;
  recommended?: boolean;
}) {
  return (
    <article
      className={`relative rounded-2xl border bg-white p-6 shadow-sm sm:p-8 ${
        recommended
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-slate-200"
      }`}
    >
      {recommended && (
        <div className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
          Recommended
        </div>
      )}

      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">
        {name}
      </p>

      <h2 className="mt-4 text-3xl font-black">{price}</h2>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        Per month
      </p>

      <p className="mt-5 min-h-[72px] text-sm leading-6 text-slate-600">
        {description}
      </p>

      <button
        type="button"
        onClick={() => onCheckout(plan)}
        disabled={loading}
        className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading && selectedPlan === plan
          ? "Opening Paystack..."
          : `Choose ${name}`}
      </button>

      <div className="mt-7 border-t border-slate-200 pt-6">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          Includes
        </p>

        <ul className="mt-4 space-y-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm leading-6 text-slate-700"
            >
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">
                ✓
              </span>

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "email" | "text" | "tel";
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </label>
  );
}

function PlanCard({
  name,
  description,
  price,
  period,
  features,
  buttonText,
  href,
}: {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  buttonText: string;
  href: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        {name}
      </p>

      <h2 className="mt-4 text-3xl font-black">{price}</h2>

      <p className="mt-1 text-sm font-semibold text-slate-500">
        {period}
      </p>

      <p className="mt-5 min-h-[72px] text-sm leading-6 text-slate-600">
        {description}
      </p>

      <Link
        href={href}
        className="mt-7 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-black text-slate-800 transition hover:border-blue-500 hover:text-blue-600"
      >
        {buttonText}
      </Link>

      <div className="mt-7 border-t border-slate-200 pt-6">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          Includes
        </p>

        <ul className="mt-4 space-y-3">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-sm leading-6 text-slate-700"
            >
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-black text-blue-700">
                ✓
              </span>

              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}









