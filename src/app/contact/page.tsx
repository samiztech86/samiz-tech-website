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

  const submitToWhatsApp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const text = `Hello Samiz Tech,

I would like to discuss a project.

Name: ${name}
Company: ${company || "Not provided"}
Phone: ${phone}
Email: ${email || "Not provided"}
Service: ${service || "Not specified"}

Project details:
${message}`;

    window.open(
      `https://wa.me/2348155721739?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <a href="/" className="flex items-center">
            <Image
              src="/samiz-logo.png"
              alt="Samiz Tech Engineering"
              width={160}
              height={60}
              className="h-auto w-[100px] sm:w-[112px]"
            />
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            <a
              href="/services"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Services
            </a>

            <a
              href="/energyos"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              EnergyOS
            </a>

            <a
              href="/projects"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Projects
            </a>

            <a
              href="/about"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              About
            </a>

            <a
              href="/contact"
              className="bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
            >
              Start a Project
            </a>
          </nav>

          <a
            href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white lg:hidden"
          >
            WhatsApp
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-28">
          <div className="max-w-4xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />

              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Project Enquiry
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl">
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

              <form onSubmit={submitToWhatsApp} className="space-y-6">
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
                  className="w-full bg-blue-700 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-800 sm:w-auto"
                >
                  Send Project Enquiry via WhatsApp
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  Submitting this form will open WhatsApp with your project
                  details prepared for Samiz Tech.
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
                      href="mailto:info@samiztech.com"
                      className="mt-2 block text-lg font-semibold text-white hover:text-blue-400"
                    >
                      info@samiztech.com
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
      <footer className="bg-[#050b14] text-slate-400">
        <div className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <Image
                src="/samiz-logo.png"
                alt="Samiz Tech Engineering"
                width={160}
                height={60}
                className="h-auto w-[105px] brightness-0 invert"
              />

              <p className="mt-3 text-xs">
                Where Engineering Meets Energy.
              </p>
            </div>

            <div className="flex flex-wrap gap-5 text-xs">
              <a href="/" className="hover:text-white">
                Home
              </a>

              <a href="/services" className="hover:text-white">
                Services
              </a>

              <a href="/energyos" className="hover:text-white">
                EnergyOS
              </a>

              <a href="/projects" className="hover:text-white">
                Projects
              </a>

              <a href="/about" className="hover:text-white">
                About
              </a>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-800 pt-6 text-xs">
            © {new Date().getFullYear()} Samiz Tech Engineering Ltd. All rights
            reserved.
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a
        href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[100] rounded-full bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-2xl transition hover:-translate-y-1"
      >
        WhatsApp
      </a>
    </main>
  );
}
