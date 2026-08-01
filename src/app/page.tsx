import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";

const services = [
  {
    number: "01",
    title: "Solar EPC",
    description:
      "Engineering, procurement and installation of dependable solar power systems for residential, commercial and industrial applications.",
  },
  {
    number: "02",
    title: "Electrical Engineering",
    description:
      "Electrical installation, distribution, maintenance, protection and infrastructure engineered for safety and reliability.",
  },
  {
    number: "03",
    title: "Energy Infrastructure",
    description:
      "Power systems, distribution networks, backup systems and facility infrastructure designed around real operating requirements.",
  },
  {
    number: "04",
    title: "Smart Automation",
    description:
      "Intelligent control and automation for buildings, estates, facilities and energy assets.",
  },
];

const applications = [
  "Residential",
  "Estates",
  "Commercial",
  "Industrial",
  "Schools",
  "Healthcare",
];

const process = [
  ["01", "Assess", "Understand the facility, load profile and operating requirements."],
  ["02", "Design", "Develop the electrical and energy architecture."],
  ["03", "Engineer", "Specify equipment, protection and system integration."],
  ["04", "Install", "Execute installation, testing and commissioning."],
  ["05", "Monitor", "Measure performance and improve the energy system."],
];

function GridDiagram() {
  return (
    <svg
      viewBox="0 0 760 520"
      className="h-full w-full"
      role="img"
      aria-label="33 kilovolt electrical distribution illustration"
    >
      <defs>
        <linearGradient id="poleGlow" x1="0" x2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        <filter id="glow">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity="0.16">
        <path
          d="M0 80H760M0 160H760M0 240H760M0 320H760M0 400H760M0 480H760"
          stroke="#94a3b8"
        />
        <path
          d="M80 0V520M160 0V520M240 0V520M320 0V520M400 0V520M480 0V520M560 0V520M640 0V520M720 0V520"
          stroke="#94a3b8"
        />
      </g>

      <text
        x="42"
        y="55"
        fill="#60a5fa"
        fontSize="16"
        fontWeight="700"
        letterSpacing="4"
      >
        DISTRIBUTION INFRASTRUCTURE
      </text>

      <text
        x="42"
        y="88"
        fill="#ffffff"
        fontSize="34"
        fontWeight="700"
      >
        33 kV POWER NETWORK
      </text>

      <g transform="translate(370 110)">
        <line
          x1="0"
          y1="30"
          x2="0"
          y2="350"
          stroke="url(#poleGlow)"
          strokeWidth="14"
        />

        <line
          x1="-135"
          y1="70"
          x2="135"
          y2="70"
          stroke="#dbeafe"
          strokeWidth="8"
        />

        <line
          x1="-105"
          y1="112"
          x2="105"
          y2="112"
          stroke="#94a3b8"
          strokeWidth="3"
        />

        <line
          x1="-135"
          y1="70"
          x2="-105"
          y2="112"
          stroke="#94a3b8"
          strokeWidth="3"
        />

        <line
          x1="135"
          y1="70"
          x2="105"
          y2="112"
          stroke="#94a3b8"
          strokeWidth="3"
        />

        <circle cx="-135" cy="70" r="10" fill="#60a5fa" filter="url(#glow)" />
        <circle cx="0" cy="70" r="10" fill="#60a5fa" filter="url(#glow)" />
        <circle cx="135" cy="70" r="10" fill="#60a5fa" filter="url(#glow)" />

        <path
          d="M-80 350L0 235L80 350"
          fill="none"
          stroke="#334155"
          strokeWidth="7"
        />

        <line
          x1="-80"
          y1="350"
          x2="80"
          y2="350"
          stroke="#334155"
          strokeWidth="7"
        />
      </g>

      <g transform="translate(535 210)">
        <rect
          x="0"
          y="0"
          width="175"
          height="95"
          rx="12"
          fill="#0f172a"
          stroke="#334155"
        />
        <text x="20" y="35" fill="#94a3b8" fontSize="12">
          NETWORK LEVEL
        </text>
        <text x="20" y="67" fill="#ffffff" fontSize="26" fontWeight="700">
          33 kV
        </text>
      </g>

      <g transform="translate(42 405)">
        <circle cx="8" cy="8" r="8" fill="#3b82f6" />
        <text x="28" y="14" fill="#cbd5e1" fontSize="14">
          Distribution • Protection • Reliability
        </text>
      </g>
    </svg>
  );
}

function PowerSystemDiagram() {
  return (
    <svg
      viewBox="0 0 1100 500"
      className="h-full w-full"
      role="img"
      aria-label="Electrical power system single line diagram"
    >
      <defs>
        <linearGradient id="energyLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id="renewableLine" x1="0" x2="1">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>

      <text
        x="40"
        y="38"
        fill="#64748b"
        fontSize="13"
        fontWeight="700"
        letterSpacing="3"
      >
        ENGINEERING SINGLE-LINE VIEW
      </text>

      {/* GRID */}
      <g transform="translate(40 125)">
        <rect
          width="160"
          height="120"
          rx="14"
          fill="#f8fafc"
          stroke="#cbd5e1"
        />

        <text x="24" y="35" fill="#64748b" fontSize="12">
          UTILITY SUPPLY
        </text>

        <text x="24" y="68" fill="#0f172a" fontSize="23" fontWeight="700">
          GRID
        </text>

        <text x="24" y="95" fill="#64748b" fontSize="12">
          33 kV / 11 kV
        </text>
      </g>

      {/* GRID TO TRANSFORMER */}
      <path
        d="M200 185 H300"
        stroke="url(#energyLine)"
        strokeWidth="5"
      />

      {/* TRANSFORMER */}
      <g transform="translate(300 125)">
        <rect
          width="180"
          height="120"
          rx="14"
          fill="#f8fafc"
          stroke="#cbd5e1"
        />

        <text x="24" y="35" fill="#64748b" fontSize="12">
          TRANSFORMATION
        </text>

        <text x="24" y="68" fill="#0f172a" fontSize="23" fontWeight="700">
          TX
        </text>

        <text x="24" y="95" fill="#64748b" fontSize="12">
          Voltage conversion
        </text>
      </g>

      {/* TRANSFORMER TO MAIN BUS */}
      <path
        d="M480 185 H590"
        stroke="url(#energyLine)"
        strokeWidth="5"
      />

      {/* MAIN DISTRIBUTION */}
      <g transform="translate(590 125)">
        <rect
          width="190"
          height="120"
          rx="14"
          fill="#eff6ff"
          stroke="#93c5fd"
        />

        <text x="24" y="35" fill="#2563eb" fontSize="12">
          MAIN DISTRIBUTION
        </text>

        <text x="24" y="68" fill="#0f172a" fontSize="23" fontWeight="700">
          MDB
        </text>

        <text x="24" y="95" fill="#64748b" fontSize="12">
          Protection & control
        </text>
      </g>

      {/* MDB TO LOAD */}
      <path
        d="M780 185 H880"
        stroke="url(#energyLine)"
        strokeWidth="5"
      />

      {/* FACILITY */}
      <g transform="translate(880 125)">
        <rect
          width="180"
          height="120"
          rx="14"
          fill="#f8fafc"
          stroke="#cbd5e1"
        />

        <text x="24" y="35" fill="#64748b" fontSize="12">
          CONSUMPTION
        </text>

        <text x="24" y="68" fill="#0f172a" fontSize="23" fontWeight="700">
          LOADS
        </text>

        <text x="24" y="95" fill="#64748b" fontSize="12">
          Facility & critical loads
        </text>
      </g>

      {/* ENERGY BUS */}
      <line
        x1="685"
        y1="245"
        x2="685"
        y2="325"
        stroke="#2563eb"
        strokeWidth="5"
      />

      <circle cx="685" cy="245" r="7" fill="#2563eb" />

      {/* SOLAR PV */}
      <g transform="translate(535 325)">
        <rect
          width="150"
          height="95"
          rx="14"
          fill="#ecfeff"
          stroke="#5eead4"
        />

        <text x="20" y="30" fill="#0f766e" fontSize="11" fontWeight="700">
          GENERATION
        </text>

        <text x="20" y="58" fill="#0f172a" fontSize="20" fontWeight="700">
          SOLAR PV
        </text>

        <text x="20" y="79" fill="#64748b" fontSize="11">
          Renewable generation
        </text>
      </g>

      {/* SOLAR TO BUS */}
      <path
        d="M610 325 V275 H685"
        fill="none"
        stroke="url(#renewableLine)"
        strokeWidth="4"
        strokeDasharray="7 6"
      />

      {/* BATTERY */}
      <g transform="translate(715 325)">
        <rect
          width="150"
          height="95"
          rx="14"
          fill="#f0fdf4"
          stroke="#86efac"
        />

        <text x="20" y="30" fill="#15803d" fontSize="11" fontWeight="700">
          STORAGE
        </text>

        <text x="20" y="58" fill="#0f172a" fontSize="20" fontWeight="700">
          BATTERY
        </text>

        <text x="20" y="79" fill="#64748b" fontSize="11">
          Energy storage
        </text>
      </g>

      {/* BATTERY TO BUS */}
      <path
        d="M790 325 V275 H685"
        fill="none"
        stroke="#16a34a"
        strokeWidth="4"
        strokeDasharray="7 6"
      />

      {/* BUS LABEL */}
      <g transform="translate(565 270)">
        <rect
          width="240"
          height="34"
          rx="17"
          fill="#0f172a"
        />

        <text
          x="120"
          y="22"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="11"
          fontWeight="700"
          letterSpacing="1"
        >
          ENERGY MANAGEMENT BUS
        </text>
      </g>

      {/* LEGEND */}
      <g transform="translate(40 455)">
        <circle cx="6" cy="0" r="5" fill="#2563eb" />
        <text x="20" y="5" fill="#64748b" fontSize="12">
          Grid / distribution
        </text>

        <circle cx="170" cy="0" r="5" fill="#14b8a6" />
        <text x="184" y="5" fill="#64748b" fontSize="12">
          Renewable generation
        </text>

        <circle cx="390" cy="0" r="5" fill="#16a34a" />
        <text x="404" y="5" fill="#64748b" fontSize="12">
          Energy storage
        </text>
      </g>
    </svg>
  );
}

function EnergyOSDiagram() {
  return (
    <svg
      viewBox="0 0 1000 430"
      className="h-full w-full"
      role="img"
      aria-label="Samiz EnergyOS architecture diagram"
    >
      <defs>
        <linearGradient id="platform" x1="0" x2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>

      <text
        x="35"
        y="38"
        fill="#93c5fd"
        fontSize="13"
        fontWeight="700"
        letterSpacing="3"
      >
        SAMIZ ENERGYOS ARCHITECTURE
      </text>

      <text
        x="35"
        y="75"
        fill="#ffffff"
        fontSize="30"
        fontWeight="700"
      >
        From physical assets to intelligent decisions.
      </text>

      <g transform="translate(35 125)">
        {[
          ["01", "DEVICES", "Meters • Sensors • Controllers"],
          ["02", "GATEWAY", "Telemetry • Connectivity"],
          ["03", "ENERGYOS", "Data • Rules • Intelligence"],
          ["04", "INSIGHTS", "Monitor • Analyse • Act"],
        ].map(([num, title, description], index) => (
          <g key={title} transform={`translate(${index * 235} 0)`}>
            <rect
              width="205"
              height="150"
              rx="18"
              fill={index === 2 ? "url(#platform)" : "#111827"}
              stroke={index === 2 ? "#60a5fa" : "#334155"}
            />
            <text x="20" y="32" fill="#93c5fd" fontSize="12">
              {num}
            </text>
            <text
              x="20"
              y="70"
              fill="#ffffff"
              fontSize="20"
              fontWeight="700"
            >
              {title}
            </text>
            <text x="20" y="101" fill="#cbd5e1" fontSize="12">
              {description.split(" • ")[0]}
            </text>
            <text x="20" y="122" fill="#cbd5e1" fontSize="12">
              {description.split(" • ")[1] ?? ""}
            </text>
          </g>
        ))}
      </g>

      <g transform="translate(120 335)">
        <circle cx="0" cy="0" r="7" fill="#60a5fa" />
        <text x="20" y="5" fill="#cbd5e1" fontSize="13">
          Real-time telemetry
        </text>
      </g>

      <g transform="translate(390 335)">
        <circle cx="0" cy="0" r="7" fill="#60a5fa" />
        <text x="20" y="5" fill="#cbd5e1" fontSize="13">
          Energy analytics
        </text>
      </g>

      <g transform="translate(630 335)">
        <circle cx="0" cy="0" r="7" fill="#60a5fa" />
        <text x="20" y="5" fill="#cbd5e1" fontSize="13">
          Alerts & intelligence
        </text>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-950">

      <div className="fixed bottom-6 right-6 z-[100]">
        <WhatsAppButton
          label="Chat with us"
          className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-slate-200 hover:-translate-y-1"
        />
      </div>




      {/* HERO */}
      <section className="relative overflow-hidden bg-[#07111f]">
        <div className="absolute inset-0 opacity-[0.08]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-28">
          <div>
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Electrical • Energy • Technology
              </span>
            </div>

            <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] sm:text-5xl tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Engineering the infrastructure behind{" "}
              <span className="text-blue-400">reliable energy.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              Samiz Tech Engineering Ltd. delivers electrical, solar, automation and
              intelligent energy solutions for homes, estates, businesses and
              critical facilities.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="/contact"
                className="bg-blue-600 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Start a Project
              </a>

              <a
                href="/energyos"
                className="border border-slate-600 px-7 py-4 text-sm font-bold text-white transition hover:border-slate-400"
              >
                Explore EnergyOS
              </a>

              <WhatsAppButton
                label="WhatsApp"
                message="Hello Samiz Tech, I would like to discuss an energy/electrical project."
                className="border border-slate-600 px-5 py-3 text-sm font-bold text-white hover:border-[#25D366]"
              />
            </div>

            <div className="mt-12 grid max-w-xl grid-cols-3 border-t border-slate-700 pt-7">
              <div>
                <p className="text-2xl font-bold text-white">EPC</p>
                <p className="mt-1 text-xs text-slate-400">
                  Engineering & delivery
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">24/7</p>
                <p className="mt-1 text-xs text-slate-400">
                  Energy visibility
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">IoT</p>
                <p className="mt-1 text-xs text-slate-400">
                  Connected assets
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[300px] w-full min-w-0 sm:min-h-[380px] lg:min-h-[520px]">
            <GridDiagram />
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Core capabilities
              </p>
              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Built around engineering discipline.
              </h2>
            </div>

            <div className="grid border-t border-slate-200 sm:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.number}
                  className="border-b border-slate-200 p-7 sm:even:border-l"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-bold tracking-widest text-blue-600">
                      {service.number}
                    </span>
                    <span className="text-slate-300">↗</span>
                  </div>

                  <h3 className="mt-8 text-2xl font-bold text-slate-950">
                    {service.title}
                  </h3>

                  <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
                    {service.description}
                  </p>

                  <a
                    href={`https://wa.me/2348155721739?text=${encodeURIComponent(
                      `Hello Samiz Tech, I am interested in your ${service.title} services.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 hover:text-blue-900"
                  >
                    Discuss this service
                    <span>↗</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* POWER SYSTEM */}
      <section id="systems" className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              Power systems
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              From generation to distribution, every connection matters.
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              We approach energy infrastructure as a complete system — from
              incoming utility supply and transformation to renewable
              generation, storage, distribution and the final load.
            </p>
          </div>

          <div className="mt-16 overflow-hidden border border-slate-200 bg-white p-4 shadow-sm sm:p-8">
            <div className="min-w-[850px]">
              <PowerSystemDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ENERGYOS */}
      <section id="energyos" className="overflow-hidden bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-blue-500" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                  Samiz Technology
                </span>
              </div>

              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Energy infrastructure meets intelligence.
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                Samiz EnergyOS connects energy assets, telemetry and operational
                data into one intelligent platform for monitoring, analysis,
                control and decision-making.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Live energy monitoring",
                  "Asset and device visibility",
                  "Energy events and alerts",
                  "Intelligent insights",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-500 text-[10px] text-blue-400">
                      ✓
                    </span>
                    <span className="text-sm text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="/contact"
                className="mt-9 inline-block bg-blue-600 px-7 py-4 text-sm font-bold text-white hover:bg-blue-500"
              >
                Discover Samiz EnergyOS
              </a>
            </div>

            <div className="overflow-hidden border border-slate-700 bg-[#0b1628] p-5 sm:p-8">
              <EnergyOSDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* APPLICATIONS */}
      <section id="projects" className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Where we operate
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Solutions for real operating environments.
              </h2>
            </div>

            <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-3">
              {applications.map((application, index) => (
                <div
                  key={application}
                  className="border-b border-slate-200 p-7"
                >
                  <span className="text-xs font-bold text-blue-600">
                    0{index + 1}
                  </span>
                  <h3 className="mt-8 text-xl font-bold text-slate-950">
                    {application}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Energy & electrical infrastructure
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-slate-950">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
              Engineering process
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Designed. Engineered. Delivered.
            </h2>
          </div>

          <div className="mt-16 grid border-t border-slate-700 md:grid-cols-5">
            {process.map(([number, title, description]) => (
              <div
                key={number}
                className="border-b border-slate-700 p-6 md:border-b-0 md:border-r last:md:border-r-0"
              >
                <span className="text-xs font-bold text-blue-400">
                  {number}
                </span>

                <h3 className="mt-12 text-xl font-bold text-white">
                  {title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-slate-400">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT / CTA */}
      <section id="about" className="bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Samiz Tech Engineering Ltd
              </p>

              <h2 className="mt-4 max-w-[18rem] text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:max-w-none sm:text-6xl">
                Where Engineering Meets Energy.
              </h2>
            </div>

            <p className="max-w-xl text-lg leading-8 text-slate-600">
              We combine electrical engineering, renewable energy and
              intelligent technology to build infrastructure that performs in
              the real world — today and as your energy requirements evolve.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-slate-200 bg-blue-700">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
                Start a conversation
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Let&apos;s engineer your next energy system.
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20an%20energy%2Felectrical%20project."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-bold text-blue-700 transition hover:bg-slate-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.53 0 .2 5.33.2 11.88c0 2.09.55 4.13 1.59 5.93L.1 24l6.34-1.66a11.85 11.85 0 0 0 5.64 1.43h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.24-6.17-3.45-8.41ZM12.09 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.76.98 1-3.67-.23-.38a9.84 9.84 0 0 1-1.51-5.26C2.19 6.45 6.63 2 12.08 2c2.64 0 5.12 1.03 6.99 2.9a9.84 9.84 0 0 1 2.89 7c0 5.45-4.43 9.9-9.87 9.9Zm5.42-7.42c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.23-.65.08-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.67-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.68-1.63-.93-2.23-.25-.59-.5-.51-.68-.52h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.03-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
                  </svg>
                </span>
                WhatsApp Samiz Tech
              </a>

              <a
                href="mailto:info@samiztech.com"
                className="inline-flex items-center border border-blue-300 px-8 py-4 text-sm font-bold text-white transition hover:bg-blue-600"
              >
                Send an Email
              </a>
            </div>
          </div>
        </div>
      </section>



    </main>
  );
}














