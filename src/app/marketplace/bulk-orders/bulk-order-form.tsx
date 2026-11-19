"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function BulkOrderForm() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [reference, setReference] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus("");
    setReference("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const products = String(data.get("products") || "").trim();
    const quantity = String(data.get("quantity") || "").trim();
    const location = String(data.get("location") || "").trim();
    const timeframe = String(data.get("timeframe") || "").trim();
    const specifications = String(data.get("specifications") || "").trim();

    const message = [
      "BULK ORDER / FACTORY PRICING REQUEST",
      "",
      `Products or materials: ${products}`,
      `Required quantity: ${quantity}`,
      `Delivery location: ${location}`,
      `Required timeframe: ${timeframe || "Not specified"}`,
      "",
      "Technical specifications / additional requirements:",
      specifications || "None supplied",
    ].join("\n");

    try {
      const response = await fetch("/api/contact-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") || "").trim(),
          company: String(data.get("company") || "").trim(),
          phone: String(data.get("phone") || "").trim(),
          email: String(data.get("email") || "").trim(),
          service: "Bulk Orders & Factory Pricing",
          message,
          website: String(data.get("website") || ""),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Unable to submit your request.");
      }

      setReference(result.reference || result.referenceNumber || "");
      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Full name *
          <input name="name" required maxLength={120} className={inputClass} />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Company / Organisation
          <input name="company" maxLength={150} className={inputClass} />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Phone number *
          <input name="phone" type="tel" required maxLength={40} className={inputClass} />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input name="email" type="email" maxLength={254} className={inputClass} />
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        Products or materials required *
        <textarea
          name="products"
          required
          rows={3}
          maxLength={1500}
          placeholder="List the products, equipment, materials or model numbers you need."
          className={inputClass}
        />
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Required quantity *
          <input
            name="quantity"
            required
            maxLength={200}
            placeholder="e.g. 100 units, 500 metres, 20 pallets"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700">
          Delivery location *
          <input
            name="location"
            required
            maxLength={150}
            placeholder="City and state"
            className={inputClass}
          />
        </label>
      </div>

      <label className="block text-sm font-semibold text-slate-700">
        When do you need the products?
        <input
          name="timeframe"
          maxLength={100}
          placeholder="e.g. Immediately, within 2 weeks"
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Technical specifications or additional requirements
        <textarea
          name="specifications"
          rows={4}
          maxLength={1200}
          placeholder="Include preferred brands, specifications, certifications or packaging requirements."
          className={inputClass}
        />
      </label>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {status === "success" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <p className="font-semibold">Your bulk pricing request has been submitted.</p>
          <p className="mt-1">
            Our team will review your requirements and follow up.
            {reference ? ` Reference: ${reference}` : ""}
          </p>
        </div>
      )}

      {status && status !== "success" && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {status}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-700 px-6 py-4 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Submitting request..." : "Submit Bulk Pricing Request"}
      </button>

      <p className="text-xs leading-5 text-slate-500">
        Submitting this form is a request for a quotation, not a confirmed order
        or fixed-price offer. Final pricing and availability depend on quantity,
        manufacturer or supplier confirmation, minimum order quantities, stock
        and delivery logistics.
      </p>
    </form>
  );
}