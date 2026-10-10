import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Samiz Tech Engineering Ltd | Electrical & Energy Company Lagos",
  description:
    "Samiz Tech Engineering Ltd is a Nigerian engineering company delivering electrical installations, solar EPC, power systems, energy infrastructure and automation for residential, commercial, estate and industrial projects.",
  keywords: [
    "Samiz Tech Engineering Ltd.",
    "Samiz Tech Engineering Ltd",
    "electrical engineering company Lagos",
    "electrical engineering company Nigeria",
    "electrical contractor Lagos",
    "solar EPC company Lagos",
    "energy infrastructure company Nigeria",
    "power systems engineering company Nigeria",
    "electrical installation company Lagos",
    "commercial electrical contractor Lagos",
    "industrial electrical contractor Nigeria",
    "estate electrical contractor Lagos",
    "engineering company Lagos",
    "engineering company Nigeria",
    "energy systems company Nigeria",
    "smart energy systems Nigeria",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/about",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/about",
    title: "About Samiz Tech Engineering Ltd | Electrical & Energy Company Lagos",
    description:
      "Learn about Samiz Tech Engineering Ltd and our approach to electrical installations, solar EPC, power systems, energy infrastructure and automation projects across Lagos and Nigeria.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Samiz Tech Engineering Ltd | Electrical & Energy Company Lagos",
    description:
      "Learn about Samiz Tech Engineering Ltd, our engineering capabilities and our approach to electrical, solar and energy infrastructure projects.",
  },
};

const principles = [
  {
    number: "01",
    title: "Engineering First",
    text: "We approach energy challenges from the fundamentals: loads, power quality, protection, reliability, safety and system performance.",
  },
  {
    number: "02",
    title: "Built for Reality",
    text: "Our solutions are designed around the conditions in which energy systems actually operate, not simply around equipment specifications.",
  },
  {
    number: "03",
    title: "Systems Thinking",
    text: "Solar, batteries, generators, electrical distribution and monitoring work together. We design with the complete system in mind.",
  },
  {
    number: "04",
    title: "Technology Enabled",
    text: "We are extending our engineering capability through connected devices, telemetry, automation and the Samiz EnergyOS platform.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
{/* HERO */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-5xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />

              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                About Samiz Tech
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Where engineering meets{" "}
              <span className="text-blue-400">energy.</span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
              Samiz Tech Engineering Ltd is an electrical and energy engineering
              company focused on designing, installing and improving the
              infrastructure that keeps homes, businesses and facilities
              powered.
            </p>
          </div>
        </div>
      </section>

      {/* COMPANY INTRO */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Who we are
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                An engineering company building for the future of energy.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-8 text-slate-600">
              <p>
                Samiz Tech Engineering Ltd works across electrical engineering,
                solar energy, backup power, smart infrastructure and energy
                management.
              </p>

              <p>
                Our work spans the complete journey from understanding a
                facility's electrical requirements to designing, installing,
                commissioning and maintaining the systems that support it.
              </p>

              <p>
                We believe the next generation of energy infrastructure will
                not only generate and distribute power. It will also measure,
                communicate, automate and continuously improve how that power
                is used.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
              <Image
                src="/images/founder/founder-bode-samuel-ogidiolu.jpg"
                alt="Engr. Bode Samuel Ogidiolu, Founder of Samiz Tech Engineering Ltd."
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Founder & Technical Lead
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Engineering with a practical understanding of energy systems.
              </h2>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Engr. Bode Samuel Ogidiolu founded Samiz Tech Engineering Ltd with a
                focus on electrical engineering, solar energy, power systems and
                the development of practical energy infrastructure.
              </p>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                His work combines hands-on engineering experience with a
                technology-driven approach to monitoring, automation and energy
                management.
              </p>

              <div className="mt-8 border-l-2 border-blue-600 pl-5">
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  Building reliable energy infrastructure today while
                  developing the intelligence needed to manage it tomorrow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

            <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 sm:aspect-[3/2] lg:aspect-[16/10]">
              <Image
                src="/images/team/team-electrical-engineer.jpg"
                alt="Samiz Tech Engineering Ltd team"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 65vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/55 via-transparent to-transparent" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Our Team
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Engineering is built by people who understand the work.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Samiz Tech brings together engineering, energy and technology
                capabilities focused on solving practical infrastructure
                challenges.
              </p>

              <p className="mt-5 text-lg leading-8 text-slate-600">
                From electrical installations and solar systems to automation,
                monitoring and energy management, our work is driven by a
                hands-on understanding of the systems we design and deliver.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["ELECTRICAL", "Power systems and infrastructure"],
                  ["ENERGY", "Solar, backup and storage"],
                  ["TECHNOLOGY", "Automation and intelligent systems"],
                ].map(([title, text]) => (
                  <div key={title} className="border-t-2 border-blue-600 pt-4">
                    <p className="text-xs font-bold tracking-[0.15em] text-slate-950">
                      {title}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ENGINEERING AREAS */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              What we do
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Engineering across the energy system.
            </h2>
          </div>

          <div className="grid gap-px border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["01", "SOLAR", "Solar PV systems, hybrid systems and battery energy storage."],
              ["02", "ELECTRICAL", "Electrical installation, distribution, protection and maintenance."],
              ["03", "POWER", "Backup power, generators, changeover and energy infrastructure."],
              ["04", "SMART SYSTEMS", "Automation, monitoring, IoT connectivity and intelligent energy management."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="bg-white p-8 lg:p-9"
              >
                <span className="text-xs font-bold tracking-widest text-blue-600">
                  {number}
                </span>

                <h3 className="mt-7 text-sm font-bold tracking-[0.15em]">
                  {title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRINCIPLES */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                How we work
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                The principles behind our engineering.
              </h2>
            </div>

            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {principles.map((principle) => (
                <div
                  key={principle.number}
                  className="grid gap-5 py-8 sm:grid-cols-[70px_220px_1fr]"
                >
                  <span className="text-sm font-bold text-blue-600">
                    {principle.number}
                  </span>

                  <h3 className="font-bold">
                    {principle.title}
                  </h3>

                  <p className="text-sm leading-7 text-slate-600">
                    {principle.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ENGINEERING TO ENERGYOS */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Our technology direction
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                From installing energy systems to understanding them.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Our engineering experience is shaping Samiz EnergyOS, a
                platform designed to connect energy infrastructure with
                real-time data, monitoring, intelligent insights and
                operational tools.
              </p>

              <div className="mt-8">
                <a
                  href="/energyos"
                  className="inline-block bg-blue-600 px-7 py-4 text-sm font-bold text-white hover:bg-blue-500"
                >
                  Discover EnergyOS
                </a>
              </div>
            </div>

            {/* SYSTEM DIAGRAM */}
            <div className="border border-slate-700 bg-slate-900 p-6 lg:p-10">
              <div className="space-y-3">
                <div className="border border-slate-700 bg-slate-950 p-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                    PHYSICAL INFRASTRUCTURE
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {["SOLAR", "GRID", "GENERATOR", "BATTERY", "LOADS"].map(
                      (item) => (
                        <span
                          key={item}
                          className="border border-slate-700 px-3 py-2 text-[10px] font-bold text-white"
                        >
                          {item}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex justify-center text-blue-500">
                  ↓
                </div>

                <div className="border border-blue-500/50 bg-blue-500/10 p-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-blue-400">
                    SAMIZ ENERGYOS
                  </p>

                  <p className="mt-2 text-lg font-bold text-white">
                    Energy Operating Layer
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["TELEMETRY", "EVENTS", "MONITORING", "INSIGHTS"].map(
                      (item) => (
                        <span
                          key={item}
                          className="border border-blue-500/30 px-3 py-2 text-center text-[9px] font-bold text-blue-200"
                        >
                          {item}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex justify-center text-blue-500">
                  ↓
                </div>

                <div className="border border-slate-700 bg-slate-950 p-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                    OPERATIONS
                  </p>

                  <p className="mt-2 text-sm font-semibold text-white">
                    Better decisions • Better maintenance • Better energy
                    performance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-700">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
                Work with Samiz Tech
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Have an energy or electrical engineering challenge?
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <WhatsAppButton
                label="Talk to Samiz Tech"
                message="Hello Samiz Tech, I would like to discuss an electrical or energy engineering project."
                className="bg-white px-7 py-4 text-sm font-bold text-blue-700 hover:bg-slate-100"
              />

              <a
                href="/services"
                className="border border-blue-300 px-7 py-4 text-sm font-bold text-white hover:bg-blue-600"
              >
                View Services
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
{/* FLOATING WHATSAPP */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <WhatsAppButton
          label="Chat with us"
          className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-slate-200 hover:-translate-y-1"
        />
      </div>
    </main>
  );
}
