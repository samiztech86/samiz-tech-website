"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type DashboardData = {
  profile: {
    business_name: string;
    verification_status: string;
    created_at: string;
    payout_status: string | null;
    payout_bank_name: string | null;
    payout_account_name: string | null;
    payout_account_last4: string | null;  } | null;
  products: Array<{
    id: string;
    name: string;
    category: string;
    price_type: string;
    product_status: string;
    is_available: boolean;
    is_listed: boolean;
    indicative_price: number | null;
    currency: string;
    image_urls: string[] | null;
    created_at: string;
  }>;
  requests: Array<{
    id: string;
    product_id: string;
    organization_name: string | null;
    quantity: number | null;
    quantity_unit: string | null;
    delivery_location: string | null;
    customer_message: string | null;
    request_status: string;
    created_at: string;
  }>;
  orders: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price_kobo: number;
    subtotal_kobo: number;
    commission_kobo: number;
    supplier_amount_kobo: number;
    currency: string;
    payment_status: string;
    paid_at: string | null;
    created_at: string;
    fulfilment_status: string;
    fulfilment_updated_at: string | null;
    dispatched_at: string | null;
    delivered_at: string | null;
  }>;
  message?: string | null;
};

export default function SupplierDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [payoutBanks, setPayoutBanks] = useState<Array<{ name: string; code: string }>>([]);
  const [payoutBankCode, setPayoutBankCode] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutBanksLoading, setPayoutBanksLoading] = useState(false);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutBankError, setPayoutBankError] = useState("");
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState("");
  const [productName, setProductName] = useState("");
  const [productCategory, setProductCategory] = useState("solar_backup_power");
  const [productDescription, setProductDescription] = useState("");
  const [productBrand, setProductBrand] = useState("");
  const [productModel, setProductModel] = useState("");
  const [productPriceType, setProductPriceType] = useState("quote_only");
  const [productPrice, setProductPrice] = useState("");
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [submissionErrors, setSubmissionErrors] = useState<Record<string, string>>({});
  const [managingProductId, setManagingProductId] = useState<string | null>(null);
  const [managementErrors, setManagementErrors] = useState<Record<string, string>>({});
  const [managementMessages, setManagementMessages] = useState<Record<string, string>>({});
  const [productImages, setProductImages] = useState<File[]>([]);
  const [quoteSubmittingId, setQuoteSubmittingId] = useState<string | null>(null);
  const [quoteErrors, setQuoteErrors] = useState<Record<string, string>>({});
  const [quoteMessages, setQuoteMessages] = useState<Record<string, string>>({});
  const [fulfilmentNotes, setFulfilmentNotes] = useState<Record<string, string>>({});
  const [fulfilmentSubmittingId, setFulfilmentSubmittingId] = useState<string | null>(null);
  const [fulfilmentErrors, setFulfilmentErrors] = useState<Record<string, string>>({});
  const [fulfilmentMessages, setFulfilmentMessages] = useState<Record<string, string>>({});
  const imagePreviews = useMemo(
    () =>
      productImages.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [productImages],
  );

  const submitProductListing = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setProductError("");
    setProductSuccess("");
    setProductSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", productName);
      formData.append("category", productCategory);
      formData.append("description", productDescription);
      formData.append("brand", productBrand);
      formData.append("model_number", productModel);
      formData.append("price_type", productPriceType);
      formData.append(
        "indicative_price",
        productPriceType === "indicative" ? productPrice : "",
      );
      for (const file of productImages) {
        formData.append("images", file);
      }

      const response = await fetch("/api/marketplace/supplier/products", {
        method: "POST",
        cache: "no-store",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        setProductError(
          typeof payload.error === "string"
            ? payload.error
            : "Unable to save this product.",
        );
        return;
      }

      setProductName("");
      setProductCategory("solar_backup_power");
      setProductDescription("");
      setProductBrand("");
      setProductModel("");
      setProductPriceType("quote_only");
      setProductPrice("");
      setProductImages([]);
      setProductSuccess(
        typeof payload.message === "string"
          ? payload.message
          : "Product saved as a draft.",
      );

      await loadDashboard();
    } catch {
      setProductError("A network error occurred. Please try again.");
    } finally {
      setProductSubmitting(false);
    }
  };

  const submitProductForReview = async (productId: string) => {
    setSubmissionErrors((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setSubmittingProductId(productId);

    try {
      const response = await fetch("/api/marketplace/supplier/products/submit", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setSubmissionErrors((current) => ({
          ...current,
          [productId]:
            typeof payload.error === "string"
              ? payload.error
              : "Unable to submit this product for review.",
        }));
        return;
      }

      setProductSuccess(
        typeof payload.message === "string"
          ? payload.message
          : "Product submitted for admin review.",
      );

      await loadDashboard();
    } catch {
      setSubmissionErrors((current) => ({
        ...current,
        [productId]: "A network error occurred. Please try again.",
      }));
    } finally {
      setSubmittingProductId(null);
    }
  };

  const manageProduct = async (
    productId: string,
    field: "is_available" | "is_listed",
    value: boolean,
  ) => {
    setManagementErrors((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setManagementMessages((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setManagingProductId(productId);

    try {
      const response = await fetch("/api/marketplace/supplier/products/manage", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, field, value }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.success !== true) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Unable to update this listing.",
        );
      }

      setData((current) =>
        current
          ? {
              ...current,
              products: current.products.map((item) =>
                item.id === productId
                  ? {
                      ...item,
                      is_available:
                        typeof payload.product?.is_available === "boolean"
                          ? payload.product.is_available
                          : field === "is_available"
                            ? value
                            : item.is_available,
                      is_listed:
                        typeof payload.product?.is_listed === "boolean"
                          ? payload.product.is_listed
                          : field === "is_listed"
                            ? value
                            : item.is_listed,
                    }
                  : item,
              ),
            }
          : current,
      );

      setManagementMessages((current) => ({
        ...current,
        [productId]:
          field === "is_available"
            ? value
              ? "Stock updated: available."
              : "Stock updated: out of stock."
            : value
              ? "Listing restored to the marketplace."
              : "Listing hidden from the marketplace.",
      }));
    } catch (err) {
      setManagementErrors((current) => ({
        ...current,
        [productId]:
          err instanceof Error
            ? err.message
            : "A network error occurred. Please try again.",
      }));
    } finally {
      setManagingProductId(null);
    }
  };

  const submitSupplierQuote = async (
    event: React.FormEvent<HTMLFormElement>,
    requestId: string,
  ) => {
    event.preventDefault();

    setQuoteErrors((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });
    setQuoteMessages((current) => {
      const next = { ...current };
      delete next[requestId];
      return next;
    });
    setQuoteSubmittingId(requestId);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      const response = await fetch("/api/marketplace/supplier/quotes", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          unitPrice: formData.get("unitPrice"),
          estimatedLeadTime: formData.get("estimatedLeadTime"),
          quoteValidUntil: formData.get("quoteValidUntil"),
          supplierMessage: formData.get("supplierMessage"),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setQuoteErrors((current) => ({
          ...current,
          [requestId]:
            typeof payload.error === "string"
              ? payload.error
              : "Unable to submit this quotation.",
        }));
        return;
      }

      setQuoteMessages((current) => ({
        ...current,
        [requestId]: "Quotation submitted successfully.",
      }));

      await loadDashboard();
    } catch {
      setQuoteErrors((current) => ({
        ...current,
        [requestId]:
          "A network error occurred. Refresh the dashboard before retrying.",
      }));
    } finally {
      setQuoteSubmittingId(null);
    }
  };

  const updateOrderFulfilment = async (
    orderId: string,
    status: string,
  ) => {
    setFulfilmentErrors((current) => ({ ...current, [orderId]: "" }));
    setFulfilmentMessages((current) => ({ ...current, [orderId]: "" }));
    setFulfilmentSubmittingId(orderId);

    try {
      const result = await fetch("/api/marketplace/supplier/orders/fulfilment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          status,
          note: fulfilmentNotes[orderId] ?? "",
        }),
      });

      const payload = await result.json();

      if (!result.ok) {
        setFulfilmentErrors((current) => ({
          ...current,
          [orderId]:
            typeof payload.error === "string"
              ? payload.error
              : "Unable to update fulfilment.",
        }));
        return;
      }

      setFulfilmentMessages((current) => ({
        ...current,
        [orderId]: "Fulfilment status updated.",
      }));
      setFulfilmentNotes((current) => ({ ...current, [orderId]: "" }));

      await loadDashboard();
    } catch {
      setFulfilmentErrors((current) => ({
        ...current,
        [orderId]: "A network error occurred. Please retry.",
      }));
    } finally {
      setFulfilmentSubmittingId(null);
    }
  };
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await fetch("/api/marketplace/supplier/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const payload = await result.json();

      if (!result.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "Unable to load your dashboard.",
        );
        setData(null);
        return;
      }

      setData(payload as DashboardData);
    } catch {
      setError("A network error occurred. Please try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const payoutVerificationStatus = data?.profile?.verification_status;
  const payoutStatus = data?.profile?.payout_status;

  useEffect(() => {
    if (
      payoutVerificationStatus !== "approved" ||
      payoutStatus === "active" ||
      payoutStatus === "pending"
    ) {
      return;
    }

    let cancelled = false;

    const loadPayoutBanks = async () => {
      setPayoutBanksLoading(true);
      setPayoutBankError("");

      try {
        const result = await fetch(
          "/api/marketplace/supplier/payout/banks",
          { method: "GET", cache: "no-store" },
        );
        const payload = await result.json();

        if (!result.ok) {
          throw new Error(
            typeof payload.error === "string"
              ? payload.error
              : "Unable to load supported banks.",
          );
        }

        if (!Array.isArray(payload.banks)) {
          throw new Error("The bank list response was invalid.");
        }

        if (!cancelled) {
          setPayoutBanks(payload.banks);
        }
      } catch (cause) {
        if (!cancelled) {
          setPayoutBankError(
            cause instanceof Error
              ? cause.message
              : "Unable to load supported banks.",
          );
        }
      } finally {
        if (!cancelled) {
          setPayoutBanksLoading(false);
        }
      }
    };

    void loadPayoutBanks();

    return () => {
      cancelled = true;
    };
  }, [payoutVerificationStatus, payoutStatus]);

  const handlePayoutSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPayoutError("");
    setPayoutSuccess("");

    if (!payoutBankCode || !/^\d{10}$/.test(payoutAccountNumber)) {
      setPayoutError("Select a bank and enter a valid 10-digit account number.");
      return;
    }

    setPayoutSubmitting(true);

    try {
      const result = await fetch("/api/marketplace/supplier/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankCode: payoutBankCode,
          accountNumber: payoutAccountNumber,
        }),
      });

      const payload = await result.json();

      if (!result.ok || payload.success !== true) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "Payout setup could not be confirmed.",
        );
      }

      setPayoutAccountNumber("");
      setPayoutSuccess(
        typeof payload.message === "string"
          ? payload.message
          : "Payout account configured successfully.",
      );

      await loadDashboard();
    } catch (cause) {
      setPayoutError(
        cause instanceof Error
          ? cause.message
          : "A network error occurred. Check the dashboard before retrying.",
      );
    } finally {
      setPayoutSubmitting(false);
    }
  };
  useEffect(() => {
    return () => {
      for (const preview of imagePreviews) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [imagePreviews]);

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Samiz Engineering Marketplace
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Supplier dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Manage your supplier account, review your product listings and
              monitor eligible requests for quotations.
            </p>
          </div>

          <Link
            href="/marketplace"
            className="border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-blue-600"
          >
            View marketplace
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-slate-600">Loading supplier dashboard...</p>
        ) : error ? (
          <section className="mt-8 border border-red-200 bg-white p-6">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-4 bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
            <p className="mt-4 text-sm text-slate-600">
              Need to sign in?{" "}
              <Link
                href="/marketplace/supplier/login"
                className="font-semibold text-blue-700 underline"
              >
                Supplier login
              </Link>
            </p>
          </section>
        ) : data ? (
          <>
            <section className="mt-8 border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">
                {data.profile?.business_name ?? "Supplier account"}
              </h2>

              {data.profile ? (
                <p className="mt-3 text-sm text-slate-600">
                  Verification status:{" "}
                  <span className="font-semibold capitalize text-slate-900">
                    {data.profile.verification_status}
                  </span>
                </p>
              ) : null}

              {data.message ? (
                <p className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {data.message}
                </p>
              ) : null}

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">Your products</p>
                  <p className="mt-1 text-2xl font-bold">
                    {data.products.length}
                  </p>
                </div>
                <div className="border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">
                    Available quote requests
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {data.requests.length}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-8 border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">Supplier payout account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Configure the Nigerian bank account where marketplace proceeds
                will be settled. Your account must be verified before payouts
                can be enabled.
              </p>

              {data.profile?.verification_status !== "approved" ? (
                <p className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Payout setup is available only to approved suppliers.
                </p>
              ) : data.profile.payout_status === "active" ? (
                <div className="mt-5 border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-900">
                    Payout account active
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-slate-700">
                    <div>
                      <dt className="inline font-medium">Bank: </dt>
                      <dd className="inline">
                        {data.profile.payout_bank_name ?? "Verified bank"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Account name: </dt>
                      <dd className="inline">
                        {data.profile.payout_account_name ?? "Verified account"}
                      </dd>
                    </div>
                    <div>
                      <dt className="inline font-medium">Account ending: </dt>
                      <dd className="inline">
                        ****{data.profile.payout_account_last4 ?? "****"}
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : data.profile.payout_status === "pending" ? (
                <p className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Payout setup is pending confirmation. Do not submit the
                  account again, because the payment provider may already have
                  created the subaccount. Contact Samiz support to check the
                  status before attempting any further setup.
                </p>
              ) : (
                <form onSubmit={handlePayoutSubmit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="payout-bank" className="mb-2 block text-sm font-medium">
                      Bank
                    </label>
                    <select
                      id="payout-bank"
                      value={payoutBankCode}
                      onChange={(event) => setPayoutBankCode(event.target.value)}
                      required
                      disabled={payoutBanksLoading || payoutSubmitting}
                      className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                    >
                      <option value="">
                        {payoutBanksLoading ? "Loading banks..." : "Select your bank"}
                      </option>
                      {payoutBanks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="payout-account-number" className="mb-2 block text-sm font-medium">
                      Account number
                    </label>
                    <input
                      id="payout-account-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={payoutAccountNumber}
                      onChange={(event) =>
                        setPayoutAccountNumber(
                          event.target.value.replace(/\D/g, "").slice(0, 10),
                        )
                      }
                      minLength={10}
                      maxLength={10}
                      pattern="\d{10}"
                      required
                      disabled={payoutSubmitting}
                      placeholder="Enter 10-digit account number"
                      className="w-full border border-slate-300 px-3 py-3 text-sm"
                    />
                  </div>

                  {payoutBankError ? (
                    <p role="alert" className="text-sm text-red-700">
                      {payoutBankError}
                    </p>
                  ) : null}

                  {payoutError ? (
                    <p role="alert" className="border-l-4 border-red-400 bg-red-50 p-3 text-sm leading-6 text-red-800">
                      {payoutError}
                    </p>
                  ) : null}

                  {payoutSuccess ? (
                    <p role="status" className="border-l-4 border-emerald-400 bg-emerald-50 p-3 text-sm leading-6 text-emerald-800">
                      {payoutSuccess}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={
                      payoutSubmitting ||
                      payoutBanksLoading ||
                      payoutBanks.length === 0
                    }
                    className="bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payoutSubmitting ? "Verifying account..." : "Verify and save payout account"}
                  </button>

                  <p className="text-xs leading-5 text-slate-500">
                    Your account number is sent to the server for verification.
                    Only masked account details are displayed after setup.
                  </p>
                </form>
              )}
            </section>

            <section className="mt-8 border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">Add a product listing</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create a product draft for review. Drafts are not publicly
                visible until the marketplace approval process is completed.
              </p>

              {data.profile?.verification_status !== "approved" ? (
                <p className="mt-4 border-l-4 border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Product submission is available to approved suppliers.
                  Your current verification status is{" "}
                  <strong>
                    {data.profile?.verification_status ?? "not registered"}
                  </strong>.
                </p>
              ) : (
                <form
                  onSubmit={submitProductListing}
                  className="mt-6 grid gap-5 sm:grid-cols-2"
                >
                  <div>
                    <label htmlFor="product-name" className="mb-1 block text-sm font-semibold">
                      Product name *
                    </label>
                    <input
                      id="product-name"
                      required
                      minLength={3}
                      maxLength={180}
                      value={productName}
                      onChange={(event) => setProductName(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                      placeholder="e.g. 5kVA Hybrid Inverter"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-category" className="mb-1 block text-sm font-semibold">
                      Category *
                    </label>
                    <select
                      id="product-category"
                      required
                      value={productCategory}
                      onChange={(event) => setProductCategory(event.target.value)}
                      className="w-full border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="solar_backup_power">Solar and backup power</option>
                      <option value="electrical_materials">Electrical materials</option>
                      <option value="industrial_distribution">Industrial distribution</option>
                      <option value="smart_energy_automation">Smart energy automation</option>
                      <option value="tools_accessories">Tools and accessories</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="product-brand" className="mb-1 block text-sm font-semibold">
                      Brand
                    </label>
                    <input
                      id="product-brand"
                      maxLength={120}
                      value={productBrand}
                      onChange={(event) => setProductBrand(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                      placeholder="Manufacturer or brand"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-model" className="mb-1 block text-sm font-semibold">
                      Model number
                    </label>
                    <input
                      id="product-model"
                      maxLength={120}
                      value={productModel}
                      onChange={(event) => setProductModel(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                      placeholder="Model or part number"
                    />
                  </div>

                  <div>
                    <label htmlFor="product-price-type" className="mb-1 block text-sm font-semibold">
                      Pricing method *
                    </label>
                    <select
                      id="product-price-type"
                      required
                      value={productPriceType}
                      onChange={(event) => setProductPriceType(event.target.value)}
                      className="w-full border border-slate-300 bg-white px-3 py-2"
                    >
                      <option value="quote_only">Request a quotation</option>
                      <option value="indicative">Show indicative price (NGN)</option>
                    </select>
                  </div>

                  {productPriceType === "indicative" ? (
                    <div>
                      <label htmlFor="product-price" className="mb-1 block text-sm font-semibold">
                        Indicative price in NGN *
                      </label>
                      <input
                        id="product-price"
                        required
                        type="number"
                        min="0"
                        max="999999999999"
                        step="0.01"
                        value={productPrice}
                        onChange={(event) => setProductPrice(event.target.value)}
                        className="w-full border border-slate-300 px-3 py-2"
                        placeholder="0.00"
                      />
                    </div>
                  ) : null}

                  <div className="sm:col-span-2">
                    <label htmlFor="product-description" className="mb-1 block text-sm font-semibold">
                      Product description *
                    </label>
                    <textarea
                      id="product-description"
                      required
                      minLength={10}
                      maxLength={8000}
                      rows={5}
                      value={productDescription}
                      onChange={(event) => setProductDescription(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2"
                      placeholder="Describe the specifications, features, condition and intended use."
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="product-images" className="mb-1 block text-sm font-semibold">
                      Product images (optional, up to 5)
                    </label>
                    <p className="mb-2 text-sm text-slate-600">
                      JPEG, PNG or WebP. Maximum 5 MB per image.
                    </p>
                    <input
                      id="product-images"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={productSubmitting}
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? []);
                        if (files.length > 5) {
                          setProductError("Choose no more than 5 images.");
                          event.target.value = "";
                          return;
                        }
                        const invalid = files.find(
                          (file) =>
                            !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
                            file.size > 5 * 1024 * 1024,
                        );
                        if (invalid) {
                          setProductError(
                            invalid.size > 5 * 1024 * 1024
                              ? "Each image must be 5 MB or smaller."
                              : "Images must be JPEG, PNG, or WebP.",
                          );
                          event.target.value = "";
                          return;
                        }
                        setProductError("");
                        setProductImages(files);
                      }}
                      className="block w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
                    />

                    {imagePreviews.length ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                        {imagePreviews.map((preview, index) => (
                          <div key={preview.url} className="border border-slate-200 p-2">
                            <img
                              src={preview.url}
                              alt={preview.file.name}
                              className="h-28 w-full object-contain"
                            />
                            <p className="mt-2 break-all text-xs text-slate-600">
                              {preview.file.name}
                            </p>
                            <button
                              type="button"
                              disabled={productSubmitting}
                              onClick={() =>
                                setProductImages((current) =>
                                  current.filter((_, itemIndex) => itemIndex !== index),
                                )
                              }
                              className="mt-2 text-xs font-semibold text-red-700 underline"
                            >
                              Remove image
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  {productError ? (
                    <p role="alert" className="sm:col-span-2 text-sm font-semibold text-red-700">
                      {productError}
                    </p>
                  ) : null}

                  {productSuccess ? (
                    <p role="status" className="sm:col-span-2 text-sm font-semibold text-green-700">
                      {productSuccess}
                    </p>
                  ) : null}

                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={productSubmitting}
                      className="bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {productSubmitting ? "Saving product..." : "Save product draft"}
                    </button>
                  </div>
                </form>
              )}
            </section>
            <section className="mt-8">
              <h2 className="text-xl font-bold">Your product listings</h2>
              {data.products.length ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.products.map((product) => (
                    <article
                      key={product.id}
                      className="border border-slate-200 bg-white p-5"
                    >
                      {product.image_urls?.length ? (
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          {product.image_urls.map((url, index) => (
                            <img
                              key={url}
                              src={url}
                              alt={`${product.name} image ${index + 1}`}
                              loading="lazy"
                              className="h-28 w-full border border-slate-100 object-contain"
                            />
                          ))}
                        </div>
                      ) : null}
                      <h3 className="font-bold">{product.name}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {product.category}
                      </p>
                      <p className="mt-3 text-sm">
                        Status:{" "}
                        <span className="font-semibold capitalize">
                          {product.product_status}
                        </span>
                      </p>
                      {product.indicative_price !== null ? (
                        <p className="mt-2 text-sm">
                          Indicative price: {product.currency}{" "}
                          {Number(product.indicative_price).toLocaleString()}
                        </p>
                      ) : null}
                      {data.profile?.verification_status === "approved" &&
                      product.product_status === "approved" ? (
                        <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                          <p className="text-sm">
                            Stock:{" "}
                            <span className={product.is_available ? "font-semibold text-green-700" : "font-semibold text-red-700"}>
                              {product.is_available ? "Available" : "Out of stock"}
                            </span>
                          </p>
                          <button
                            type="button"
                            disabled={managingProductId === product.id}
                            onClick={() =>
                              void manageProduct(product.id, "is_available", !product.is_available)
                            }
                            className="w-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {managingProductId === product.id
                              ? "Updating..."
                              : product.is_available
                                ? "Mark out of stock"
                                : "Mark available"}
                          </button>

                          <p className="text-sm">
                            Marketplace visibility:{" "}
                            <span className={product.is_listed ? "font-semibold text-green-700" : "font-semibold text-amber-700"}>
                              {product.is_listed ? "Visible" : "Hidden"}
                            </span>
                          </p>
                          <button
                            type="button"
                            disabled={managingProductId === product.id}
                            onClick={() =>
                              void manageProduct(product.id, "is_listed", !product.is_listed)
                            }
                            className="w-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {managingProductId === product.id
                              ? "Updating..."
                              : product.is_listed
                                ? "Hide listing"
                                : "Restore listing"}
                          </button>

                          {managementErrors[product.id] ? (
                            <p className="text-sm text-red-700" role="alert">
                              {managementErrors[product.id]}
                            </p>
                          ) : null}
                          {managementMessages[product.id] ? (
                            <p className="text-sm text-green-700" role="status">
                              {managementMessages[product.id]}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {product.product_status === "draft" ? (
                        <div className="mt-4">
                          <button
                            type="button"
                            disabled={submittingProductId === product.id}
                            onClick={() => void submitProductForReview(product.id)}
                            className="bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {submittingProductId === product.id
                              ? "Submitting..."
                              : "Submit for review"}
                          </button>
                          {submissionErrors[product.id] ? (
                            <p className="mt-2 text-sm text-red-700" role="alert">
                              {submissionErrors[product.id]}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  You have no product listings yet. Use the form above to add your first product draft.
                </p>
              )}
            </section>

            <section className="mt-10">
              <h2 className="text-xl font-bold">Marketplace orders</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Orders for your products, including payment status and the
                calculated supplier share. The supplier share shown here is
                not confirmation that funds have been settled to your bank.
              </p>

              {data.orders.length ? (
                <div className="mt-4 space-y-4">
                  {data.orders.map((order) => {
                    const formatMoney = (amountKobo: number) =>
                      new Intl.NumberFormat("en-NG", {
                        style: "currency",
                        currency: order.currency || "NGN",
                      }).format(amountKobo / 100);

                    return (
                      <article
                        key={order.id}
                        className="border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{order.product_name}</h3>
                            <p className="mt-1 text-xs text-slate-500">
                              Order ID: {order.id}
                            </p>
                          </div>
                          <span className="inline-flex border border-slate-200 px-3 py-1 text-sm capitalize text-slate-700">
                            Payment: {order.payment_status}
                          </span>
                        </div>

                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-slate-500">Quantity</dt>
                            <dd className="mt-1 font-medium">{order.quantity}</dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Unit price</dt>
                            <dd className="mt-1 font-medium">
                              {formatMoney(order.unit_price_kobo)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Order subtotal</dt>
                            <dd className="mt-1 font-medium">
                              {formatMoney(order.subtotal_kobo)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Marketplace commission</dt>
                            <dd className="mt-1 font-medium">
                              {formatMoney(order.commission_kobo)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Calculated supplier share</dt>
                            <dd className="mt-1 font-semibold">
                              {formatMoney(order.supplier_amount_kobo)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-slate-500">Order received</dt>
                            <dd className="mt-1">
                              {new Date(order.created_at).toLocaleString()}
                            </dd>
                          </div>
                          {order.paid_at ? (
                            <div>
                              <dt className="text-slate-500">Payment confirmed</dt>
                              <dd className="mt-1">
                                {new Date(order.paid_at).toLocaleString()}
                              </dd>
                            </div>
                          ) : null}
                        </dl>

                        <div className="mt-5 border-t border-slate-200 pt-4">
                          <h4 className="font-semibold">Order fulfilment</h4>
                          <p className="mt-1 text-sm text-slate-600">
                            Current status:{" "}
                            <span className="font-medium capitalize">
                              {(order.fulfilment_status || "not_started").replaceAll("_", " ")}
                            </span>
                          </p>

                          {order.payment_status === "paid" ? (
                            <>
                              <label
                                htmlFor={`fulfilment-note-${order.id}`}
                                className="mt-3 block text-sm font-medium text-slate-700"
                              >
                                Update note (required when reporting or resolving an issue)
                              </label>
                              <textarea
                                id={`fulfilment-note-${order.id}`}
                                value={fulfilmentNotes[order.id] ?? ""}
                                onChange={(event) =>
                                  setFulfilmentNotes((current) => ({
                                    ...current,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                maxLength={1000}
                                rows={2}
                                className="mt-1 w-full border border-slate-300 p-2 text-sm"
                                placeholder="Add dispatch details, delivery information, or an issue note"
                                disabled={fulfilmentSubmittingId === order.id}
                              />

                              <div className="mt-3 flex flex-wrap gap-2">
                                {order.fulfilment_status === "not_started" ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => void updateOrderFulfilment(order.id, "processing")}
                                    className="border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    Start processing
                                  </button>
                                ) : null}

                                {order.fulfilment_status === "processing" ||
                                order.fulfilment_status === "issue_reported" ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => void updateOrderFulfilment(order.id, "ready_to_dispatch")}
                                    className="border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    Ready to dispatch
                                  </button>
                                ) : null}

                                {order.fulfilment_status === "ready_to_dispatch" ||
                                order.fulfilment_status === "issue_reported" ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => void updateOrderFulfilment(order.id, "dispatched")}
                                    className="border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    Mark dispatched
                                  </button>
                                ) : null}

                                {order.fulfilment_status === "dispatched" ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => void updateOrderFulfilment(order.id, "delivered")}
                                    className="border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    Mark delivered
                                  </button>
                                ) : null}

                                {["processing", "ready_to_dispatch", "dispatched"].includes(
                                  order.fulfilment_status,
                                ) ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => {
                                      if (!(fulfilmentNotes[order.id] ?? "").trim()) {
                                        setFulfilmentErrors((current) => ({
                                          ...current,
                                          [order.id]: "Enter a note before reporting an issue.",
                                        }));
                                        return;
                                      }
                                      void updateOrderFulfilment(order.id, "issue_reported");
                                    }}
                                    className="border border-red-300 px-3 py-2 text-sm font-medium text-red-700 disabled:opacity-50"
                                  >
                                    Report issue
                                  </button>
                                ) : null}

                                {order.fulfilment_status === "issue_reported" ? (
                                  <button
                                    type="button"
                                    disabled={fulfilmentSubmittingId === order.id}
                                    onClick={() => {
                                      if (!(fulfilmentNotes[order.id] ?? "").trim()) {
                                        setFulfilmentErrors((current) => ({
                                          ...current,
                                          [order.id]: "Enter a note explaining how the issue is being resolved.",
                                        }));
                                        return;
                                      }
                                      void updateOrderFulfilment(order.id, "processing");
                                    }}
                                    className="border border-slate-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                  >
                                    Resume processing
                                  </button>
                                ) : null}
                              </div>

                              {fulfilmentSubmittingId === order.id ? (
                                <p className="mt-2 text-sm text-slate-600" role="status">
                                  Saving fulfilment update…
                                </p>
                              ) : null}
                              {fulfilmentErrors[order.id] ? (
                                <p className="mt-2 text-sm text-red-700" role="alert">
                                  {fulfilmentErrors[order.id]}
                                </p>
                              ) : null}
                              {fulfilmentMessages[order.id] ? (
                                <p className="mt-2 text-sm text-green-700" role="status">
                                  {fulfilmentMessages[order.id]}
                                </p>
                              ) : null}
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-slate-600">
                              Fulfilment updates become available after payment is confirmed.
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  No marketplace orders have been recorded for your products yet.
                </p>
              )}
            </section>
            <section className="mt-10">
              <h2 className="text-xl font-bold">Quote requests</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Customer names, email addresses and phone numbers are not
                exposed in this supplier view.
              </p>

              {data.requests.length ? (
                <div className="mt-4 space-y-4">
                  {data.requests.map((request) => {
                    const product = data.products.find(
                      (item) => item.id === request.product_id,
                    );

                    return (
                      <article
                        key={request.id}
                        className="border border-slate-200 bg-white p-5"
                      >
                        <div className="flex flex-wrap justify-between gap-3">
                          <h3 className="font-bold">
                            {product?.name ?? "Product enquiry"}
                          </h3>
                          <span className="text-sm capitalize text-slate-600">
                            {request.request_status}
                          </span>
                        </div>
                        {request.organization_name ? (
                          <p className="mt-3 text-sm text-slate-700">
                            Organisation: {request.organization_name}
                          </p>
                        ) : null}
                        {request.quantity !== null ? (
                          <p className="mt-2 text-sm text-slate-700">
                            Quantity: {request.quantity}{" "}
                            {request.quantity_unit ?? ""}
                          </p>
                        ) : null}
                        {request.delivery_location ? (
                          <p className="mt-2 text-sm text-slate-700">
                            Delivery location: {request.delivery_location}
                          </p>
                        ) : null}
                        {request.customer_message ? (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {request.customer_message}
                          </p>
                        ) : null}
                        <p className="mt-3 text-xs text-slate-500">
                          Received{" "}
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>

                        {product?.price_type === "quote_only" &&
                        data.profile?.verification_status === "approved" &&
                        ["new", "viewed"].includes(request.request_status) ? (
                          <form
                            className="mt-5 space-y-4 border-t border-slate-200 pt-5"
                            onSubmit={(event) =>
                              void submitSupplierQuote(event, request.id)
                            }
                          >
                            <h4 className="font-semibold">Submit quotation</h4>
                            <p className="text-sm leading-6 text-slate-600">
                              Enter the price per unit in NGN. The marketplace
                              will calculate the total using the requested quantity.
                            </p>

                            <div>
                              <label
                                htmlFor={`quote-unit-price-${request.id}`}
                                className="mb-1 block text-sm font-medium"
                              >
                                Unit price (NGN)
                              </label>
                              <input
                                id={`quote-unit-price-${request.id}`}
                                name="unitPrice"
                                type="number"
                                min="0.01"
                                max="999999999999"
                                step="0.01"
                                required
                                className="w-full border border-slate-300 px-3 py-2 text-sm"
                                placeholder="e.g. 189000"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`quote-lead-${request.id}`}
                                className="mb-1 block text-sm font-medium"
                              >
                                Estimated lead time
                              </label>
                              <input
                                id={`quote-lead-${request.id}`}
                                name="estimatedLeadTime"
                                type="text"
                                maxLength={200}
                                className="w-full border border-slate-300 px-3 py-2 text-sm"
                                placeholder="e.g. 7–10 working days"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`quote-expiry-${request.id}`}
                                className="mb-1 block text-sm font-medium"
                              >
                                Quotation valid until (optional)
                              </label>
                              <input
                                id={`quote-expiry-${request.id}`}
                                name="quoteValidUntil"
                                type="date"
                                min={new Date().toISOString().slice(0, 10)}
                                className="w-full border border-slate-300 px-3 py-2 text-sm"
                              />
                            </div>

                            <div>
                              <label
                                htmlFor={`quote-message-${request.id}`}
                                className="mb-1 block text-sm font-medium"
                              >
                                Quotation details and terms
                              </label>
                              <textarea
                                id={`quote-message-${request.id}`}
                                name="supplierMessage"
                                required
                                minLength={1}
                                maxLength={5000}
                                rows={4}
                                className="w-full border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Describe what is included, delivery terms, warranty, and any exclusions."
                              />
                            </div>

                            {quoteErrors[request.id] ? (
                              <p className="text-sm text-red-700" role="alert">
                                {quoteErrors[request.id]}
                              </p>
                            ) : null}

                            {quoteMessages[request.id] ? (
                              <p className="text-sm text-green-700" role="status">
                                {quoteMessages[request.id]}
                              </p>
                            ) : null}

                            <button
                              type="submit"
                              disabled={quoteSubmittingId === request.id}
                              className="bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {quoteSubmittingId === request.id
                                ? "Submitting quotation..."
                                : "Submit quotation"}
                            </button>
                          </form>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-3 border border-slate-200 bg-white p-5 text-sm text-slate-600">
                  No eligible quote requests are available for your products.
                </p>
              )}
            </section>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-8 border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:border-blue-600"
            >
              Refresh dashboard
            </button>
          </>
        ) : null}
      </div>
    </main>
  );
}

