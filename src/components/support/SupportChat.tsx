"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { usePathname } from "next/navigation";
import Image from "next/image";

type SupportMessage = {
  id: string;
  sender_type: "visitor" | "admin";
  message: string;
  created_at: string;
};

type Conversation = {
  id: string;
  status: string;
};

type SupportChatProps = {
  compact?: boolean;
};

function formatTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString("en-NG", {
        dateStyle: "short",
        timeStyle: "short",
      });
}

export default function SupportChat({
  compact = false,
}: SupportChatProps) {
  const pathname = usePathname();
const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [draft, setDraft] = useState("");
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState(!compact);

  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/support/conversations/${encodeURIComponent(conversationId)}`,
        {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "This conversation is not available in this browser. Start a new conversation to contact support."
            : payload.error || "Unable to load your messages.",
        );
      }

      if (Array.isArray(payload.messages)) {
        setMessages(payload.messages as SupportMessage[]);
      }

      if (payload.conversation) {
        setConversation(payload.conversation as Conversation);
      }

      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to load messages.",
      );
    }
  }, []);

  useEffect(() => {
    if (!conversation?.id) return;

    const conversationId = conversation.id;
    const timer = window.setInterval(() => {
      void loadMessages(conversationId);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [conversation?.id, loadMessages]);

  async function startConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const response = await fetch("/api/support/conversations", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message: draft,
          website: "",
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to start a conversation.");
      }

      const nextConversation = payload.conversation as Conversation;
      setConversation(nextConversation);
      setMessages([]);
      setDraft("");
      setNotice(
        payload.autoReplySent
          ? "Your message has been received. Samiz AI Assistant has replied below, and our support team can follow up here."
          : "Your message has been received. Our support team can reply here.",
      );
      await loadMessages(nextConversation.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to start a support conversation.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!conversation?.id || !draft.trim()) return;

    setSending(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/support/conversations/${encodeURIComponent(conversation.id)}`,
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: draft }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to send your message.");
      }

      setDraft("");
      if (payload.message) {
        setMessages((current) => {
          const next = payload.message as SupportMessage;
          return current.some((item) => item.id === next.id)
            ? current
            : [...current, next];
        });
      }

      await loadMessages(conversation.id);
      setNotice("Message sent.");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to send your message.",
      );
    } finally {
      setSending(false);
    }
  }

  const panelClass = compact
    ? "fixed bottom-3 left-3 z-[110] flex max-h-[calc(100dvh-1.5rem)] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:bottom-5 sm:left-5 sm:max-h-[calc(100dvh-2.5rem)]"
    : "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm";

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return null;
  }

  return (
    <section className={panelClass} aria-label="Samiz customer support">
      {compact ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center justify-between gap-3 bg-blue-800 px-5 py-4 text-left text-white"
          aria-expanded={expanded}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
              <Image
                src="/samiz-logo.png"
                alt="Samiz Tech logo"
                width={44}
                height={44}
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0">
              <span className="block text-base font-bold">Chat with Support</span>
              <span className="mt-1 block text-xs text-blue-100">
                Samiz Tech customer assistance
              </span>
            </span>
          </span>
          <span aria-hidden="true" className="text-xl">
            {expanded ? "−" : "+"}
          </span>
        </button>
      ) : (
        <div className="flex items-center gap-4 bg-blue-800 px-6 py-5 text-white sm:px-8">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
            <Image
              src="/samiz-logo.png"
              alt="Samiz Tech logo"
              width={56}
              height={56}
              className="h-full w-full object-contain"
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
              Samiz Tech Engineering Ltd.
            </p>
            <h2 className="mt-1 text-2xl font-bold">How can we help?</h2>
            <p className="mt-1 text-sm leading-6 text-blue-100">
              Send your question to our support team and follow replies here.
            </p>
          </div>
        </div>
      )}

      {(!compact || expanded) && (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          {conversation ? (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  Conversation
                </p>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-800">
                  {conversation.status}
                </span>
              </div>

              <div
                className="max-h-96 min-h-36 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-3"
                aria-live="polite"
                aria-label="Conversation messages"
              >
                {messages.length === 0 ? (
                  <p className="p-3 text-sm text-slate-500">
                    Loading your conversation…
                  </p>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-[90%] rounded-xl p-3 ${
                        message.sender_type === "visitor"
                          ? "ml-auto bg-blue-800 text-white"
                          : "mr-auto border border-slate-200 bg-white text-slate-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.sender_type === "admin" &&
                        message.message.startsWith("[[SAMIZ_AI_REPLY]]\n")
                          ? message.message.slice("[[SAMIZ_AI_REPLY]]\n".length)
                          : message.message}
                      </p>
                      <p
                        className={`mt-2 text-[11px] ${
                          message.sender_type === "visitor"
                            ? "text-blue-100"
                            : "text-slate-500"
                        }`}
                      >
                        {message.sender_type === "visitor"
                          ? "You"
                          : message.message.startsWith("[[SAMIZ_AI_REPLY]]\n")
                            ? "Samiz AI Assistant"
                            : "Samiz Support"}
                        {message.created_at
                          ? ` · ${formatTime(message.created_at)}`
                          : ""}
                      </p>
                    </article>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-slate-700">
                    Your message
                  </span>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    maxLength={5000}
                    required
                    rows={3}
                    placeholder="Type your reply…"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm !text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? "Sending…" : "Send message"}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={startConversation} className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                Tell us how to reach you and what you need help with.
              </p>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Full name
                </span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={120}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm !text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Email address
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm !text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  Subject <span className="font-normal text-slate-500">(optional)</span>
                </span>
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={200}
                  placeholder="e.g. Marketplace order or solar enquiry"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm !text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-slate-700">
                  How can we help?
                </span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={5000}
                  required
                  rows={4}
                  placeholder="Describe your question or issue…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm !text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !name.trim() || !email.trim() || !draft.trim()}
                className="w-full rounded-xl bg-blue-800 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending your request…" : "Start support conversation"}
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              {notice}
            </p>
          )}

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Please do not send passwords, payment card details, or other sensitive credentials in chat.
          </p>
        </div>
      )}
    </section>
  );
}
