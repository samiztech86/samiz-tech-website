"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function SupplierRegisterPage() {
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("confirmed") === "1"
      ? "Your email confirmation link has been opened. You can now proceed to supplier sign-in once that page is available."
      : "";
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo:
            `${window.location.origin}/marketplace/supplier/auth/callback`,
          data: {
            full_name: fullName.trim(),
            business_name: businessName.trim(),
            business_address: businessAddress.trim(),
            website_url: websiteUrl.trim(),
            phone: phone.trim(),
            account_type: "marketplace_supplier",
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        setMessage(
          "Your account is signed in. Open your supplier dashboard to initialize your profile. Your account will remain pending until an administrator approves it.",
        );
      } else {
        setMessage(
          "Registration received. Check your email for the confirmation link. After confirming, sign in to open your supplier dashboard and initialize your pending supplier profile.",
        );
      }
    } catch {
      setError(
        "Registration could not be completed. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <div className="mx-auto max-w-xl">
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
            Register as a supplier
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Create your supplier account to begin the onboarding process.
            Supplier verification and product approval are separate steps;
            registration does not publish products.
          </p>

          {message && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-900"
            >
              {message}
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
              <label htmlFor="fullName" className="mb-2 block text-sm font-medium">
                Contact person&apos;s full name
              </label>
              <input
                id="fullName"
                name="fullName"
                autoComplete="name"
                required
                maxLength={120}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="mb-2 block text-sm font-medium"
              >
                Business or company name
              </label>
              <input
                id="businessName"
                name="businessName"
                autoComplete="organization"
                required
                maxLength={160}
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="businessAddress"
                className="mb-2 block text-sm font-medium"
              >
                Business address (optional)
              </label>
              <textarea
                id="businessAddress"
                name="businessAddress"
                autoComplete="street-address"
                maxLength={500}
                rows={3}
                value={businessAddress}
                onChange={(event) => setBusinessAddress(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="websiteUrl"
                className="mb-2 block text-sm font-medium"
              >
                Business website (optional)
              </label>
              <input
                id="websiteUrl"
                name="websiteUrl"
                type="url"
                autoComplete="url"
                maxLength={500}
                placeholder="https://example.com"
                value={websiteUrl}
                onChange={(event) => setWebsiteUrl(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                Business phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={40}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Business email address
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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Use at least 8 characters.
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create supplier account"}
            </button>
          </form>

          <p className="mt-6 text-sm leading-6 text-slate-600">
            Already registered? Sign in to your supplier account, or return to the{" "}
            <Link
              href="/marketplace"
              className="font-semibold text-blue-800 hover:underline"
            >
              marketplace
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}

