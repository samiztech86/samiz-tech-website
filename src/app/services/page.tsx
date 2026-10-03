import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Electrical, Solar & Power Systems Engineering Services | Lagos",
  description:
    "Samiz Tech Engineering provides electrical installation, solar EPC, power distribution, backup power, automation and energy infrastructure services for estate, commercial, industrial and institutional projects in Lagos and Nigeria.",
  keywords: [
    "electrical engineering services Lagos",
    "electrical contractor Lagos",
    "electrical installation company Lagos",
    "commercial electrical contractor Lagos",
    "industrial electrical contractor Nigeria",
    "electrical infrastructure contractor Lagos",
    "solar EPC company Lagos",
    "commercial solar installation Lagos",
    "industrial solar installation Nigeria",
    "solar power installation Lagos",
    "power distribution contractor Lagos",
    "backup power systems Lagos",
    "solar battery storage Lagos",
    "estate electrical contractor Lagos",
    "estate solar installation Lagos",
    "electrical maintenance contractor Lagos",
    "smart building automation Lagos",
    "energy infrastructure contractor Nigeria",
    "Samiz Tech Engineering Ltd.",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/services",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/services",
    title: "Electrical, Solar & Power Systems Engineering Services | Samiz Tech",
    description:
      "Electrical installation, solar EPC, power distribution, backup power, automation and energy infrastructure for estate, commercial, industrial and institutional projects in Lagos and Nigeria.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Electrical, Solar & Power Systems Engineering Services | Samiz Tech",
    description:
      "Electrical installation, solar EPC, power distribution, backup power and energy infrastructure services for projects across Lagos and Nigeria.",
  },
};


const services = [
  {
    number: "01",
    title: "Solar EPC",
    short:
      "End-to-end solar power engineering, procurement and installation for dependable energy supply.",
    scope: [
      "Solar PV system design",
      "Hybrid inverter systems",
      "Battery energy storage",
      "Commercial & residential installations",
      "System sizing and load assessment",
      "Installation and commissioning",
    ],
    applications: "Homes • Estates • Offices • Schools • Commercial facilities",
  },
  {
    number: "02",
    title: "Electrical Engineering",
    short:
      "Electrical infrastructure engineered for safety, reliability, maintainability and long-term performance.",
    scope: [
      "Electrical installations",
      "Power distribution systems",
      "Load assessment and calculations",
      "Protection and distribution boards",
      "Earthing and lightning protection",
      "Electrical maintenance",
    ],
    applications: "Residential • Commercial • Industrial • Institutional",
  },
  {
    number: "03",
    title: "Energy Infrastructure",
    short:
      "Integrated power infrastructure connecting utility supply, generation, storage, distribution and loads.",
    scope: [
      "Power distribution infrastructure",
      "Generator integration",
      "Automatic changeover systems",
      "Backup power systems",
      "Energy audits",
      "Facility energy optimisation",
    ],
    applications: "Estates • Facilities • Factories • Hospitals • Businesses",
  },
  {
    number: "04",
    title: "Smart Automation",
    short:
      "Intelligent control systems that make buildings and energy infrastructure more responsive and efficient.",
    scope: [
      "Smart building automation",
      "Remote equipment control",
      "Smart lighting",
      "Energy monitoring",
      "IoT device integration",
      "Automated energy management",
    ],
    applications: "Smart homes • Offices • Estates • Facilities",
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
{/* HERO */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Engineering Services
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Engineering solutions for the way energy is{" "}
              <span className="text-blue-400">actually used.</span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              From electrical infrastructure and solar power to smart
              automation and intelligent energy management, Samiz Tech
              engineers complete energy systems around your operational needs.
            </p>

            <div className="mt-9">
              <WhatsAppButton
                label="Discuss your project"
                message="Hello Samiz Tech, I would like to discuss an engineering/energy project."
                className="bg-blue-600 px-7 py-4 text-sm font-bold text-white hover:bg-blue-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ENGINEERING SYSTEMS */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="grid overflow-hidden border border-slate-200 bg-white lg:grid-cols-[1.15fr_0.85fr]">

            <div className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[520px]">
              <Image
                src="/images/engineering/power-distribution-infrastructure.jpg"
                alt="Power distribution infrastructure engineered by Samiz Tech Engineering"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/80 via-[#07111f]/10 to-transparent" />

              <div className="absolute bottom-0 left-0 max-w-xl p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
                  Power Systems
                </p>

                <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl">
                  Engineering beyond the equipment.
                </h2>
              </div>
            </div>

            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Integrated Engineering
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Power infrastructure designed as one system.
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600">
                From incoming supply and distribution to protection, backup,
                renewable integration and commissioning, we design around how
                the facility actually operates.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Power distribution",
                  "Protection & safety",
                  "Solar & backup integration",
                  "Testing & commissioning",
                ].map((item) => (
                  <div
                    key={item}
                    className="border-t border-slate-200 pt-3 text-sm font-semibold text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="mb-16 max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              What we engineer
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Four capabilities. One engineering approach.
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {services.map((service) => (
              <article
                key={service.number}
                className="grid gap-10 py-14 lg:grid-cols-[100px_0.9fr_1fr]"
              >
                <div>
                  <span className="text-sm font-bold tracking-widest text-blue-600">
                    {service.number}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-bold tracking-tight">
                    {service.title}
                  </h3>

                  <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                    {service.short}
                  </p>

                  <div className="mt-7">
                    <WhatsAppButton
                      label={`Enquire about ${service.title}`}
                      message={`Hello Samiz Tech, I am interested in your ${service.title} services. I would like to discuss my project.`}
                      className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:text-blue-900"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Engineering scope
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {service.scope.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 border-b border-slate-100 pb-3 text-sm text-slate-700"
                      >
                        <span className="text-blue-600">+</span>
                        {item}
                      </div>
                    ))}
                  </div>

                  <div className="mt-7 border-l-2 border-blue-600 pl-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Typical applications
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {service.applications}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ENGINEERING PHILOSOPHY */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Our approach
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                We engineer the system, not just the equipment.
              </h2>
            </div>

            <div className="space-y-6 text-lg leading-8 text-slate-600">
              <p>
                Every project starts with understanding the facility, its
                energy profile, operational requirements and future needs.
              </p>

              <p>
                We then design the electrical and energy architecture around
                reliability, safety, efficiency and maintainability.
              </p>

              <p>
                Where appropriate, intelligent monitoring and automation can
                extend the system beyond installation into continuous
                operational visibility.
              </p>
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
                Start your project
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Tell us what you need to power, protect or automate.
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <WhatsAppButton
                label="WhatsApp Samiz Tech"
                message="Hello Samiz Tech, I would like to discuss a project. Please let me know how I can get started."
                className="bg-white px-7 py-4 text-sm font-bold text-blue-700 hover:bg-slate-100"
              />

              <a
                href="/contact"
                className="border border-blue-300 px-7 py-4 text-sm font-bold text-white hover:bg-blue-600"
              >
                Project Enquiry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
</main>
  );
}





