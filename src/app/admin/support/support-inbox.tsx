"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Conversation = {
  id: string;
  visitor_name: string;
  visitor_email: string;
  subject: string | null;
  status: "open" | "waiting" | "resolved";
  last_message_at: string;
  created_at: string;
  updated_at: string;
};

type SupportMessage = {
  id: string;
  sender_type: "visitor" | "admin";
  message: string;
  created_at: string;
};

const statusOptions = [
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting for visitor" },
  { value: "resolved", label: "Resolved" },
] as const;

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

function statusStyle(status: string) {
  if (status === "resolved") return "bg-green-100 text-green-800";
  if (status === "waiting") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

export default function SupportInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState("all");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [error, setError] = useState("");
  const [threadError, setThreadError] = useState("");
  const [notice, setNotice] = useState("");

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const loadConversations = useCallback(async (initial = false) => {
    if (initial) setLoadingList(true);

    try {
      const response = await fetch("/api/admin/support/conversations", {
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
        throw new Error(data.error || "Unable to load conversations.");
      }

      const next = Array.isArray(data.conversations)
        ? (data.conversations as Conversation[])
        : [];

      setConversations(next);
      setSelectedId((current) => {
        if (current && next.some((item) => item.id === current)) return current;
        return current ? null : (next[0]?.id ?? null);
      });
      setError("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load conversations.",
      );
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string, showLoading = false) => {
    if (showLoading) setLoadingThread(true);

    try {
      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(id)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load this conversation.");
      }

      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setThreadError("");
      if (data.conversation) {
        setConversations((current) =>
          current.map((item) =>
            item.id === data.conversation.id
              ? { ...item, ...data.conversation }
              : item,
          ),
        );
      }
    } catch (err) {
      setThreadError(
        err instanceof Error ? err.message : "Unable to load messages.",
      );
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadConversations(true));

    const timer = window.setInterval(() => {
      void loadConversations(false);
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    void Promise.resolve().then(() => loadThread(selectedId, true));

    const timer = window.setInterval(() => {
      void loadThread(selectedId, false);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [selectedId, loadThread]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId || !draft.trim() || sending) return;

    setSending(true);
    setThreadError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(selectedId)}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: draft.trim() }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send reply.");
      }

      setDraft("");
      setNotice(data.warning || "Reply sent.");
      await loadThread(selectedId);
      await loadConversations(false);
    } catch (err) {
      setThreadError(
        err instanceof Error ? err.message : "Unable to send reply.",
      );
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(nextStatus: Conversation["status"]) {
    if (!selectedId || changingStatus || selected?.status === nextStatus) return;

    setChangingStatus(true);
    setThreadError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/support/conversations/${encodeURIComponent(selectedId)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      if (response.status === 401 || response.status === 403) {
        window.location.replace("/admin/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update status.");
      }

      setConversations((current) =>
        current.map((item) =>
          item.id === selectedId
            ? { ...item, status: data.conversation.status }
            : item,
        ),
      );
      setNotice("Conversation status updated.");
    } catch (err) {
      setThreadError(
        err instanceof Error ? err.message : "Unable to update status.",
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

  const visibleConversations = conversations.filter((conversation) =>
    filter === "all" ? true : conversation.status === filter,
  );

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-300">
            Samiz Tech Engineering Ltd
          </p>
          <h1 className="mt-2 text-3xl font-bold">Customer Support Inbox</h1>
          <p className="mt-2 text-sm text-slate-300">
            Review customer messages and manage support conversations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="/admin"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:border-blue-400"
          >
            Admin dashboard
          </a>
          <a
            href="/admin/marketplace"
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-white hover:border-blue-400"
          >
            Marketplace
          </a>
          <button
            type="button"
            onClick={() => void loadConversations(false)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:border-blue-400"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Open", value: conversations.filter((item) => item.status === "open").length },
          { label: "Waiting", value: conversations.filter((item) => item.status === "waiting").length },
          { label: "Resolved", value: conversations.filter((item) => item.status === "resolved").length },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{item.label}</p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
          </div>
        ))}
      </section>

      {error && (
        <p role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-950 p-4 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="mt-6 grid min-h-[650px] gap-4 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.6fr)]">
        <aside className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <div className="border-b border-slate-700 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-bold">Conversations</h2>
              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                {visibleConversations.length}
              </span>
            </div>
            <label className="mt-3 block text-xs font-semibold text-slate-400" htmlFor="support-filter">
              Filter by status
            </label>
            <select
              id="support-filter"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="all">All conversations</option>
              <option value="open">Open</option>
              <option value="waiting">Waiting for visitor</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {loadingList ? (
            <p className="p-5 text-sm text-slate-400">Loading conversations…</p>
          ) : visibleConversations.length === 0 ? (
            <div className="p-5">
              <p className="text-sm font-semibold text-slate-200">No conversations found</p>
              <p className="mt-1 text-sm text-slate-400">
                New customer messages will appear here.
              </p>
            </div>
          ) : (
            <ul className="max-h-[680px] overflow-y-auto">
              {visibleConversations.map((conversation) => (
                <li key={conversation.id} className="border-b border-slate-800 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-slate-800 ${
                      selectedId === conversation.id ? "bg-slate-800 ring-1 ring-inset ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold text-white">
                        {conversation.visitor_name}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyle(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-400">{conversation.visitor_email}</p>
                    <p className="mt-2 truncate text-sm text-slate-200">
                      {conversation.subject || "Customer support"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Last activity: {formatDate(conversation.last_message_at)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center">
              <div>
                <h2 className="text-lg font-semibold">Select a conversation</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Choose a customer message from the list to view the thread.
                </p>
              </div>
            </div>
          ) : (
            <>
              <header className="border-b border-slate-700 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">{selected.visitor_name}</h2>
                    <a className="mt-1 block break-all text-sm text-blue-300 hover:underline" href={`mailto:${selected.visitor_email}`}>
                      {selected.visitor_email}
                    </a>
                    <p className="mt-2 text-sm text-slate-300">
                      {selected.subject || "Customer support"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Started {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="sm:w-52">
                    <label htmlFor="support-status" className="text-xs font-semibold text-slate-400">
                      Conversation status
                    </label>
                    <select
                      id="support-status"
                      value={selected.status}
                      disabled={changingStatus}
                      onChange={(event) => void changeStatus(event.target.value as Conversation["status"])}
                      className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-white disabled:opacity-60"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </header>

              {notice && (
                <p role="status" className="border-b border-slate-700 bg-slate-800 px-4 py-2 text-sm text-green-300">
                  {notice}
                </p>
              )}

              {threadError && (
                <p role="alert" className="border-b border-red-800 bg-red-950 px-4 py-3 text-sm text-red-200">
                  {threadError}
                </p>
              )}

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" aria-live="polite">
                {loadingThread && messages.length === 0 ? (
                  <p className="text-sm text-slate-400">Loading message thread…</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-slate-400">No messages in this conversation yet.</p>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-[92%] rounded-xl p-4 sm:max-w-[80%] ${
                        message.sender_type === "admin"
                          ? "ml-auto bg-blue-900 text-white"
                          : "mr-auto bg-slate-800 text-slate-100"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        <span className="font-bold">
                          {message.sender_type === "admin" ? (message.message.startsWith("[[SAMIZ_AI_REPLY]]\n") ? "Samiz AI Assistant" : "Samiz Support") : selected.visitor_name}
                        </span>
                        <time className="text-slate-300">{formatDate(message.created_at)}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{message.message.startsWith("[[SAMIZ_AI_REPLY]]\n") ? message.message.slice("[[SAMIZ_AI_REPLY]]\n".length) : message.message}</p>
                    </article>
                  ))
                )}
              </div>

              <form onSubmit={sendReply} className="border-t border-slate-700 p-4 sm:p-5">
                <label htmlFor="support-reply" className="text-sm font-semibold text-white">
                  Reply to customer
                </label>
                <textarea
                  id="support-reply"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={5000}
                  rows={4}
                  required
                  placeholder="Write a helpful reply…"
                  className="mt-2 w-full resize-y rounded-lg border border-slate-600 bg-slate-950 p-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-400">{draft.length}/5000 characters</p>
                  <button
                    type="submit"
                    disabled={sending || !draft.trim()}
                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? "Sending…" : "Send reply"}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </section>

      <p className="mt-4 text-xs text-slate-500">
        Conversations refresh every 15 seconds and the selected message thread refreshes every 10 seconds.
      </p>
    </main>
  );
}
