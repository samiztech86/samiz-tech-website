"use client";

import { useState, type FormEvent } from "react";

type FormStatus = "idle" | "submitting" | "success" | "error";

const fieldClass =
  "min-h-12 w-full rounded-none border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600";

export default function JoinTeamForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    setReference("");

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      fullName: String(data.get("fullName") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      location: String(data.get("location") ?? "").trim(),
      applicationType: String(data.get("applicationType") ?? ""),
      interestArea: String(data.get("interestArea") ?? ""),
      experience: String(data.get("experience") ?? "").trim(),
      portfolioUrl: String(data.get("portfolioUrl") ?? "").trim(),
      consent: data.get("consent") === "on",
      website: String(data.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/team-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        message?: string;
        error?: string;
        reference?: string;
      };

      if (!response.ok) {
        throw new Error(
          result.error || "We could not submit your application. Please try again.",
        );
      }

      setStatus("success");
      setMessage(
        result.message ||
          "Your expression of interest has been submitted successfully.",
      );
      setReference(result.reference || "");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Application details</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Fields marked with an asterisk are required.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="min-w-0">
          <label className={labelClass} htmlFor="team-full-name">
            Full name *
          </label>
          <input
            className={fieldClass}
            id="team-full-name"
            name="fullName"
            autoComplete="name"
            maxLength={120}
            required
            placeholder="Your full name"
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="team-email">
            Email address *
          </label>
          <input
            className={fieldClass}
            id="team-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
            placeholder="you@example.com"
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="team-phone">
            Phone / WhatsApp *
          </label>
          <input
            className={fieldClass}
            id="team-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            required
            placeholder="+234..."
          />
        </div>

        <div className="min-w-0">
          <label className={labelClass} htmlFor="team-location">
            Location
          </label>
          <input
            className={fieldClass}
            id="team-location"
            name="location"
            autoComplete="address-level2"
            maxLength={120}
            placeholder="City and state"
          />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="team-pathway">
          Preferred pathway *
        </label>
        <select
          className={fieldClass}
          id="team-pathway"
          name="applicationType"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select your preferred opportunity
          </option>
          <option value="employment_interest">
            Paid employment — future vacancies
          </option>
          <option value="project_collaboration">
            Paid project engagement — subject to confirmed funding and agreed terms
          </option>
          <option value="volunteer_collaboration">
            Volunteer collaboration — unpaid and optional
          </option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="team-interest">
          Area of interest *
        </label>
        <select
          className={fieldClass}
          id="team-interest"
          name="interestArea"
          required
          defaultValue=""
        >
          <option value="" disabled>
            Select your area
          </option>
          <option value="software_development">Software development</option>
          <option value="electrical_solar">
            Electrical engineering & solar
          </option>
          <option value="energyos_iot_automation">
            EnergyOS, IoT & automation
          </option>
          <option value="business_development_sales">
            Business development & sales
          </option>
          <option value="operations_field_support">
            Operations & field support
          </option>
          <option value="other">Other relevant skills</option>
        </select>
      </div>

      <div>
        <label className={labelClass} htmlFor="team-experience">
          Skills and relevant experience *
        </label>
        <textarea
          className={`${fieldClass} min-h-36 resize-y`}
          id="team-experience"
          name="experience"
          minLength={20}
          maxLength={5000}
          rows={6}
          required
          placeholder="Describe your skills, experience, tools you use and how you could contribute."
        />
      </div>

      <div>
        <label className={labelClass} htmlFor="team-portfolio">
          Portfolio, CV or LinkedIn URL (optional)
        </label>
        <input
          className={fieldClass}
          id="team-portfolio"
          name="portfolioUrl"
          type="url"
          maxLength={2048}
          placeholder="https://..."
        />
      </div>

      <div className="flex items-start gap-3">
        <input
          className="mt-1 h-5 w-5 shrink-0 accent-blue-700"
          id="team-consent"
          name="consent"
          type="checkbox"
          required
        />
        <label
          htmlFor="team-consent"
          className="text-sm leading-6 text-slate-600"
        >
          I confirm that the information provided is accurate and agree that
          Samiz Tech may use it to review this expression of interest and
          contact me about relevant opportunities. I understand the
          collaboration and payment conditions stated on this page. *
        </label>
      </div>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="team-website">Leave this field empty</label>
        <input
          id="team-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {message && (
        <div
          role={status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`border p-4 text-sm leading-6 ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-green-200 bg-green-50 text-green-800"
          }`}
        >
          <p>{message}</p>
          {status === "success" && reference && (
            <p className="mt-1 font-semibold">
              Reference: {reference}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex min-h-12 w-full items-center justify-center bg-blue-700 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {status === "submitting" ? "Submitting..." : "Submit Expression of Interest"}
      </button>

      <p className="text-xs leading-5 text-slate-500">
        Please do not submit confidential business information, passwords or
        sensitive personal documents through this form.
      </p>
    </form>
  );
}
