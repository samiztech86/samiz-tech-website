
import Image from "next/image";
import type { Metadata } from "next";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "Power & Energy Systems Engineering Company in Lagos | Samiz Tech",
  description:
    "Samiz Tech Engineering designs and delivers power distribution, solar and battery storage, backup power, changeover, automation and energy monitoring systems for commercial, estate, industrial and institutional facilities.",
  keywords: [
    "power systems engineering Lagos",
    "power systems engineering company Nigeria",
    "power distribution contractor Lagos",
    "power distribution systems Nigeria",
    "electrical infrastructure contractor Lagos",
    "electrical power systems Nigeria",
    "solar and battery storage Lagos",
    "commercial solar and battery systems Lagos",
    "backup power systems Lagos",
    "automatic changeover installation Lagos",
    "generator integration Lagos",
    "inverter and battery installation Lagos",
    "commercial power systems Nigeria",
    "industrial power systems Nigeria",
    "estate power infrastructure Lagos",
    "energy monitoring systems Lagos",
    "building automation Lagos",
    "electrical protection systems Lagos",
    "Samiz Tech Engineering Ltd.",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/systems",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/systems",
    title: "Power & Energy Systems Engineering Company in Lagos | Samiz Tech",
    description:
      "Power distribution, solar and battery storage, backup power, changeover, automation and energy monitoring systems for commercial, estate, industrial and institutional facilities.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Power & Energy Systems Engineering Company in Lagos | Samiz Tech",
    description:
      "Engineering power distribution, solar and storage, backup power, automation and energy monitoring systems across Lagos and Nigeria.",
  },
};

const systems = [
  {
    number: "01",
    title: "Power Distribution Systems",
    description:
      "Electrical distribution infrastructure planned around the facility's supply, connected loads, operating requirements and future expansion.",
    scope: [
      "Main and sub-distribution",
      "Distribution boards and switchgear",
      "Load assessment",
      "Electrical protection coordination",
    ],
    image: "/images/engineering/power-distribution-infrastructure.jpg",
    alt: "Power distribution infrastructure",
  },
  {
    number: "02",
    title: "Solar & Energy Storage",
    description:
      "Solar generation and battery storage integrated with the site's demand, existing supply and required backup strategy.",
    scope: [
      "Solar PV system design",
      "Hybrid inverter integration",
      "Battery energy storage",
      "System sizing and commissioning",
    ],
    image: "/images/engineering/engineering-solar-installation-01.jpg",
    alt: "Solar installation",
  },
  {
    number: "03",
    title: "Backup & Changeover Systems",
    description:
      "Power continuity solutions that coordinate available sources and support safe transitions between utility, generator and inverter supply.",
    scope: [
      "Automatic changeover",
      "Generator integration",
      "Inverter and backup integration",
      "Source selection and control",
    ],
    image: "/images/engineering/engineering-electrical-installation-02.jpg",
    alt: "Electrical installation and power infrastructure",
  },
  {
    number: "04",
    title: "Automation & Energy Monitoring",
    description:
      "Control and monitoring capabilities that help operators understand system conditions, manage equipment and make informed energy decisions.",
    scope: [
      "Equipment control",
      "Energy monitoring",
      "Smart changeover concepts",
      "Intelligent energy management",
    ],
    image: "/images/engineering/engineering-electrical-installation-04.jpg",
    alt: "Electrical engineering installation",
  },
];

export default function SystemsPage() {
  return (
    <main className="bg-white text-slate-950">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#07111f] text-white">
        <div className="absolute inset-0">
          <Image
            src="/images/engineering/power-distribution-infrastructure.jpg"
            alt="Electrical power infrastructure"
            fill
            priority
            className="object-cover opacity-30"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111f] via-[#07111f]/90 to-[#07111f]/55" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-6 py-24 sm:py-32 lg:px-10 lg:py-36">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-300">
            Systems Engineering
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Power and energy systems engineered to work together.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            We approach electrical infrastructure, generation, storage,
            backup and intelligent control as connected parts of a complete
            operating system for your facility.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <a
              href="https://tinyurl.com/4r2re2xm"
              className="inline-flex items-center bg-blue-600 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Discuss Your System
            </a>

            <a
              href="#system-types"
              className="inline-flex items-center border border-white/30 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Explore Systems
            </a>
          </div>
        </div>
      </section>

      {/* ENGINEERING APPROACH */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              Our approach
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Design the connections, not just the components.
            </h2>
          </div>

          <div className="space-y-5 text-base leading-7 text-slate-600">
            <p>
              A reliable installation depends on how the supply, distribution,
              protection, generation, storage and connected loads work
              together. Decisions about one part of the system affect the
              performance and safety of the others.
            </p>

            <p>
              Samiz Tech considers the facility's operating requirements,
              power demand, available supply and backup expectations when
              developing an engineering approach. The scope of each project
              is established around its actual requirements.
            </p>
          </div>
        </div>
      </section>

      {/* SYSTEM TYPES */}
      <section id="system-types" className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
              System capabilities
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              The systems behind dependable energy.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
              Explore our core engineering areas. Project scope depends on
              site conditions, technical requirements and the agreed design.
            </p>
          </div>

          <div className="mt-12 grid gap-7 md:grid-cols-2">
            {systems.map((system) => (
              <article
                key={system.number}
                className="overflow-hidden border border-slate-200 bg-white"
              >
                <div className="relative h-64 sm:h-80">
                  <Image
                    src={system.image}
                    alt={system.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/75 via-transparent to-transparent" />

                  <span className="absolute bottom-5 left-6 text-sm font-bold tracking-[0.2em] text-blue-300">
                    SYSTEM {system.number}
                  </span>
                </div>

                <div className="p-6 sm:p-8">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {system.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    {system.description}
                  </p>

                  <div className="mt-6 border-t border-slate-200 pt-5">
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                      Engineering scope
                    </p>

                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {system.scope.map((item) => (
                        <li
                          key={item}
                          className="flex gap-3 text-sm leading-6 text-slate-700"
                        >
                          <span className="font-bold text-blue-600">+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="https://tinyurl.com/4r2re2xm"
                    className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition hover:text-blue-900"
                  >
                    Discuss this system <span>↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* INTEGRATED ENERGY MANAGEMENT */}
      <section className="bg-[#07111f] text-white">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-6 py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              Connected engineering
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Bring system visibility and intelligent control into the picture.
            </h2>

            <p className="mt-6 text-base leading-7 text-slate-300">
              Electrical and energy infrastructure can be complemented by
              monitoring, connected devices and intelligent energy management.
              Samiz Tech's EnergyOS is our technology direction for bringing
              energy assets and operational data into a shared platform.
            </p>

            <a
              href="/energyos"
              className="mt-8 inline-flex items-center gap-2 border border-blue-400 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-600"
            >
              Explore EnergyOS <span>↗</span>
            </a>
          </div>

          <div className="border border-white/15 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">
              An integrated view
            </p>

            <div className="mt-6 space-y-3">
              {[
                ["01", "Power supply", "Utility and available generation"],
                ["02", "Electrical systems", "Distribution and protection"],
                ["03", "Energy assets", "Solar, storage and backup"],
                ["04", "Monitoring & control", "Data, visibility and automation"],
              ].map(([number, title, description]) => (
                <div
                  key={number}
                  className="flex gap-4 border-t border-white/15 py-4"
                >
                  <span className="text-xs font-bold text-blue-300">
                    {number}
                  </span>

                  <div>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROJECT ENQUIRY */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                Start with your requirements
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                What does your facility need its power system to do?
              </h2>

              <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
                Tell us about your facility, power requirements and project
                objectives so we can discuss the appropriate engineering scope.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <a
                href="https://tinyurl.com/4r2re2xm"
                className="inline-flex items-center bg-slate-950 px-6 py-4 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                Project Enquiry
              </a>

              <WhatsAppButton />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}




