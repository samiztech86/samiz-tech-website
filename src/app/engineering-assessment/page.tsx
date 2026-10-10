"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type AssessmentMode = "remote" | "onsite";

export default function EngineeringAssessmentPage() {
  const [mode, setMode] = useState<AssessmentMode>("remote");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [propertyLocation, setPropertyLocation] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "onsite") {
      const message = [
        "Hello Samiz Tech Engineering Ltd.",
        "I would like to request an on-site engineering assessment quotation.",
        `Name: ${name}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Property type: ${propertyType}`,
        `Location: ${propertyLocation || "Not provided"}`,
        `Requirements: ${requirements || "To be discussed"}`,
      ].join("\n");

      window.open(
        `https://wa.me/2348155721739?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer",
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/engineering-orders/initialize",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phone,
            propertyType,
            propertyLocation,
            assessmentDetails: {
              requirements,
              assessmentMode: "remote",
            },
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success || !data.checkoutUrl) {
        setError(
          data.error || "Unable to start checkout. Please try again.",
        );
        return;
      }

      if (
        typeof data.orderId !== "string" ||
        typeof data.trackingToken !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(data.trackingToken)
      ) {
        setError(
          "We could not prepare your assessment tracking link. Please contact Samiz before proceeding.",
        );
        return;
      }

      try {
        sessionStorage.setItem(
          `samiz-assessment-tracking:${data.orderId}`,
          JSON.stringify({
            token: data.trackingToken,
            createdAt: Date.now(),
          }),
        );
      } catch {
        setError(
          "Your browser could not prepare the tracking link. Please enable session storage and try again.",
        );
        return;
      }

      window.location.assign(data.checkoutUrl);
    } catch {
      setError(
        "We could not connect to the payment service. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 sm:px-6 lg:py-20">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/services"
          className="text-sm font-semibold text-blue-700 hover:text-blue-900"
        >
          ← Engineering Services
        </Link>

        <header className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
            Samiz Tech Engineering Ltd
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Get an engineering assessment
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            Tell us about your electrical or energy challenge. Remote
            assessments are based on the information you provide; an on-site
            visit can be quoted separately based on scope and location.
          </p>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode("remote")}
            className={`rounded-2xl border p-5 text-left ${
              mode === "remote"
                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-lg font-bold">
              Remote assessment
            </span>
            <span className="mt-2 block text-sm text-slate-600">
              ₦10,000 · One-time payment
            </span>
            <span className="mt-2 block text-sm text-slate-600">
              Review of submitted details and a scoped engineering report.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode("onsite")}
            className={`rounded-2xl border p-5 text-left ${
              mode === "onsite"
                ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                : "border-slate-200 bg-white"
            }`}
          >
            <span className="block text-lg font-bold">
              On-site assessment
            </span>
            <span className="mt-2 block text-sm text-slate-600">
              Request a quotation
            </span>
            <span className="mt-2 block text-sm text-slate-600">
              Scope, location and travel requirements are considered.
            </span>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold">
              Full name *
              <input
                required
                maxLength={150}
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-600"
                placeholder="Your full name"
              />
            </label>

            <label className="block text-sm font-semibold">
              Email address *
              <input
                required
                type="email"
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-600"
                placeholder="you@example.com"
              />
            </label>

            <label className="block text-sm font-semibold">
              Phone number *
              <input
                required
                type="tel"
                maxLength={40}
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-600"
                placeholder="Your phone number"
              />
            </label>

            <label className="block text-sm font-semibold">
              Property or facility type *
              <select
                required
                value={propertyType}
                onChange={(event) => setPropertyType(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-blue-600"
              >
                <option>Residential</option>
                <option>Estate</option>
                <option>Office</option>
                <option>Retail or commercial</option>
                <option>Factory or industrial</option>
                <option>School or hospital</option>
                <option>Other</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold">
            Property location
            <input
              maxLength={250}
              value={propertyLocation}
              onChange={(event) => setPropertyLocation(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-600"
              placeholder="Town, state or area"
            />
          </label>

          <label className="block text-sm font-semibold">
            Describe the problem or report you need
            <textarea
              rows={5}
              maxLength={5000}
              value={requirements}
              onChange={(event) => setRequirements(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-blue-600"
              placeholder="For example: high electricity bills, inverter sizing, load assessment, solar requirements or generator performance."
            />
          </label>

          {mode === "remote" && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              The remote assessment is based on the information and documents
              you supply. Physical inspection, testing, statutory certification
              and detailed design are not included unless separately agreed.
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 px-6 py-4 text-sm font-bold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mode === "onsite"
              ? "Request on-site quotation via WhatsApp"
              : loading
                ? "Preparing secure checkout..."
                : "Continue to payment — ₦10,000"}
          </button>

          <p className="text-xs leading-5 text-slate-500">
            Remote checkout is a one-time payment. Do not submit emergency
            safety issues through this form.
          </p>
        </form>
      </div>
    </main>
  );
}