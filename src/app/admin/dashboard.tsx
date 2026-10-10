"use client";

import { useCallback, useEffect, useState } from "react";

type EngineeringOrder = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  service_type: string;
  property_type: string | null;
  property_location: string | null;
  assessment_details: unknown;
  amount_kobo: number;
  currency: string;
  payment_reference: string;
  payment_status: string;
  order_status: string;
  created_at: string;
  paid_at: string | null;
  updated_at: string;
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  in_progress: "In progress",
  delivered: "Delivered",
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function formatAmount(amountKobo: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amountKobo / 100);
}

function statusClass(status: string) {
  if (status === "delivered") {
    return "bg-green-100 text-green-800";
  }

  if (status === "in_progress") {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-amber-100 text-amber-800";
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<EngineeringOrder[]>([]);
  const [selectedOrder, setSelectedOrder] =
    useState<EngineeringOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load engineering orders.");
      }

      const nextOrders = Array.isArray(data.orders)
        ? (data.orders as EngineeringOrder[])
        : [];

      setOrders(nextOrders);

      setSelectedOrder((current) =>
        current
          ? nextOrders.find((order) => order.id === current.id) ?? null
          : null,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load engineering orders.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  async function updateStatus(
    order: EngineeringOrder,
    nextStatus: "in_progress" | "delivered",
  ) {
    setUpdatingId(order.id);
    setActionError("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.id)}/status`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update order status.");
      }

      await loadOrders(true);
    } catch (err) {
      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to update order status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function signOut() {
    setActionError("");

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to sign out.");
      }

      window.location.replace("/admin/login");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Unable to sign out.",
      );
    }
  }

  const queuedCount = orders.filter(
    (order) => order.order_status === "queued",
  ).length;

  const inProgressCount = orders.filter(
    (order) => order.order_status === "in_progress",
  ).length;

  const deliveredCount = orders.filter(
    (order) => order.order_status === "delivered",
  ).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-slate-950 px-5 py-10 text-white">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Samiz Tech Engineering Ltd
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Engineering assessment orders
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            Review paid remote energy assessments and update their delivery
            status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadOrders(true)}
            disabled={refreshing || loading}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
            Queued
          </p>
          <p className="mt-2 text-3xl font-bold text-amber-900">
            {queuedCount}
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
            In progress
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-900">
            {inProgressCount}
          </p>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-green-700">
            Delivered
          </p>
          <p className="mt-2 text-3xl font-bold text-green-900">
            {deliveredCount}
          </p>
        </div>
      </section>

      {actionError && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700"
        >
          {actionError}
        </p>
      )}

      {loading ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-600">
          Loading engineering orders...
        </div>
      ) : error ? (
        <div className="mt-12 rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-12 rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-800">
            No engineering orders yet
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Paid remote assessments will appear here once they are submitted.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <li
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-slate-900">
                      {order.customer_name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {order.customer_email}
                      {order.customer_phone
                        ? ` · ${order.customer_phone}`
                        : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusClass(
                        order.order_status,
                      )}`}
                    >
                      {statusLabels[order.order_status] ??
                        order.order_status}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-700">
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Amount
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-900">
                      {formatAmount(order.amount_kobo, order.currency)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Paid at
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {formatDate(order.paid_at)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Property
                    </dt>
                    <dd className="mt-1 text-slate-800">
                      {order.property_type ?? "—"}
                      {order.property_location
                        ? ` · ${order.property_location}`
                        : ""}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Reference
                    </dt>
                    <dd className="mt-1 truncate font-mono text-xs text-slate-700">
                      {order.payment_reference}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:border-blue-500"
                  >
                    View details
                  </button>

                  {order.order_status === "queued" && (
                    <button
                      type="button"
                      onClick={() => void updateStatus(order, "in_progress")}
                      disabled={isUpdating}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "Mark in progress"}
                    </button>
                  )}

                  {order.order_status === "in_progress" && (
                    <button
                      type="button"
                      onClick={() => void updateStatus(order, "delivered")}
                      disabled={isUpdating}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isUpdating ? "Updating..." : "Mark delivered"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Order details
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedOrder.customer_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400"
              >
                Close
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Order ID
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                    {selectedOrder.id}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Payment reference
                  </dt>
                  <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                    {selectedOrder.payment_reference}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email
                  </dt>
                  <dd className="mt-1 break-all text-sm text-slate-800">
                    {selectedOrder.customer_email}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {selectedOrder.customer_phone ?? "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Created
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {formatDate(selectedOrder.created_at)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paid
                  </dt>
                  <dd className="mt-1 text-sm text-slate-800">
                    {formatDate(selectedOrder.paid_at)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assessment details
                </p>
                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-slate-50 p-4 text-xs text-slate-800">
                  {JSON.stringify(
                    selectedOrder.assessment_details ?? {},
                    null,
                    2,
                  )}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}