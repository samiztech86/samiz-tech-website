"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Supplier = {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  business_address: string | null;
  website_url: string | null;
  verification_status: string;
  admin_review_note: string | null;
  created_at: string;
  updated_at: string;
};

type Product = {
  id: string;
  supplier_id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  brand: string | null;
  model_number: string | null;
  image_urls: string[];
  price_type: string;
  indicative_price: number | string | null;
  currency: string;
  product_status: string;
  admin_review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type QueueResponse = {
  suppliers?: Supplier[];
  products?: Product[];
  error?: string;
};

type QueueTab = "suppliers" | "products";

const supplierStatuses = [
  "all",
  "pending",
  "approved",
  "rejected",
  "suspended",
];

const productStatuses = [
  "all",
  "draft",
  "submitted",
  "approved",
  "rejected",
  "archived",
];

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default function MarketplaceDashboard() {
  const [tab, setTab] = useState<QueueTab>("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("pending");
  const [productFilter, setProductFilter] = useState("draft");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderationMessage, setModerationMessage] = useState("");

  const loadQueues = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/marketplace", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const data = (await response.json()) as QueueResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to load marketplace queues.");
      }

      setSuppliers(data.suppliers ?? []);
      setProducts(data.products ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load marketplace queues.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadQueues();
  }, [loadQueues]);

  async function moderate(
    entity: "supplier" | "product",
    id: string,
    action: "approve" | "reject",
    name: string,
  ) {
    let note = "";

    if (action === "approve") {
      if (!window.confirm(`Approve "${name}"?`)) return;
    } else {
      const reason = window.prompt(
        `Enter the rejection reason for "${name}" (required, max 1000 characters):`,
      );

      if (reason === null) return;

      note = reason.trim();

      if (!note || note.length > 1000) {
        setModerationMessage(
          "Rejection cancelled: enter a reason of 1–1000 characters.",
        );
        return;
      }

      if (!window.confirm(`Reject "${name}" with the reason provided?`)) {
        return;
      }
    }

    setModeratingId(`${entity}:${id}`);
    setModerationMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/marketplace/moderate", {
        method: "POST",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entity, id, action, note }),
      });

      const result = (await response.json()) as {
        error?: string;
        success?: boolean;
      };

      if (!response.ok) {
        throw new Error(result.error || "Moderation request failed.");
      }

      setModerationMessage(
        `${entity === "supplier" ? "Supplier" : "Product"} "${name}" ${action === "approve" ? "approved" : "rejected"} successfully.`,
      );

      await loadQueues(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete the moderation decision.",
      );
    } finally {
      setModeratingId(null);
    }
  }

  const filteredSuppliers = useMemo(
    () =>
      suppliers.filter(
        (supplier) =>
          supplierFilter === "all" ||
          supplier.verification_status === supplierFilter,
      ),
    [suppliers, supplierFilter],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          productFilter === "all" ||
          product.product_status === productFilter,
      ),
    [products, productFilter],
  );

  const supplierDetail = suppliers.find(
    (supplier) => supplier.id === selectedSupplier,
  );

  const productDetail = products.find(
    (product) => product.id === selectedProduct,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-slate-950 px-5 py-10 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
            Samiz Tech Engineering Ltd
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Marketplace moderation
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Review supplier registrations and product listings separately.
            Approve eligible submissions or reject them with a recorded reason.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/admin"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-blue-400"
          >
            Engineering orders
          </a>
          <button
            type="button"
            onClick={() => void loadQueues(true)}
            disabled={loading || refreshing}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh queues"}
          </button>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-300">Pending suppliers</p>
          <p className="mt-2 text-3xl font-bold">
            {suppliers.filter((item) => item.verification_status === "pending").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-300">Draft products</p>
          <p className="mt-2 text-3xl font-bold">
            {products.filter((item) => item.product_status === "draft").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <p className="text-sm text-slate-300">Submitted products</p>
          <p className="mt-2 text-3xl font-bold">
            {products.filter((item) => item.product_status === "submitted").length}
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3 border-b border-slate-700 pb-4">
        <button
          type="button"
          onClick={() => setTab("suppliers")}
          aria-pressed={tab === "suppliers"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "suppliers"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Supplier applications ({suppliers.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          aria-pressed={tab === "products"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "products"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Product listings ({products.length})
        </button>
      </div>

      {moderationMessage && (
        <div
          role="status"
          className="mt-6 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200"
        >
          {moderationMessage}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-12 text-slate-300">Loading marketplace queues...</p>
      ) : tab === "suppliers" ? (
        <section className="mt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Supplier applications</h2>
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              aria-label="Filter suppliers by verification status"
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            >
              {supplierStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : humanize(status)}
                </option>
              ))}
            </select>
          </div>

          {filteredSuppliers.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No suppliers match this filter.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredSuppliers.map((supplier) => (
                <article
                  key={supplier.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{supplier.business_name}</h3>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-200">
                      {humanize(supplier.verification_status)}
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-400">Contact</dt>
                      <dd className="mt-1">{supplier.contact_name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Phone</dt>
                      <dd className="mt-1 break-words">{supplier.contact_phone}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Email</dt>
                      <dd className="mt-1 break-words">{supplier.contact_email}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Registered</dt>
                      <dd className="mt-1">{formatDate(supplier.created_at)}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSupplier(supplier.id)}
                      className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-slate-800"
                    >
                      View full application
                    </button>
                    {supplier.verification_status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={moderatingId !== null}
                          onClick={() =>
                            void moderate("supplier", supplier.id, "approve", supplier.business_name)
                          }
                          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                        >
                          {moderatingId === `supplier:${supplier.id}` ? "Processing..." : "Approve supplier"}
                        </button>
                        <button
                          type="button"
                          disabled={moderatingId !== null}
                          onClick={() =>
                            void moderate("supplier", supplier.id, "reject", supplier.business_name)
                          }
                          className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject supplier
                        </button>
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Product listings</h2>
            <select
              value={productFilter}
              onChange={(event) => setProductFilter(event.target.value)}
              aria-label="Filter products by moderation status"
              className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm"
            >
              {productStatuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All statuses" : humanize(status)}
                </option>
              ))}
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No products match this filter.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredProducts.map((product) => {
                const supplier = suppliers.find(
                  (item) => item.id === product.supplier_id,
                );

                return (
                  <article
                    key={product.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">{product.name}</h3>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-200">
                        {humanize(product.product_status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">
                      Supplier: {supplier?.business_name ?? "Supplier record unavailable"}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-slate-300">
                      {product.description}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-400">Category</dt>
                        <dd className="mt-1">{humanize(product.category)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Price type</dt>
                        <dd className="mt-1">{humanize(product.price_type)}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Indicative price</dt>
                        <dd className="mt-1">
                          {product.indicative_price == null
                            ? "Quote required"
                            : `${product.currency} ${Number(product.indicative_price).toLocaleString("en-NG")}`}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Submitted</dt>
                        <dd className="mt-1">{formatDate(product.created_at)}</dd>
                      </div>
                    </dl>
                    {product.admin_review_note && (
                      <p className="mt-3 text-sm text-amber-200">
                        Previous review note: {product.admin_review_note}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProduct(product.id)}
                        className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-slate-800"
                      >
                        View full listing
                      </button>
                      {product.product_status === "submitted" && (
                        <>
                          <button
                            type="button"
                            disabled={moderatingId !== null}
                            onClick={() =>
                              void moderate("product", product.id, "approve", product.name)
                            }
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {moderatingId === `product:${product.id}` ? "Processing..." : "Approve product"}
                          </button>
                          <button
                            type="button"
                            disabled={moderatingId !== null}
                            onClick={() =>
                              void moderate("product", product.id, "reject", product.name)
                            }
                            className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject product
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {supplierDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedSupplier(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-detail-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="supplier-detail-title" className="text-xl font-bold">
                {supplierDetail.business_name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedSupplier(null)}
                className="rounded-lg border border-slate-600 px-3 py-1"
              >
                Close
              </button>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["Contact name", supplierDetail.contact_name],
                ["Email", supplierDetail.contact_email],
                ["Phone", supplierDetail.contact_phone],
                ["Status", supplierDetail.verification_status],
                ["Review note", supplierDetail.admin_review_note || "None"],
                ["Address", supplierDetail.business_address || "Not provided"],
                ["Website", supplierDetail.website_url || "Not provided"],
                ["Registered", formatDate(supplierDetail.created_at)],
                ["Last updated", formatDate(supplierDetail.updated_at)],
                ["Supplier ID", supplierDetail.id],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-amber-200">
              Use the application card to approve or reject a pending supplier.
            </p>
          </section>
        </div>
      )}

      {productDetail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-detail-title"
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="product-detail-title" className="text-xl font-bold">
                {productDetail.name}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="rounded-lg border border-slate-600 px-3 py-1"
              >
                Close
              </button>
            </div>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              {[
                ["Status", productDetail.product_status],
                ["Supplier", suppliers.find((item) => item.id === productDetail.supplier_id)?.business_name ?? productDetail.supplier_id],
                ["Category", humanize(productDetail.category)],
                ["Brand", productDetail.brand || "Not provided"],
                ["Model number", productDetail.model_number || "Not provided"],
                ["Slug", productDetail.slug],
                ["Price type", humanize(productDetail.price_type)],
                ["Indicative price", productDetail.indicative_price == null ? "Quote required" : `${productDetail.currency} ${Number(productDetail.indicative_price).toLocaleString("en-NG")}`],
                ["Image count", String(productDetail.image_urls.length)],
                ["Reviewed at", productDetail.reviewed_at ? formatDate(productDetail.reviewed_at) : "Not reviewed"],
                ["Review note", productDetail.admin_review_note || "None"],
                ["Product ID", productDetail.id],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="mt-1 break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <h3 className="font-semibold">Description</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                {productDetail.description}
              </p>
            </div>
            {productDetail.image_urls.length > 0 && (
              <div className="mt-5">
                <h3 className="font-semibold">Image URLs</h3>
                <ul className="mt-2 space-y-2 text-sm">
                  {productDetail.image_urls.map((url) => (
                    <li key={url} className="break-all text-blue-200">
                      {url}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-6 text-sm text-amber-200">
              Use the listing card to approve or reject a submitted product.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}

