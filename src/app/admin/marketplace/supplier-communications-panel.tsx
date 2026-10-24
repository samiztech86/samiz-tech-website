"use client";

import { useEffect, useMemo, useState } from "react";

type CommunicationSupplier = {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  verification_status: string | null;
};

type CommunicationResult = {
  supplierId: string;
  businessName: string;
  status: "sent" | "failed";
  error?: string;
};

type CommunicationsResponse = {
  suppliers?: CommunicationSupplier[];
  totalSuppliers?: number;
  eligibleRecipients?: number;
  mode?: "single" | "bulk";
  targeted?: number;
  sent?: number;
  failed?: number;
  results?: CommunicationResult[];
  error?: string;
};

function isValidEmail(value: string | null | undefined): boolean {
  return typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function humanizeStatus(value: string | null | undefined): string {
  if (!value) return "Unknown status";
  return value.replaceAll("_", " ");
}

export default function SupplierCommunicationsPanel() {
  const [suppliers, setSuppliers] = useState<CommunicationSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [supplierId, setSupplierId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [result, setResult] = useState<CommunicationsResponse | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSuppliers() {
      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/admin/marketplace/communications", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });

        const payload = (await response.json()) as CommunicationsResponse;

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load registered suppliers.");
        }

        if (active) {
          const records = Array.isArray(payload.suppliers)
            ? payload.suppliers
            : [];

          setSuppliers(records);
          setSupplierId((current) =>
            records.some((supplier) => supplier.id === current)
              ? current
              : ""
          );
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load registered suppliers."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSuppliers();

    return () => {
      active = false;
    };
  }, []);

  const eligibleSuppliers = useMemo(
    () => suppliers.filter((supplier) => isValidEmail(supplier.contact_email)),
    [suppliers]
  );

  const uniqueBulkRecipientCount = useMemo(
    () => new Set(
      eligibleSuppliers.map((supplier) => supplier.contact_email!.trim().toLowerCase())
    ).size,
    [eligibleSuppliers]
  );

  const selectedSupplier = suppliers.find(
    (supplier) => supplier.id === supplierId
  );

  async function sendEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendError("");
    setResult(null);

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (!cleanSubject || cleanSubject.length > 180) {
      setSendError("Enter a subject of 1–180 characters.");
      return;
    }

    if (!cleanMessage || cleanMessage.length > 5000) {
      setSendError("Enter a message of 1–5000 characters.");
      return;
    }

    if (mode === "single") {
      if (!selectedSupplier) {
        setSendError("Select one registered supplier.");
        return;
      }

      if (!isValidEmail(selectedSupplier.contact_email)) {
        setSendError("The selected supplier does not have a valid email address.");
        return;
      }
    } else if (uniqueBulkRecipientCount === 0) {
      setSendError("There are no eligible supplier email addresses.");
      return;
    }

    const recipientCount =
      mode === "single" ? 1 : uniqueBulkRecipientCount;

    const confirmation =
      mode === "single"
        ? `Send this email only to ${selectedSupplier?.business_name || selectedSupplier?.contact_name || "the selected supplier"} (${selectedSupplier?.contact_email})?\n\nSubject: ${cleanSubject}\n\nThis will send a real email.`
        : `Send this email individually to ${recipientCount} unique supplier email address(es)?\n\nThis includes registered suppliers regardless of approval status. Each recipient will receive a separate email. No other recipients will be added.\n\nSubject: ${cleanSubject}\n\nThis will send real emails and cannot be undone.`;

    if (!window.confirm(confirmation)) return;

    setSending(true);

    try {
      const response = await fetch("/api/admin/marketplace/communications", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          supplierId: mode === "single" ? supplierId : undefined,
          subject: cleanSubject,
          message: cleanMessage,
        }),
      });

      const payload = (await response.json()) as CommunicationsResponse;

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit the email.");
      }

      setResult(payload);
    } catch (error) {
      setSendError(
        error instanceof Error
          ? error.message
          : "Unable to submit the email."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold">Supplier Communications</h2>
        <p className="mt-2 text-sm text-slate-300">
          Send operational updates, product correction requests, and
          resubmission reminders to registered marketplace suppliers.
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Messages are sent individually. Supplier email addresses are not
          exposed to other recipients, and the admin is not automatically copied.
        </p>
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-700 p-6 text-slate-300">
          Loading registered suppliers...
        </p>
      ) : loadError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-800 bg-red-950 p-5 text-sm text-red-200"
        >
          {loadError}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="ml-3 underline"
          >
            Reload page
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Registered suppliers</p>
              <p className="mt-2 text-2xl font-bold">{suppliers.length}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Valid supplier email records</p>
              <p className="mt-2 text-2xl font-bold">{eligibleSuppliers.length}</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm text-slate-400">Unique bulk recipients</p>
              <p className="mt-2 text-2xl font-bold">{uniqueBulkRecipientCount}</p>
            </div>
          </div>

          <form
            onSubmit={sendEmail}
            className="space-y-5 rounded-xl border border-slate-700 bg-slate-900 p-5"
          >
            <div>
              <label
                htmlFor="communication-mode"
                className="mb-2 block text-sm font-semibold"
              >
                Recipient mode
              </label>
              <select
                id="communication-mode"
                value={mode}
                onChange={(event) => {
                  setMode(event.target.value as "single" | "bulk");
                  setResult(null);
                  setSendError("");
                }}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-sm"
              >
                <option value="single">One selected supplier</option>
                <option value="bulk">All registered suppliers with unique valid emails</option>
              </select>
            </div>

            {mode === "single" ? (
              <div>
                <label
                  htmlFor="communication-supplier"
                  className="mb-2 block text-sm font-semibold"
                >
                  Select supplier
                </label>
                <select
                  id="communication-supplier"
                  value={supplierId}
                  onChange={(event) => {
                    setSupplierId(event.target.value);
                    setResult(null);
                    setSendError("");
                  }}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-sm"
                >
                  <option value="">Choose a registered supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {(supplier.business_name || supplier.contact_name || "Unnamed supplier") +
                        " — " +
                        (supplier.contact_email || "No email") +
                        " [" +
                        humanizeStatus(supplier.verification_status) +
                        "]"}
                    </option>
                  ))}
                </select>
                {selectedSupplier && (
                  <p className="mt-2 text-xs text-slate-400">
                    Recipient: {selectedSupplier.contact_email || "No email address"}.
                    Status: {humanizeStatus(selectedSupplier.verification_status)}.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-amber-700/70 bg-amber-950/30 p-4 text-sm text-amber-100">
                This will target {uniqueBulkRecipientCount} unique valid email
                address(es) across all registered suppliers, including pending
                and unapproved profiles. Duplicate email addresses are sent only
                once. Review your message carefully before sending.
              </div>
            )}

            <div>
              <label
                htmlFor="communication-subject"
                className="mb-2 block text-sm font-semibold"
              >
                Email subject
              </label>
              <input
                id="communication-subject"
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                maxLength={180}
                required
                placeholder="e.g. Action required: complete your product submission"
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">
                {subject.length}/180 characters
              </p>
            </div>

            <div>
              <label
                htmlFor="communication-message"
                className="mb-2 block text-sm font-semibold"
              >
                Message
              </label>
              <textarea
                id="communication-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={5000}
                required
                rows={9}
                placeholder={"Dear Supplier,\n\nPlease review and complete the required product corrections, then resubmit your listing for admin approval.\n\nRegards,\nSamiz Tech Marketplace Admin"}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-3 text-sm"
              />
              <p className="mt-1 text-xs text-slate-400">
                {message.length}/5000 characters. Plain text email.
              </p>
            </div>

            {sendError && (
              <div
                role="alert"
                className="rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200"
              >
                {sendError}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || loading || (mode === "bulk" && uniqueBulkRecipientCount === 0)}
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending
                ? "Submitting email..."
                : mode === "single"
                  ? "Review and send email"
                  : `Review and send to ${uniqueBulkRecipientCount} recipients`}
            </button>
          </form>

          {result && (
            <section
              aria-live="polite"
              className="space-y-4 rounded-xl border border-slate-700 bg-slate-900 p-5"
            >
              <h3 className="text-lg font-bold">Email submission results</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-700 p-3">
                  <p className="text-sm text-slate-400">Targeted</p>
                  <p className="mt-1 text-2xl font-bold">{result.targeted ?? 0}</p>
                </div>
                <div className="rounded-lg border border-emerald-800 p-3">
                  <p className="text-sm text-slate-400">Accepted by email provider</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">
                    {result.sent ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border border-red-800 p-3">
                  <p className="text-sm text-slate-400">Failed submissions</p>
                  <p className="mt-1 text-2xl font-bold text-red-300">
                    {result.failed ?? 0}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-300">
                “Accepted by email provider” means the email service accepted
                the submission; it does not confirm that the recipient opened
                or received the email in their inbox.
              </p>
              {Array.isArray(result.results) && result.results.length > 0 && (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {result.results.map((item, index) => (
                    <div
                      key={`${item.supplierId}-${index}`}
                      className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-700 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{item.businessName}</p>
                        {item.error && (
                          <p className="mt-1 text-xs text-red-300">{item.error}</p>
                        )}
                      </div>
                      <span
                        className={
                          item.status === "sent"
                            ? "text-emerald-300"
                            : "text-red-300"
                        }
                      >
                        {item.status === "sent" ? "Submitted" : "Failed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </section>
  );
}