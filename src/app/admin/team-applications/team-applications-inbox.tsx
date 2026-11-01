"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ApplicationStatus =
  | "new"
  | "reviewing"
  | "shortlisted"
  | "contacted"
  | "closed";

type TeamApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string | null;
  application_type: "employment_interest" | "volunteer_collaboration" | "project_collaboration";
  interest_area: string;
  experience: string;
  portfolio_url: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
};

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "reviewing", label: "Reviewing" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "contacted", label: "Contacted" },
  { value: "closed", label: "Closed" },
];

const interestLabels: Record<string, string> = {
  software_development: "Software development",
  electrical_solar: "Electrical engineering & solar",
  energyos_iot_automation: "EnergyOS, IoT & automation",
  business_development_sales: "Business development & sales",
  operations_field_support: "Operations & field support",
  other: "Other relevant skills",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function statusStyle(status: ApplicationStatus) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800";
    case "reviewing":
      return "bg-amber-100 text-amber-800";
    case "shortlisted":
      return "bg-violet-100 text-violet-800";
    case "contacted":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-slate-200 text-slate-700";
  }
}

function pathwayLabel(type: TeamApplication["application_type"]) {
  switch (type) {
    case "employment_interest":
      return "Paid employment — future vacancies";
    case "project_collaboration":
      return "Paid project engagement — subject to confirmed funding and agreed terms";
    case "volunteer_collaboration":
      return "Volunteer collaboration — unpaid and optional";
  }
}

export default function TeamApplicationsInbox() {
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | ApplicationStatus>("all");
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selected = applications.find((item) => item.id === selectedId) ?? null;

  const loadApplications = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/team-applications", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load team applications.");
      }

      const next = Array.isArray(data.applications)
        ? (data.applications as TeamApplication[])
        : [];

      setApplications(next);
      setSelectedId((current) => {
        if (current && next.some((item) => item.id === current)) return current;
        return current ? null : (next[0]?.id ?? null);
      });
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load team applications.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadApplications();
    });
  }, [loadApplications]);

  const visibleApplications = useMemo(
    () =>
      applications.filter((application) =>
        filter === "all" ? true : application.status === filter,
      ),
    [applications, filter],
  );

  async function updateStatus(nextStatus: ApplicationStatus) {
    if (!selected || changingStatus || selected.status === nextStatus) return;

    setChangingStatus(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/team-applications", {
        method: "PATCH",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selected.id,
          status: nextStatus,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update application status.");
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === selected.id
            ? {
                ...item,
                status: data.application.status,
                updated_at: data.application.updated_at,
              }
            : item,
        ),
      );

      setNotice("Application status updated.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update application status.",
      );
    } finally {
      setChangingStatus(false);
    }
  }

  async function signOut() {
    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Unable to sign out.");

      window.location.replace("/admin/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign out.");
    }
  }

  const phoneDigits = selected?.phone.replace(/\D/g, "") ?? "";

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
            Samiz Tech Engineering Ltd
          </p>
          <h1 className="mt-2 text-3xl font-bold">Team Applications</h1>
          <p className="mt-2 text-sm text-slate-300">
            Review expressions of interest and manage applicant status.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <a href="/admin" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold hover:border-blue-400">
            Admin dashboard
          </a>
          <a href="/admin/marketplace" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold hover:border-blue-400">
            Marketplace
          </a>
          <a href="/admin/support" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold hover:border-blue-400">
            Support
          </a>
          <button
            type="button"
            onClick={() => { setLoading(true); void loadApplications(); }}
            disabled={loading}
            className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold hover:border-blue-400 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statusOptions.map((option) => (
          <div key={option.value} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{option.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {applications.filter((item) => item.status === option.value).length}
            </p>
          </div>
        ))}
      </section>

      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-5 rounded-lg border border-green-800 bg-green-950 p-4 text-sm text-green-200">
          {notice}
        </p>
      )}

      <section className="mt-6 grid min-h-[600px] gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.6fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-700 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Applicants</h2>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                {visibleApplications.length}
              </span>
            </div>
            <label htmlFor="team-application-filter" className="mt-3 block text-xs font-semibold text-slate-400">
              Filter by status
            </label>
            <select
              id="team-application-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value as "all" | ApplicationStatus)}
              className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="all">All applications</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="p-5 text-sm text-slate-400">Loading applications...</p>
          ) : visibleApplications.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-semibold text-slate-200">No applications found</p>
              <p className="mt-1 text-sm text-slate-400">
                Submitted expressions of interest will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[720px] overflow-y-auto">
              {visibleApplications.map((application) => (
                <li key={application.id} className="border-b border-slate-800 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(application.id);
                      setNotice("");
                    }}
                    aria-pressed={selectedId === application.id}
                    className={`w-full p-4 text-left hover:bg-slate-800 ${
                      selectedId === application.id ? "bg-slate-800 ring-1 ring-inset ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 break-words font-semibold text-white">
                        {application.full_name}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyle(application.status)}`}>
                        {application.status}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-xs text-slate-400">{application.email}</p>
                    <p className="mt-2 text-sm text-slate-200">
                      {interestLabels[application.interest_area] ?? application.interest_area}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Received {formatDate(application.created_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          {!selected ? (
            <div className="flex min-h-[400px] items-center justify-center p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold">Select an applicant</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Choose an application from the list to review its details.
                </p>
              </div>
            </div>
          ) : (
            <article>
              <header className="border-b border-slate-700 p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Applicant details</p>
                    <h2 className="mt-2 break-words text-2xl font-bold">{selected.full_name}</h2>
                    <p className="mt-2 break-all text-sm text-slate-300">{selected.email}</p>
                    <p className="mt-1 text-sm text-slate-300">{selected.phone}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {selected.location || "Location not provided"}
                    </p>
                  </div>

                  <div className="w-full sm:w-56">
                    <label htmlFor="team-application-status" className="text-xs font-semibold text-slate-400">
                      Application status
                    </label>
                    <select
                      id="team-application-status"
                      value={selected.status}
                      disabled={changingStatus}
                      onChange={(event) => void updateStatus(event.target.value as ApplicationStatus)}
                      className="mt-1 min-h-11 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {changingStatus && <p className="mt-2 text-xs text-slate-400">Updating status...</p>}
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <a href={`mailto:${selected.email}`} className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-600">
                    Email applicant
                  </a>
                  {phoneDigits && (
                    <a
                      href={`https://wa.me/${phoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-green-400"
                    >
                      WhatsApp
                    </a>
                  )}
                  {selected.portfolio_url && (
                    <a
                      href={selected.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-blue-400"
                    >
                      View portfolio
                    </a>
                  )}
                </div>
              </header>

              <div className="space-y-6 p-4 sm:p-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferred pathway</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{pathwayLabel(selected.application_type)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Area of interest</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">
                    {interestLabels[selected.interest_area] ?? selected.interest_area}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Skills and relevant experience</p>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                    {selected.experience}
                  </p>
                </div>
                <div className="grid gap-4 border-t border-slate-700 pt-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Application received</p>
                    <p className="mt-2 text-sm text-slate-200">{formatDate(selected.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Last status update</p>
                    <p className="mt-2 text-sm text-slate-200">{formatDate(selected.updated_at)}</p>
                  </div>
                </div>
                <p className="break-all border-t border-slate-700 pt-4 text-xs text-slate-500">
                  Application reference: {selected.id}
                </p>
              </div>
            </article>
          )}
        </section>
      </section>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Applicant information is available only in this authenticated admin area.
        Refresh manually to retrieve new applications.
      </p>
    </main>
  );
}
