"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function BuyerPasswordResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      const supabase = createSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const authError =
        url.searchParams.get("error_description") ||
        url.searchParams.get("error");

      if (authError) {
        if (active) {
          setError(
            "This reset link could not be validated. Request a new password-reset email and use its latest link.",
          );
        }
        return;
      }

      // createBrowserClient handles the PKCE code during initialization.
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (code) {
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());
      }

      if (!active) return;

      if (sessionError || !data.session) {
        setError(
          "A valid password-reset session was not found. Request a new reset email and open its link on this device.",
        );
        return;
      }

      setReady(true);
    }

    void prepareRecoverySession().catch(() => {
      if (active) {
        setError(
          "Unable to validate this reset link. Request a new password-reset email.",
        );
      }
    });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error(
          "Your reset session has expired. Request a new password-reset email.",
        );
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      setNotice("Your password has been updated. You can now sign in.");
      setPassword("");
      setConfirmPassword("");

      await supabase.auth.signOut();
      window.setTimeout(() => {
        router.replace("/marketplace/my-quotes");
      }, 1200);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update your password. Request a new reset link if necessary.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-lg">
        <Link
          href="/marketplace/my-quotes"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          &larr; Back to My Quote Requests
        </Link>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Samiz Tech Marketplace
          </p>
          <h1 className="mt-2 text-2xl font-bold">Reset your password</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enter a new password for your buyer account.
          </p>

          {error ? (
            <div
              className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              {error}
            </div>
          ) : null}

          {notice ? (
            <div
              className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
              role="status"
            >
              {notice}
            </div>
          ) : null}

          {ready ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="mb-1 block text-sm font-medium"
                >
                  New password
                </label>
                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="mb-1 block text-sm font-medium"
                >
                  Confirm new password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Updating password..." : "Update password"}
              </button>
            </form>
          ) : (
            <p className="mt-6 text-sm text-slate-600" role="status">
              {error
                ? "Use the link below to return and request another reset email."
                : "Validating your password-reset link..."}
            </p>
          )}

          <p className="mt-5 text-sm text-slate-600">
            Need another link?{" "}
            <Link
              href="/marketplace/my-quotes"
              className="font-semibold text-blue-800 underline"
            >
              Return to sign in
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
