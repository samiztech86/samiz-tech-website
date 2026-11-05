"use client";

import Image from "next/image";
import { useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [message, setMessage] = useState("");

  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submissionError, setSubmissionError] = useState("");
  const [submittedEnquiry, setSubmittedEnquiry] = useState<{
    reference: string;
    details: {
      name: string;
      company: string;
      phone: string;
      email: string;
      service: string;
      message: string;
    };
  } | null>(null);

  const submitEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submissionStatus === "submitting") return;

    const details = { name, company, phone, email, service, message };

    setSubmissionStatus("submitting");
    setSubmissionError("");
    setSubmittedEnquiry(null);

    try {
      const response = await fetch("/api/contact-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...details, website: "" }),
      });

      const result: {
        success?: boolean;
        reference?: string;
        error?: string;
      } = await response.json().catch(() => ({}));

      if (!response.ok || !result.success || !result.reference) {
        throw new Error(
          result.error || "We could not submit your enquiry. Please try again.",
        );
      }

      setSubmittedEnquiry({
        reference: result.reference,
        details,
      });

      setName("");
      setCompany("");
      setPhone("");
      setEmail("");
      setService("");
      setMessage("");
      setSubmissionStatus("success");
    } catch (error) {
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "A connection error occurred. Please try again.",
      );
      setSubmissionStatus("error");
    }
  };

  const whatsappFollowUpUrl = (() => {
    if (!submittedEnquiry) return null;

    const { reference, details } = submittedEnquiry;

    const whatsappMessage = [
      "Hello Samiz Tech,",
      "",
      "I have submitted a project enquiry through your website.",
      `Enquiry reference: ${reference}`,
      "",
      `Name: ${details.name}`,
      `Company: ${details.company || "Not provided"}`,
      `Phone: ${details.phone}`,
      `Email: ${details.email || "Not provided"}`,
      `Service: ${details.service || "Not specified"}`,
      "",
      "Project details:",
      details.message,
    ].join("\n");

    return `https://wa.me/2348155721739?text=${encodeURIComponent(whatsappMessage)}`;
  })();

  return (
    <main className="min-h-screen bg-white text-slate-950">
{/* HERO */}
      <section className="relative overflow-hidden bg-[#07111f]">
        <div className="relative aspect-video w-full overflow-hidden lg:absolute lg:inset-0 lg:aspect-auto">
          <Image
            src="/images/engineering/engineering-solar-installation-02.png"
            alt="Electrical and solar engineering installation by Samiz Tech Engineering Ltd"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07111f]/20 to-[#07111f] lg:bg-gradient-to-r lg:from-[#020817]/90 lg:via-[#020817]/65 lg:to-[#020817]/35" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 py-12 sm:py-16 lg:px-10 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Project Enquiry
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Let's engineer your{" "}
              <span className="text-blue-400">energy solution.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Tell us what you are planning, what you need to improve, or what
              your facility requires. Our team can help you determine the
              appropriate engineering approach.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT AREA */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid gap-16 lg:grid-cols-[1.25fr_0.75fr]">
            {/* FORM */}
            <div>
              <div className="mb-9">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                  Tell us about your project
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                  Project enquiry
                </h2>
              </div>

              <form onSubmit={submitEnquiry} className="space-y-6" aria-busy={submissionStatus === "submitting"}>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-10000px] h-px w-px overflow-hidden"
                />
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Full name *
                    </label>

                    <input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-blue-600"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Company / Organisation
                    </label>

                    <input
                      id="company"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-blue-600"
                      placeholder="Company name"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Phone / WhatsApp *
                    </label>

                    <input
                      id="phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-blue-600"
                      placeholder="+234..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-blue-600"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="service"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    What do you need?
                  </label>

                  <select
                    id="service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-600"
                  >
                    <option value="">Select a service</option>
                    <option value="Solar EPC">Solar EPC</option>
                    <option value="Electrical Engineering">
                      Electrical Engineering
                    </option>
                    <option value="Backup Power">
                      Backup Power / Generator
                    </option>
                    <option value="Energy Storage">
                      Battery Energy Storage
                    </option>
                    <option value="Smart Automation">
                      Smart Automation
                    </option>
                    <option value="EnergyOS">
                      Samiz EnergyOS
                    </option>
                    <option value="Facility Maintenance">
                      Facility Maintenance
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Project details *
                  </label>

                  <textarea
                    id="message"
                    required
                    rows={7}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full resize-none border border-slate-300 px-4 py-3.5 text-sm outline-none transition focus:border-blue-600"
                    placeholder="Tell us about the facility, location, current power system, required capacity, problem you are trying to solve, or anything else that will help us understand the project."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submissionStatus === "submitting"}
                  className="w-full bg-blue-700 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {submissionStatus === "submitting"
                    ? "Submitting Enquiry..."
                    : "Submit Project Enquiry"}
                </button>

                {submissionStatus === "error" && (
                  <p role="alert" className="text-sm leading-6 text-red-700">
                    {submissionError}
                  </p>
                )}

                {submissionStatus === "success" && submittedEnquiry && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="space-y-3 border border-green-200 bg-green-50 p-5"
                  >
                    <p className="font-semibold text-green-900">
                      Your project enquiry has been received successfully.
                    </p>

                    <p className="text-sm text-green-900">
                      Reference:{" "}
                      <span className="font-bold break-all">
                        {submittedEnquiry.reference}
                      </span>
                    </p>

                    <p className="text-sm leading-6 text-green-800">
                      Our team can review your enquiry and contact you using
                      the details you provided.
                    </p>

                    {whatsappFollowUpUrl && (
                      <a
                        href={whatsappFollowUpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#20bd5a]"
                      >
                        Continue on WhatsApp (Optional)
                      </a>
                    )}
                  </div>
                )}

                <p className="text-xs leading-5 text-slate-500">
                  Your enquiry is submitted securely to Samiz Tech. You can
                  optionally continue the conversation on WhatsApp after
                  submission.
                </p>
              </form>
            </div>

            {/* DIRECT CONTACT */}
            <aside>
              <div className="bg-[#07111f] p-8 text-white lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                  Direct contact
                </p>

                <h2 className="mt-4 text-3xl font-bold">
                  Prefer to talk directly?
                </h2>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  Reach out directly and tell us what you need. We can continue
                  the conversation on WhatsApp.
                </p>

                <div className="mt-10 space-y-7">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      WhatsApp
                    </p>

                    <a
                      href="https://wa.me/2348155721739"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-lg font-semibold text-white hover:text-blue-400"
                    >
                      +234 815 572 1739
                    </a>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Email
                    </p>

                    <a
                      href="mailto:info@samiztech.com.ng"
                      className="mt-2 block text-lg font-semibold text-white hover:text-blue-400"
                    >
                      info@samiztech.com.ng
                    </a>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Location
                    </p>

                    <p className="mt-2 text-lg font-semibold text-white">
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>

                <a
                  href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-10 block bg-[#25D366] px-6 py-4 text-center text-sm font-bold text-white hover:bg-[#20bd5a]"
                >
                  Chat on WhatsApp
                </a>
              </div>

              {/* SERVICES */}
              <div className="mt-6 border border-slate-200 p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                  Engineering capabilities
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    "Solar EPC",
                    "Electrical Engineering",
                    "Backup Power",
                    "Battery Energy Storage",
                    "Smart Automation",
                    "Samiz EnergyOS",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 border-b border-slate-100 pb-4 text-sm font-medium"
                    >
                      <span className="text-blue-600">+</span>
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="/services"
                  className="mt-7 inline-block text-sm font-bold text-blue-700 hover:text-blue-900"
                >
                  View all services →
                </a>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* FOOTER */}
{/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project."
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:inline-flex fixed bottom-2 left-6 z-[100] rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:-translate-y-1"
      >
        WhatsApp
      </a>
    </main>
  );
}


