"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

type NotificationsResponse = {
  notifications?: AdminNotification[];
  unreadCount?: number;
  error?: string;
};

function displayDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

export default function AdminNotificationCenter() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);
  const knownIds = useRef<Set<string>>(new Set());
  const baselineLoaded = useRef(false);
  const soundEnabledRef = useRef(false);
  const requestInProgress = useRef(false);

  const playTone = useCallback(() => {
    const context = audioContext.current;
    if (!context || context.state !== "running") return;

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.setValueAtTime(1174.66, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.35);
  }, []);

  const loadNotifications = useCallback(async () => {
    if (requestInProgress.current) return;
    requestInProgress.current = true;

    try {
      const response = await fetch("/api/admin/notifications", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      const payload = (await response.json()) as NotificationsResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Unable to load notifications.");
      }

      const items = Array.isArray(payload.notifications)
        ? payload.notifications
        : [];
      const nextIds = new Set(items.map((item) => item.id));
      const hasNew = baselineLoaded.current &&
        items.some((item) => !knownIds.current.has(item.id));

      knownIds.current = nextIds;
      baselineLoaded.current = true;
      setNotifications(items);
      setUnreadCount(
        typeof payload.unreadCount === "number" ? payload.unreadCount : 0,
      );
      setError("");

      if (hasNew && soundEnabledRef.current) playTone();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to load notifications.",
      );
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [playTone]);

  useEffect(() => {
    void loadNotifications();
    const timer = window.setInterval(() => {
      void loadNotifications();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    return () => {
      if (audioContext.current) {
        void audioContext.current.close();
        audioContext.current = null;
      }
    };
  }, []);

  const enableSound = useCallback(async () => {
    try {
      if (!window.AudioContext) {
        setError("This browser does not support notification sound.");
        return;
      }

      if (!audioContext.current) {
        audioContext.current = new window.AudioContext();
      }

      await audioContext.current.resume();
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      playTone();
      setError("");
    } catch {
      setError("Unable to enable sound. Check browser audio settings.");
    }
  }, [playTone]);

  const markRead = useCallback(async (id?: string) => {
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
        throw new Error(payload.error || "Unable to update notifications.");
      }

      await loadNotifications();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to update notifications.",
      );
    }
  }, [loadNotifications]);

  return (
    <section
      aria-labelledby="admin-notifications-heading"
      className="mt-6 rounded-2xl border border-blue-300/30 bg-[#0b2547] p-5 shadow-lg shadow-black/10"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="admin-notifications-heading" className="text-xl font-bold">
            Admin notifications
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex rounded-full bg-red-700 px-2.5 py-0.5 text-xs font-bold text-white">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-blue-100">
            Supplier registrations, product submissions and support activity.
            Refreshes every 15 seconds.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void enableSound()}
            className="rounded-lg border border-blue-200/50 px-3 py-2 text-sm font-semibold hover:bg-blue-800"
          >
            {soundEnabled ? "Sound enabled" : "Enable sound"}
          </button>
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="rounded-lg border border-blue-200/50 px-3 py-2 text-sm font-semibold hover:bg-blue-800"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void markRead()}
            disabled={unreadCount === 0}
            className="rounded-lg border border-blue-200/50 px-3 py-2 text-sm font-semibold hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-400/50 bg-red-950 p-3 text-sm text-red-100">
          {error}
        </p>
      )}

      <div className="mt-3 divide-y divide-blue-200/10">
        {loading && notifications.length === 0 ? (
          <p className="py-5 text-sm text-blue-100">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="py-5 text-sm text-blue-100">
            No notifications are available.
          </p>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between ${
                notification.read_at ? "opacity-75" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-white">
                    {notification.title}
                  </h3>
                  {!notification.read_at && (
                    <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs font-semibold text-white">
                      New
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-blue-100">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-blue-200/70">
                  {notification.event_type.replace(/_/g, " ")} |{" "}
                  {displayDate(notification.created_at)}
                </p>
              </div>

              {!notification.read_at && (
                <button
                  type="button"
                  onClick={() => void markRead(notification.id)}
                  className="shrink-0 self-start rounded-lg border border-blue-200/50 px-3 py-2 text-xs font-semibold hover:bg-blue-800"
                >
                  Mark read
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
