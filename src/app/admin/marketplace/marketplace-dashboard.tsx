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

type QueueTab = "suppliers" | "products" | "orders" | "agreements" | "communications" | "advertising";

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
  product_id: string | null;
  package_id: string;
  package_name: string;
  amount_kobo: number;
  currency: string;
  headline: string;
  description: string | null;
  image_url: string;
  target_url: string;
  placement: string;
  payment_status: string;
  paystack_reference: string;
  paid_at: string | null;
  campaign_status: string;
  starts_at: string | null;
  ends_at: string | null;
  admin_review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
  supplier: { business_name: string } | null;
};

type AdvertisingCampaignResponse = {
  success?: boolean;
  campaigns?: AdvertisingCampaign[];
  error?: string;
};

type AdvertisingReviewResponse = {
  success?: boolean;
  campaign?: AdvertisingCampaign;
  message?: string;
  error?: string;
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

export default function MarketplaceDashboard() {
  const [tab, setTab] = useState<QueueTab>("suppliers");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [auditEvents, setAuditEvents] = useState<MarketplaceAuditEvent[]>([]);
  const [agreementRecords, setAgreementRecords] = useState<SupplierAgreementRecord[]>([]);
  const [agreementLoading, setAgreementLoading] = useState(false);
  const [agreementError, setAgreementError] = useState("");
  const [advertisingCampaigns, setAdvertisingCampaigns] = useState<AdvertisingCampaign[]>([]);
  const [advertisingLoading, setAdvertisingLoading] = useState(false);
  const [advertisingRefreshing, setAdvertisingRefreshing] = useState(false);
  const [advertisingError, setAdvertisingError] = useState("");
  const [advertisingMessage, setAdvertisingMessage] = useState("");
  const [advertisingActionId, setAdvertisingActionId] = useState<string | null>(null);
  const [supplierFilter, setSupplierFilter] = useState("pending");
  const [productFilter, setProductFilter] = useState("draft");
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [moderationMessage, setModerationMessage] = useState("");

  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState(false);
  const notificationAudioContext = useRef<AudioContext | null>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const hasNotificationBaseline = useRef(false);

  const loadAdminNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
        credentials: "same-origin",
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
          headers: { "Content-Type": "application/json" },
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

  const loadAgreementRecords = useCallback(async (refresh = false) => {
    if (refresh) {
      setRefreshing(true);
    } else {
      setAgreementLoading(true);
    }

    setAgreementError("");

    try {
      const response = await fetch("/api/admin/marketplace/supplier-agreements", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const data = (await response.json()) as SupplierAgreementResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to load supplier agreement records.");
      }

      setAgreementRecords(data.records ?? []);
    } catch (err) {
      setAgreementError(
        err instanceof Error
          ? err.message
          : "Unable to load supplier agreement records.",
      );
    } finally {
      setAgreementLoading(false);
      setRefreshing(false);
    }
  }, []);
  const loadAdvertisingCampaigns = useCallback(async (refresh = false) => {
    if (refresh) {
      setAdvertisingRefreshing(true);
    } else {
      setAdvertisingLoading(true);
    }

    setAdvertisingError("");

    try {
      const response = await fetch("/api/admin/marketplace/advertising", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json()) as AdvertisingCampaignResponse;

      if (!response.ok || !payload.success || !Array.isArray(payload.campaigns)) {
        setAdvertisingError(payload.error || "Unable to load advertising campaigns.");
        return;
      }

      setAdvertisingCampaigns(payload.campaigns);
    } catch {
      setAdvertisingError("Could not reach the advertising campaign service.");
    } finally {
      setAdvertisingLoading(false);
      setAdvertisingRefreshing(false);
    }
  }, []);

  const reviewAdvertisingCampaign = useCallback(async (
    campaign: AdvertisingCampaign,
    action: "approve" | "reject",
  ) => {
    if (
      campaign.payment_status !== "paid" ||
      campaign.campaign_status !== "pending_review"
    ) {
      setAdvertisingError("Only paid campaigns awaiting review can be reviewed.");
      return;
    }

    let note = "";

    if (action === "reject") {
      const enteredNote = window.prompt(
        "Enter the reason for rejecting this campaign. This does not refund the payment:",
      );

      if (enteredNote === null) return;

      note = enteredNote.trim();

      if (!note) {
        setAdvertisingError("A rejection reason is required.");
        return;
      }

      if (note.length > 1000) {
        setAdvertisingError("The rejection reason must not exceed 1,000 characters.");
        return;
      }
    } else if (!window.confirm(
      "Approve this paid campaign? Its seven-day campaign period will start now.",
    )) {
      return;
    }

    setAdvertisingActionId(campaign.id);
    setAdvertisingError("");
    setAdvertisingMessage("");

    try {
      const response = await fetch("/api/admin/marketplace/advertising", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          action,
          ...(action === "reject" ? { note } : {}),
        }),
      });

      const payload = (await response.json()) as AdvertisingReviewResponse;

      if (!response.ok || !payload.success) {
        setAdvertisingError(payload.error || "Unable to save the campaign review.");
        return;
      }

      setAdvertisingMessage(
        payload.message ||
          (action === "approve" ? "Campaign approved." : "Campaign rejected."),
      );

      await loadAdvertisingCampaigns(true);
    } catch {
      setAdvertisingError("Could not reach the campaign review service.");
    } finally {
      setAdvertisingActionId(null);
    }
  }, [loadAdvertisingCampaigns]);

  useEffect(() => {
    if (tab !== "advertising") return;

    const timer = window.setTimeout(() => {
      void loadAdvertisingCampaigns();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tab, loadAdvertisingCampaigns]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadQueues();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadQueues]);

  useEffect(() => {
    if (tab !== "agreements") return;

    const timer = window.setTimeout(() => {
      void loadAgreementRecords();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tab, loadAgreementRecords]);
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
          <a
            href="/admin/support"
            className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-semibold text-blue-100 hover:border-blue-400 hover:text-white"
          >
            Support Inbox
          </a>
          <button
            type="button"
            onClick={() => {
              if (tab === "advertising") {
                void loadAdvertisingCampaigns(true);
              } else if (tab === "agreements") {
                void loadAgreementRecords(true);
              } else {
                void loadQueues(true);
              }
            }}
            disabled={
              tab === "advertising"
                ? advertisingLoading || advertisingRefreshing
                : loading || refreshing
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60"
          >
            {tab === "advertising" ? (advertisingRefreshing ? "Refreshing ads..." : "Refresh advertising") : refreshing ? "Refreshing..." : tab === "agreements" ? "Refresh agreements" : "Refresh queues"}
          </button>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Admin notifications
              {notificationUnreadCount > 0 && (
                <span className="ml-2 inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  {notificationUnreadCount} unread
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Supplier registrations, product submissions and support messages.
              Updates automatically every 15 seconds.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void enableNotificationSound()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {notificationSoundEnabled ? "Sound enabled" : "Enable sound"}
            </button>
            <button
              type="button"
              onClick={() => void loadAdminNotifications()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void markAdminNotificationsRead()}
              disabled={notificationUnreadCount === 0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark all read
            </button>
          </div>
        </div>

        {notificationError && (
          <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {notificationError}
          </p>
        )}

        <div className="mt-4 divide-y divide-slate-100">
          {adminNotifications.length === 0 && !notificationError ? (
            <p className="py-6 text-sm text-slate-500">
              No notifications yet. New marketplace activity will appear here.
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
                    <h3 className="font-medium text-slate-900">
                      {notification.title}
                    </h3>
                    {!notification.read_at && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {humanize(notification.event_type)} ·{" "}
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.read_at && (
                  <button
                    type="button"
                    onClick={() => void markAdminNotificationsRead(notification.id)}
                    className="shrink-0 self-start rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Mark read
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </section>
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
          Advertising ({advertisingCampaigns.filter((campaign) => campaign.payment_status === "paid" && campaign.campaign_status === "pending_review").length} pending)
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
          Supplier Communications
        </button>
        <button
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

      {tab === "advertising" ? (
        <section className="mt-6">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Marketplace advertising campaigns</h2>
            <p className="mt-2 text-sm text-slate-400">
              Review paid campaigns. Approval starts the seven-day schedule; it does not itself publish an advert on the public marketplace.
              Rejection does not automatically refund the payment.
            </p>
          </div>

          {advertisingMessage && (
            <div role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-4 text-sm text-emerald-200">
              {advertisingMessage}
            </div>
          )}

          {advertisingError && (
            <div role="alert" className="mb-4 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200">
              {advertisingError}
            </div>
          )}

          {advertisingLoading && advertisingCampaigns.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              Loading advertising campaigns...
            </p>
          ) : advertisingCampaigns.length === 0 ? (
            <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
              No advertising campaigns were returned.
            </p>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {advertisingCampaigns.map((campaign) => {
                const canReview =
                  campaign.payment_status === "paid" &&
                  campaign.campaign_status === "pending_review";
                const isProcessing = advertisingActionId === campaign.id;

                return (
                  <article key={campaign.id} className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold">{campaign.headline}</h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {campaign.supplier?.business_name || "Supplier profile unavailable"}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          canReview
                            ? "bg-amber-950 text-amber-200"
                            : campaign.campaign_status === "approved"
                              ? "bg-emerald-950 text-emerald-200"
                              : "bg-slate-800 text-slate-200"
                        }`}>
                          {humanize(campaign.campaign_status)}
                        </span>
                      </div>

                      {campaign.image_url && (
                        <div className="mt-4">
                          <a href={campaign.image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-300 underline">
                            Open advertising image
                          </a>
                        </div>
                      )}

                      {campaign.description && (
                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                          {campaign.description}
                        </p>
                      )}

                      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-slate-400">Package</dt>
                          <dd className="mt-1 font-medium">{campaign.package_name}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Amount</dt>
                          <dd className="mt-1 font-medium">{formatNairaFromKobo(campaign.amount_kobo)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Payment</dt>
                          <dd className="mt-1 font-medium">{humanize(campaign.payment_status)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Placement</dt>
                          <dd className="mt-1 font-medium">{humanize(campaign.placement)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Submitted</dt>
                          <dd className="mt-1">{formatDate(campaign.created_at)}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Paid at</dt>
                          <dd className="mt-1">{campaign.paid_at ? formatDate(campaign.paid_at) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Campaign starts</dt>
                          <dd className="mt-1">{campaign.starts_at ? formatDate(campaign.starts_at) : "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Campaign ends</dt>
                          <dd className="mt-1">{campaign.ends_at ? formatDate(campaign.ends_at) : "—"}</dd>
                        </div>
                        <div className="sm:col-span-2">
                          <dt className="text-slate-400">Payment reference</dt>
                          <dd className="mt-1 break-all font-mono text-xs">{campaign.paystack_reference}</dd>
                        </div>
                      </dl>

                      <p className="mt-4 text-sm">
                        <a href={campaign.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-300 underline underline-offset-4">
                          Open campaign destination
                        </a>
                      </p>

                      {campaign.admin_review_note && (
                        <div className="mt-4 rounded-lg border border-slate-700 p-3 text-sm text-slate-300">
                          <span className="font-semibold">Review note: </span>
                          {campaign.admin_review_note}
                        </div>
                      )}

                      {canReview ? (
                        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-700 pt-4">
                          <button
                            type="button"
                            disabled={advertisingActionId !== null}
                            onClick={() => void reviewAdvertisingCampaign(campaign, "approve")}
                            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Approve campaign"}
                          </button>
                          <button
                            type="button"
                            disabled={advertisingActionId !== null}
                            onClick={() => void reviewAdvertisingCampaign(campaign, "reject")}
                            className="rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-950 disabled:opacity-50"
                          >
                            {isProcessing ? "Processing..." : "Reject campaign"}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-4 text-xs text-slate-400">
                          No review actions are available for this campaign status.
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : loading ? (
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
      ) : tab === "orders" ? (
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
      ) : tab === "communications" ? (
        <SupplierCommunicationsPanel />
      ) : (
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
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {record.supplier?.business_name || "Supplier profile unavailable"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-300">
                        {record.supplier?.contact_name || "Contact name unavailable"}
                      </p>
                      <p className="mt-1 break-all text-sm text-slate-400">
                        {record.supplier?.contact_email || "Contact email unavailable"}
                      </p>
                    </div>
                    <span className="rounded-full border border-emerald-700 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Agreement accepted
                    </span>
                  </div>
                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-400">Signatory</dt>
                      <dd className="mt-1 font-medium">{record.signatory_name}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Accepted at</dt>
                      <dd className="mt-1">{formatDate(record.accepted_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Agreement version</dt>
                      <dd className="mt-1">{record.agreement_version}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Acceptance method</dt>
                      <dd className="mt-1">{humanize(record.acceptance_method)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Supplier ID</dt>
                      <dd className="mt-1 break-all">{record.supplier_id}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Agreement SHA-256</dt>
                      <dd className="mt-1 break-all font-mono text-xs">{record.agreement_sha256}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-slate-400">Recorded acceptance statement</dt>
                      <dd className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-slate-200">
                        {record.acceptance_statement}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
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
