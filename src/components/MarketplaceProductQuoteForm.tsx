"use client";

import { useState, type FormEvent } from "react";

type Props = {
  productId: string;
  productName: string;
  supplierName: string | null;
};

export default function MarketplaceProductQuoteForm({
  productId,
  productName,
  supplierName,
}: Props) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [quantityUnit, setQuantityUnit] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [requestId, setRequestId] = useState("");

  async function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setError("");
    setSuccess("");
    setRequestId("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/marketplace/quote-requests", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          customerName,
          customerEmail,
          customerPhone,
          organizationName,
          quantity,
          quantityUnit,
          deliveryLocation,
          customerMessage,
          website,
        }),
      });

      const payload: {
        error?: unknown;
        message?: unknown;
        requestId?: unknown;
      } = await response.json();

      if (!response.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "We could not submit your enquiry. Please try again.",
        );
        return;
      }

      setSuccess(
        typeof payload.message === "string"
          ? payload.message
          : "Your quote request has been submitted.",
      );
      setRequestId(
        typeof payload.requestId === "string" ? payload.requestId : "",
      );

      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setOrganizationName("");
      setQuantity("");
      setQuantityUnit("");
      setDeliveryLocation("");
      setCustomerMessage("");
      setWebsite("");
    } catch {
      setError("A network error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="product-quote-heading"
      className="border border-slate-600 bg-slate-900/70 p-5 sm:p-6"
    >
      <h2
        id="product-quote-heading"
        className="text-xl font-bold text-white"
      >
        Request a quotation
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-300">
        Send an enquiry for this specific product. Provide your organisation,
        quantity and delivery details where available.
      </p>
      {supplierName ? (
        <p className="mt-2 text-sm text-slate-300">
          Supplier: <span className="font-semibold text-white">{supplierName}</span>
        </p>
      ) : null}

      {success ? (
        <div
          role="status"
          className="mt-5 border border-emerald-700 bg-emerald-950/50 p-4 text-sm text-emerald-200"
        >
          <p className="font-semibold">{success}</p>
          {requestId ? (
            <p className="mt-1 break-all">Request reference: {requestId}</p>
          ) : null}
        </div>
      ) : (
        <form onSubmit={submitRequest} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-quote-name" className="mb-1 block text-sm font-medium text-slate-200">
                Full name *
              </label>
              <input
                id="product-quote-name"
                name="customerName"
                autoComplete="name"
                required
                maxLength={120}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="product-quote-organization" className="mb-1 block text-sm font-medium text-slate-200">
                Company / organisation
              </label>
              <input
                id="product-quote-organization"
                name="organizationName"
                autoComplete="organization"
                maxLength={160}
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="product-quote-email" className="mb-1 block text-sm font-medium text-slate-200">
                Business or contact email *
              </label>
              <input
                id="product-quote-email"
                name="customerEmail"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="product-quote-phone" className="mb-1 block text-sm font-medium text-slate-200">
                Phone number *
              </label>
              <input
                id="product-quote-phone"
                name="customerPhone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={40}
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="product-quote-quantity" className="mb-1 block text-sm font-medium text-slate-200">
                Quantity
              </label>
              <input
                id="product-quote-quantity"
                name="quantity"
                type="number"
                min="0.001"
                step="0.001"
                max="1000000000"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="product-quote-unit" className="mb-1 block text-sm font-medium text-slate-200">
                Quantity unit
              </label>
              <input
                id="product-quote-unit"
                name="quantityUnit"
                maxLength={40}
                placeholder="e.g. units, pieces, sets"
                value={quantityUnit}
                onChange={(event) => setQuantityUnit(event.target.value)}
                className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="product-quote-location" className="mb-1 block text-sm font-medium text-slate-200">
              Delivery location
            </label>
            <input
              id="product-quote-location"
              name="deliveryLocation"
              autoComplete="shipping street-address"
              maxLength={250}
              placeholder="Town, state or delivery address"
              value={deliveryLocation}
              onChange={(event) => setDeliveryLocation(event.target.value)}
              className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="product-quote-message" className="mb-1 block text-sm font-medium text-slate-200">
              Requirements or project details
            </label>
            <textarea
              id="product-quote-message"
              name="customerMessage"
              rows={4}
              maxLength={5000}
              placeholder="Tell the supplier about your application, required specifications, delivery timeline or project."
              value={customerMessage}
              onChange={(event) => setCustomerMessage(event.target.value)}
              className="w-full border border-slate-500 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          <div
            aria-hidden="true"
            className="absolute left-[-10000px] h-px w-px overflow-hidden"
          >
            <label htmlFor="product-quote-website">Website</label>
            <input
              id="product-quote-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>

          {error ? (
            <p role="alert" className="text-sm text-red-300">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Submitting enquiry..." : "Submit product enquiry"}
          </button>
          <p className="text-xs leading-5 text-slate-400">
            Your enquiry is submitted to the existing Samiz Tech Marketplace
            quote system. Submission does not confirm stock, final pricing or
            delivery terms.
          </p>
        </form>
      )}
      <p className="mt-4 text-xs text-slate-400">
        Product: {productName}
      </p>
    </section>
  );
}