"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SupplierCommunicationsPanel from "./supplier-communications-panel";

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

type MarketplaceOrder = {
  id: string;
  product_id: string;
  supplier_id: string;
  product_name: string;
  quantity: number | string;
  subtotal_kobo: number | string;
  commission_kobo: number | string;
  supplier_amount_kobo: number | string;
  currency: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  payment_status: string;
  paystack_reference: string;
  paystack_transaction_id: number | null;
  paid_at: string | null;
  created_at: string;
  fulfilment_status: string;
  fulfilment_updated_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  settlement_status: string;
  settlement_reference: string | null;
  settlement_evidence_note: string | null;
  settlement_verified_at: string | null;
  settlement_verified_by: string | null;
};

type MarketplaceAuditEvent = {
  id: string;
  order_id: string;
  event_type: string;
  previous_status: string | null;
  new_status: string;
  actor_role: string;
  note: string | null;
  evidence_reference: string | null;
  created_at: string;
};

type QueueResponse = {
  suppliers?: Supplier[];
  products?: Product[];
  orders?: MarketplaceOrder[];
  auditEvents?: MarketplaceAuditEvent[];
  error?: string;
};

type AdminNotification = {
  id: string;
  event_type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
};

type AdminNotificationsResponse = {
  notifications?: AdminNotification[];
  unreadCount?: number;
  error?: string;
};
type QueueTab = "suppliers" | "products" | "orders" | "advertising" | "communications" | "agreements";

type SupplierAgreementRecord = {
  id: string;
  supplier_id: string;
  agreement_version: string;
  agreement_sha256: string;
  signatory_name: string;
  acceptance_method: string;
  acceptance_statement: string;
  accepted_at: string;
  supplier: {
    id: string;
    business_name: string;
    contact_name: string;
    contact_email: string;
  } | null;
};

type SupplierAgreementResponse = {
  records?: SupplierAgreementRecord[];
  error?: string;
};

type AdvertisingCampaign = {
  id: string;
  supplier_id: string;
  package_id: string;
  package_name: string;
  amount_kobo: number | string;
  currency: string;
  placement: string;
  headline: string;
  description: string | null;
  image_url: string;
  target_url: string;
  payment_status: string;
  campaign_status: string;
  paystack_reference: string;
  paid_at: string | null;
  starts_at: string | null;
  ends_at: string | null;
  admin_review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  supplier: { business_name: string | null } | null;
};

type AdvertisingQueueResponse = {
  success?: boolean;
  campaigns?: AdvertisingCampaign[];
  error?: string;
  message?: string;
};

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

function formatNairaFromKobo(value: number | string) {
  const amount = Number(value) / 100;

  if (!Number.isFinite(amount)) return "Amount unavailable";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

export default function MarketplaceDashboard() {
  const [tab, setTab] = useState<QueueTab>("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [agreementRecords, setAgreementRecords] = useState<SupplierAgreementRecord[]>([]);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementError, setAgreementError] = useState("");
  const [auditEvents, setAuditEvents] = useState<MarketplaceAuditEvent[]>([]);
  const [supplierFilter, setSupplierFilter] = useState("pending");
  const [productFilter, setProductFilter] = useState("draft");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [adCampaigns, setAdCampaigns] = useState<AdvertisingCampaign[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [adError, setAdError] = useState("");
  const [adMessage, setAdMessage] = useState("");
  const [reviewingCampaignId, setReviewingCampaignId] = useState<string | null>(null);

  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);
  const notificationAudioContext = useRef<AudioContext | null>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const hasNotificationBaseline = useRef(false);

  function playAdminNotificationTone(context: AudioContext) {
    if (context.state !== "running") return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1174.66, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.34);
  }

  const loadAdminNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json()) as AdminNotificationsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load admin notifications.");
      }

      const nextNotifications = Array.isArray(payload.notifications)
        ? payload.notifications
        : [];
      const nextIds = new Set(nextNotifications.map((item) => item.id));
      const hasNewNotification =
        hasNotificationBaseline.current &&
        nextNotifications.some((item) => !knownNotificationIds.current.has(item.id));

      knownNotificationIds.current = nextIds;
      hasNotificationBaseline.current = true;
      setAdminNotifications(nextNotifications);
      setNotificationUnreadCount(
        typeof payload.unreadCount === "number" ? payload.unreadCount : 0
      );
      setNotificationError("");

      if (
        hasNewNotification &&
        notificationSoundEnabled &&
        notificationAudioContext.current
      ) {
        playAdminNotificationTone(notificationAudioContext.current);
      }
    } catch (error) {
      setNotificationError(
        error instanceof Error
          ? error.message
          : "Unable to load admin notifications."
      );
    }
  }, [notificationSoundEnabled]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadAdminNotifications();
    }, 0);
    const timer = window.setInterval(() => {
      void loadAdminNotifications();
    }, 15000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadAdminNotifications]);

  const enableNotificationSound = useCallback(async () => {
    try {
      const AudioContextConstructor = window.AudioContext;

      if (!AudioContextConstructor) {
        setNotificationError("This browser does not support notification sound.");
        return;
      }

      const context =
        notificationAudioContext.current ?? new AudioContextConstructor();
      notificationAudioContext.current = context;
      await context.resume();

      if (context.state !== "running") {
        setNotificationError(
          "Sound could not be enabled. Check your browser audio settings."
        );
        return;
      }

      setNotificationSoundEnabled(true);
      setNotificationError("");
      playAdminNotificationTone(context);
    } catch {
      setNotificationError(
        "Sound could not be enabled. Check your browser audio settings."
      );
    }
  }, []);

  const markAdminNotificationsRead = useCallback(
    async (id?: string) => {
      try {
        const response = await fetch("/api/admin/notifications", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(id ? { id } : { markAllRead: true }),
        });

        const payload = (await response.json()) as { error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to update notifications.");
        }

        await loadAdminNotifications();
      } catch (error) {
        setNotificationError(
          error instanceof Error
            ? error.message
            : "Unable to update notifications."
        );
      }
    },
    [loadAdminNotifications]
  );
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
      setOrders(data.orders ?? []);
      setAuditEvents(data.auditEvents ?? []);
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

  const loadAdCampaigns = useCallback(async () => {
    setAdLoading(true);
    setAdError("");

    try {
      const response = await fetch("/api/admin/marketplace/advertising", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const result = (await response.json()) as AdvertisingQueueResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load advertising campaigns.");
      }

      setAdCampaigns(result.campaigns ?? []);
    } catch (err) {
      setAdError(
        err instanceof Error
          ? err.message
          : "Unable to load advertising campaigns.",
      );
    } finally {
      setAdLoading(false);
    }
  }, []);

  const loadAgreementRecords = useCallback(async () => {
    setAgreementLoading(true);
    setAgreementError("");

    try {
      const response = await fetch("/api/admin/marketplace/supplier-agreements", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      const result = (await response.json()) as SupplierAgreementResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to load supplier agreement records.");
      }

      setAgreementRecords(result.records ?? []);
    } catch (err) {
      setAgreementError(
        err instanceof Error
          ? err.message
          : "Unable to load supplier agreement records."
      );
    } finally {
      setAgreementLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAgreementRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAgreementRecords]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAdCampaigns();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadAdCampaigns]);

  async function reviewAdvertisingCampaign(
    campaign: AdvertisingCampaign,
    action: "approve" | "reject",
  ) {
    let note = "";

    if (action === "approve") {
      if (
        !window.confirm(
          `Approve "${campaign.headline}"? Its seven-day campaign period starts immediately.`,
        )
      ) {
        return;
      }
    } else {
      const reason = window.prompt(
        "Enter a rejection reason (required, maximum 1,000 characters). Note: the current system does not automatically refund this payment.",
      );

      if (reason === null) return;
      note = reason.trim();

      if (!note || note.length > 1000) {
        setAdError("Rejection requires a reason of 1–1,000 characters.");
        return;
      }

      if (
        !window.confirm(
          `Reject "${campaign.headline}"? The current system will NOT refund the payment automatically.`,
        )
      ) {
        return;
      }
    }

    setReviewingCampaignId(campaign.id);
    setAdError("");
    setAdMessage("");

    try {
      const response = await fetch("/api/admin/marketplace/advertising", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          action,
          note,
        }),
      });

      const result = (await response.json()) as AdvertisingQueueResponse;

      if (!response.ok) {
        throw new Error(result.error || "Unable to review this campaign.");
      }

      setAdMessage(result.message || "Campaign review saved.");
      await loadAdCampaigns();
    } catch (err) {
      setAdError(
        err instanceof Error
          ? err.message
          : "Unable to review this campaign.",
      );
    } finally {
      setReviewingCampaignId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueues();
    }, 0);

    return () => window.clearTimeout(timer);
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
          "Rejection cancelled: enter a reason of 1-1000 characters.",
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
        <button
          type="button"
          onClick={() => setTab("orders")}
          aria-pressed={tab === "orders"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "orders"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Marketplace orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("advertising")}
          aria-pressed={tab === "advertising"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "advertising"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Advertising campaigns ({adCampaigns.filter((campaign) => campaign.campaign_status === "pending_review" && campaign.payment_status === "paid").length})
        </button>
        <button
          type="button"
          onClick={() => setTab("communications")}
          aria-pressed={tab === "communications"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "communications"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Supplier communication
        </button>        <button
          type="button"
          onClick={() => setTab("agreements")}
          aria-pressed={tab === "agreements"}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            tab === "agreements"
              ? "bg-blue-600 text-white"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Supplier Agreements ({agreementRecords.length})
        </button>
      </div>

      <section
        aria-labelledby="admin-notifications-heading"
        className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="admin-notifications-heading" className="text-lg font-semibold">
              Admin notifications
              {notificationUnreadCount > 0 && (
                <span className="ml-2 inline-flex rounded-full bg-red-900 px-2.5 py-0.5 text-xs font-semibold text-red-200">
                  {notificationUnreadCount} unread
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Supplier registrations and product submissions. Refreshes automatically every 15 seconds.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void enableNotificationSound()}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium hover:border-blue-400"
            >
              {notificationSoundEnabled ? "Sound enabled" : "Enable sound"}
            </button>
            <button
              type="button"
              onClick={() => void loadAdminNotifications()}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium hover:border-blue-400"
            >
              Refresh notifications
            </button>
            <button
              type="button"
              onClick={() => void markAdminNotificationsRead()}
              disabled={notificationUnreadCount === 0}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-medium hover:border-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>

        {notificationError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-200">
            {notificationError}
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-800">
          {adminNotifications.length === 0 && !notificationError ? (
            <p className="py-5 text-sm text-slate-400">
              No notifications have been returned yet.
            </p>
          ) : (
            adminNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between ${
                  notification.read_at ? "opacity-75" : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-white">{notification.title}</h3>
                    {!notification.read_at && (
                      <span className="rounded-full bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-200">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-300">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {humanize(notification.event_type)} · {formatDate(notification.created_at)}
                  </p>
                </div>

                {!notification.read_at && (
                  <button
                    type="button"
                    onClick={() => void markAdminNotificationsRead(notification.id)}
                    className="shrink-0 self-start rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium hover:border-blue-400"
                  >
                    Mark read
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>
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
      ) : tab === "products" ? (
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
      ) : tab === "advertising" ? (
        <section className="mt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Advertising campaigns</h2>
              <p className="mt-2 text-sm text-slate-400">
                Review paid campaigns before they appear publicly. Approval starts the seven-day campaign period immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAdCampaigns()}
              disabled={adLoading}
              className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
            >
              {adLoading ? "Refreshing..." : "Refresh campaigns"}
            </button>
          </div>

          {adMessage && (
            <p role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200">
              {adMessage}
            </p>
          )}
          {adError && (
            <p role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200">
              {adError}
            </p>
          )}

          <p className="mb-4 rounded-lg border border-amber-800 bg-amber-950 p-4 text-sm text-amber-200">
            The current system does not automatically refund rejected campaigns. Confirm the applicable refund policy before rejecting a paid campaign.
          </p>

          {adLoading && adCampaigns.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              Loading advertising campaigns...
            </p>
          ) : adCampaigns.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No advertising campaigns were returned.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {adCampaigns.map((campaign) => (
                <article
                  key={campaign.id}
                  className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-lg font-bold">{campaign.headline}</h3>
                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-200">
                      {humanize(campaign.campaign_status)}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-300">
                    Supplier: {campaign.supplier?.business_name ?? "Supplier details unavailable"}
                  </p>
                  {campaign.description && (
                    <p className="mt-3 text-sm text-slate-300">{campaign.description}</p>
                  )}

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-400">Package</dt>
                      <dd className="mt-1">{campaign.package_name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Amount paid</dt>
                      <dd className="mt-1">{formatNairaFromKobo(campaign.amount_kobo)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Placement</dt>
                      <dd className="mt-1">{humanize(campaign.placement)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Payment status</dt>
                      <dd className="mt-1">{humanize(campaign.payment_status)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Submitted</dt>
                      <dd className="mt-1">{formatDate(campaign.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Paid</dt>
                      <dd className="mt-1">{campaign.paid_at ? formatDate(campaign.paid_at) : "Not recorded"}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <a href={campaign.image_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-300 underline">
                      View creative
                    </a>
                    <a href={campaign.target_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-300 underline">
                      View destination
                    </a>
                  </div>

                  {campaign.admin_review_note && (
                    <p className="mt-3 text-sm text-amber-200">
                      Review note: {campaign.admin_review_note}
                    </p>
                  )}

                  {campaign.payment_status === "paid" && campaign.campaign_status === "pending_review" && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={reviewingCampaignId !== null}
                        onClick={() => void reviewAdvertisingCampaign(campaign, "approve")}
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {reviewingCampaignId === campaign.id ? "Processing..." : "Approve campaign"}
                      </button>
                      <button
                        type="button"
                        disabled={reviewingCampaignId !== null}
                        onClick={() => void reviewAdvertisingCampaign(campaign, "reject")}
                        className="rounded-lg bg-red-800 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject campaign
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : tab === "agreements" ? (
        <section className="mt-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Supplier Agreement Acceptance</h2>
            <p className="mt-2 text-sm text-slate-400">
              Review recorded supplier agreement acceptances, signatories, timestamps, and agreement hashes.
            </p>
          </div>

          {agreementLoading ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              Loading supplier agreement records...
            </p>
          ) : agreementError ? (
            <div role="alert" className="rounded-xl border border-red-800 bg-red-950 p-6 text-red-200">
              {agreementError}
            </div>
          ) : agreementRecords.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No supplier agreement acceptance records found.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {agreementRecords.map((record) => (
                <article key={record.id} className="rounded-xl border border-slate-700 bg-slate-900 p-5">
                  <h3 className="text-lg font-semibold">
                    {record.supplier?.business_name || "Supplier"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Contact: {record.supplier?.contact_name || "Not provided"}
                  </p>
                  <p className="text-sm text-slate-300">
                    Email: {record.supplier?.contact_email || "Not provided"}
                  </p>
                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    <p><strong>Signatory:</strong> {record.signatory_name}</p>
                    <p><strong>Accepted:</strong> {new Date(record.accepted_at).toLocaleString()}</p>
                    <p><strong>Agreement version:</strong> {record.agreement_version}</p>
                    <p><strong>Acceptance method:</strong> {record.acceptance_method}</p>
                    <p className="break-all"><strong>Supplier ID:</strong> {record.supplier_id}</p>
                    <p className="break-all"><strong>Agreement SHA-256:</strong> {record.agreement_sha256}</p>
                    <div>
                      <strong>Acceptance statement:</strong>
                      <p className="mt-1 whitespace-pre-wrap">{record.acceptance_statement}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="mt-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Marketplace orders</h2>
            <p className="text-sm text-slate-400">
              Showing up to {orders.length} most recent orders
            </p>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No marketplace orders were returned.
            </p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {orders.map((order) => {
                const supplier = suppliers.find(
                  (item) => item.id === order.supplier_id,
                );
                const orderEvents = auditEvents.filter(
                  (event) => event.order_id === order.id,
                );

                return (
                  <article
                    key={order.id}
                    className="rounded-xl border border-slate-700 bg-slate-900 p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-bold">
                        {order.product_name}
                      </h3>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-slate-200">
                        {humanize(order.payment_status)}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-slate-400">Customer</dt>
                        <dd className="mt-1">{order.customer_name}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Phone</dt>
                        <dd className="mt-1 break-words">
                          {order.customer_phone}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-400">Email</dt>
                        <dd className="mt-1 break-words">
                          {order.customer_email}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Supplier</dt>
                        <dd className="mt-1">
                          {supplier?.business_name ?? order.supplier_id}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Quantity</dt>
                        <dd className="mt-1">{order.quantity}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Order subtotal</dt>
                        <dd className="mt-1 font-semibold">
                          {formatNairaFromKobo(order.subtotal_kobo)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Platform commission</dt>
                        <dd className="mt-1">
                          {formatNairaFromKobo(order.commission_kobo)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Supplier amount</dt>
                        <dd className="mt-1">
                          {formatNairaFromKobo(order.supplier_amount_kobo)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-400">Created</dt>
                        <dd className="mt-1">{formatDate(order.created_at)}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-400">Paystack reference</dt>
                        <dd className="mt-1 break-all">
                          {order.paystack_reference}
                        </dd>
                      </div>
                      {order.paystack_transaction_id != null && (
                        <div className="sm:col-span-2">
                          <dt className="text-slate-400">
                            Paystack transaction ID
                          </dt>
                          <dd className="mt-1">
                            {order.paystack_transaction_id}
                          </dd>
                        </div>
                      )}
                      {order.paid_at && (
                        <div className="sm:col-span-2">
                          <dt className="text-slate-400">Paid at</dt>
                          <dd className="mt-1">{formatDate(order.paid_at)}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-slate-400">Fulfilment status</dt>
                        <dd className="mt-1 font-medium">
                          {humanize(order.fulfilment_status || "not_started")}
                        </dd>
                      </div>
                      {order.fulfilment_updated_at && (
                        <div>
                          <dt className="text-slate-400">Last fulfilment update</dt>
                          <dd className="mt-1">
                            {formatDate(order.fulfilment_updated_at)}
                          </dd>
                        </div>
                      )}
                      {order.dispatched_at && (
                        <div>
                          <dt className="text-slate-400">Dispatched at</dt>
                          <dd className="mt-1">{formatDate(order.dispatched_at)}</dd>
                        </div>
                      )}
                      {order.delivered_at && (
                        <div>
                          <dt className="text-slate-400">Delivered at</dt>
                          <dd className="mt-1">{formatDate(order.delivered_at)}</dd>
                        </div>
                      )}
                      <div className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                        <dt className="font-semibold text-slate-200">
                          Payment allocation
                        </dt>
                        <dd className="mt-2 text-sm text-slate-300">
                          The order subtotal, platform commission, and supplier amount above show the recorded allocation for this order. Payment status and fulfilment status are tracked separately.
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-400">Audit history</dt>
                        <dd className="mt-2">
                          {orderEvents.length === 0 ? (
                            <p className="text-slate-400">No audit events recorded.</p>
                          ) : (
                            <ol className="space-y-3">
                              {orderEvents.slice(0, 5).map((event) => (
                                <li
                                  key={event.id}
                                  className="rounded-lg border border-slate-700 p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-medium">
                                      {humanize(event.event_type)}:{" "}
                                      {event.previous_status
                                        ? `${humanize(event.previous_status)} -> `
                                        : ""}
                                      {humanize(event.new_status)}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {formatDate(event.created_at)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-400">
                                    Actor role: {humanize(event.actor_role)}
                                  </p>
                                  {event.note && (
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                                      {event.note}
                                    </p>
                                  )}
                                  {event.evidence_reference && (
                                    <p className="mt-2 break-all text-xs text-slate-400">
                                      Evidence reference: {event.evidence_reference}
                                    </p>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-slate-400">Order ID</dt>
                        <dd className="mt-1 break-all">{order.id}</dd>
                      </div>
                    </dl>
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

