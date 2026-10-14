"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SupplierLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("confirmed") === "1") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Process the one-time email confirmation callback URL.
      setNotice(
        "Your email has been confirmed successfully. You can now sign in to your Samiz Tech Engineering Ltd supplier account. Supplier approval is a separate step."
      );
    }

    const callbackError = params.get("error");

    if (callbackError === "confirmation_failed") {
      setError(
        "Email confirmation could not be completed. Request a new confirmation email or try the link again."
      );
    } else if (callbackError === "missing_confirmation_code") {
      setError(
        "The confirmation link is incomplete. Open the full link from your confirmation email."
      );
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.replace("/marketplace/supplier/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-lg">
        <Link
          href="/marketplace"
          className="text-sm font-semibold text-blue-800 hover:underline"
        >
          ← Back to Marketplace
        </Link>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-800">
            Samiz Tech Marketplace
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Supplier sign-in
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Sign in with the email address and password used to register your
            supplier account. Email confirmation may be required.
          </p>

          {notice && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-600">
            New supplier?{" "}
            <Link
              href="/marketplace/supplier/register"
              className="font-semibold text-blue-800 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

