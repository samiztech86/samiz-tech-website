import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";

const capabilities = [
  {
    number: "01",
    title: "Energy Monitoring",
    description:
      "See how power is being generated, distributed, stored and consumed across connected facilities.",
  },
  {
    number: "02",
    title: "Smart Distribution",
    description:
      "Build visibility around electrical assets, distribution systems, circuits and critical loads.",
  },
  {
    number: "03",
    title: "Estate Energy Management",
    description:
      "Manage estate energy infrastructure, common areas, consumption and internal electricity operations.",
  },
  {
    number: "04",
    title: "Intelligent Insights",
    description:
      "Turn operational energy data into useful information for better decisions, maintenance and efficiency.",
  },
];

export default function EnergyOSPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 lg:px-10">
          <a href="/">
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
              href="/#systems"
              className="text-sm font-medium text-slate-600 hover:text-blue-700"
            >
              Systems
            </a>

            <a
              href="/energyos"
              className="text-sm font-semibold text-blue-700"
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
              className="bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Start a Project
            </a>
          </nav>

          <a
            href="/contact"
            className="bg-slate-950 px-4 py-2.5 text-xs font-bold text-white lg:hidden"
          >
            Contact
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="overflow-hidden bg-[#06111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-12 bg-blue-500" />

                <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                  Samiz EnergyOS
                </span>
              </div>

              <h1 className="max-w-4xl text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                Your energy infrastructure.
                <br />
                <span className="text-blue-400">
                  One intelligent operating system.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                Samiz EnergyOS is being built to bring energy assets,
                electrical infrastructure, telemetry, consumption and
                operational intelligence into one connected platform.
              </p>

              <div className="mt-9 flex flex-wrap gap-4">
                <a
                  href="#platform"
                  className="bg-blue-600 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
                >
                  Explore the Platform
                </a>

                <WhatsAppButton
                  label="Talk to Samiz Tech"
                  message="Hello Samiz Tech, I would like to learn more about Samiz EnergyOS."
                  className="border border-slate-600 px-5 py-3 text-sm font-bold text-white hover:border-[#25D366]"
                />
              </div>
            </div>

            {/* ENERGYOS SYSTEM VISUAL */}
            <div className="relative">
              <div className="absolute -inset-10 bg-blue-500/10 blur-3xl" />

              <div className="relative border border-slate-700 bg-slate-900/80 p-5 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
                      EnergyOS
                    </p>

                    <p className="mt-1 text-sm font-semibold text-white">
                      Energy Operations
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      System Online
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="border border-slate-700 bg-slate-950 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Current Power
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      1.04
                      <span className="ml-1 text-sm text-slate-500">
                        kW
                      </span>
                    </p>
                  </div>

                  <div className="border border-slate-700 bg-slate-950 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Solar
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      900
                      <span className="ml-1 text-sm text-slate-500">
                        W
                      </span>
                    </p>
                  </div>

                  <div className="border border-slate-700 bg-slate-950 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Battery
                    </p>
                    <p className="mt-2 text-2xl font-bold text-white">
                      85
                      <span className="ml-1 text-sm text-slate-500">
                        %
                      </span>
                    </p>
                  </div>

                  <div className="border border-slate-700 bg-slate-950 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Grid
                    </p>
                    <p className="mt-2 text-2xl font-bold text-emerald-400">
                      Available
                    </p>
                  </div>
                </div>

                <div className="mt-3 border border-slate-700 bg-slate-950 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      Energy Flow
                    </p>

                    <p className="text-[10px] font-bold text-blue-400">
                      LIVE
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-2">
                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-600 text-xs font-bold text-white">
                        PV
                      </div>
                      <p className="mt-2 text-[9px] text-slate-500">
                        SOLAR
                      </p>
                    </div>

                    <div className="h-px flex-1 bg-blue-500" />

                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-blue-500 bg-blue-500/10 text-xs font-bold text-white">
                        EMS
                      </div>
                      <p className="mt-2 text-[9px] text-blue-400">
                        ENERGYOS
                      </p>
                    </div>

                    <div className="h-px flex-1 bg-blue-500" />

                    <div className="text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center border border-slate-600 text-xs font-bold text-white">
                        LOAD
                      </div>
                      <p className="mt-2 text-[9px] text-slate-500">
                        FACILITY
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM INTRO */}
      <section id="platform">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Beyond monitoring
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Energy infrastructure needs an operating layer.
              </h2>
            </div>

            <div className="text-lg leading-8 text-slate-600">
              <p>
                Traditional energy systems often operate as disconnected
                equipment: meters, inverters, generators, batteries,
                distribution boards and maintenance records.
              </p>

              <p className="mt-6">
                EnergyOS is designed to bring those systems together so
                operators can understand what is happening across their
                infrastructure and make better operational decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              Platform capabilities
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Built around the energy system.
            </h2>
          </div>

          <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2">
            {capabilities.map((capability) => (
              <article
                key={capability.number}
                className="bg-white p-8 transition hover:bg-slate-50 lg:p-10"
              >
                <span className="text-sm font-bold tracking-widest text-blue-600">
                  {capability.number}
                </span>

                <h3 className="mt-7 text-2xl font-bold">
                  {capability.title}
                </h3>

                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  {capability.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE */}
      <section className="bg-[#07111f] text-white">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Platform architecture
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                From physical infrastructure to actionable intelligence.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                EnergyOS connects the physical energy environment to a
                software layer that can collect telemetry, organize assets,
                surface events and support intelligent operational decisions.
              </p>
            </div>

            <div className="border border-slate-700 bg-slate-900 p-6 lg:p-10">
              <div className="grid gap-3">
                {[
                  ["01", "ENERGY ASSETS", "Solar • Generator • Grid • Battery"],
                  ["02", "DEVICES", "Meters • Sensors • Controllers"],
                  ["03", "TELEMETRY", "Voltage • Current • Power • Energy"],
                  ["04", "ENERGYOS", "Monitoring • Events • Insights"],
                  ["05", "OPERATIONS", "Decisions • Maintenance • Optimisation"],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="grid gap-4 border border-slate-700 bg-slate-950 p-5 sm:grid-cols-[50px_180px_1fr] sm:items-center"
                  >
                    <span className="text-xs font-bold text-blue-400">
                      {number}
                    </span>

                    <span className="text-xs font-bold tracking-wider text-white">
                      {title}
                    </span>

                    <span className="text-sm text-slate-400">
                      {description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section>
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Designed for
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Different facilities. One energy operating model.
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Homes",
                "Estates",
                "Commercial Facilities",
                "Schools",
                "Hospitals",
                "Factories",
                "Offices",
                "Energy Infrastructure",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-slate-200 p-5 text-sm font-semibold text-slate-800"
                >
                  <span className="mr-3 text-blue-600">+</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCT STATUS / CTA */}
      <section className="bg-blue-700">
        <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
          <div className="max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">
              The Samiz EnergyOS vision
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              We are building the operating system for modern energy
              infrastructure.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100">
              EnergyOS is evolving from energy monitoring into a broader
              platform for intelligent energy management, automation,
              electricity operations and predictive insights.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <WhatsAppButton
                label="Talk to us about EnergyOS"
                message="Hello Samiz Tech, I would like to learn more about Samiz EnergyOS and how it can be applied to my facility."
                className="bg-white px-7 py-4 text-sm font-bold text-blue-700 hover:bg-slate-100"
              />

              <a
                href="/services"
                className="border border-blue-300 px-7 py-4 text-sm font-bold text-white hover:bg-blue-600"
              >
                Explore Engineering Services
              </a>
            </div>
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

              <a href="/projects" className="hover:text-white">
                Projects
              </a>

              <a href="/contact" className="hover:text-white">
                Contact
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
      <div className="fixed bottom-6 right-6 z-[100]">
        <WhatsAppButton
          label="Chat with us"
          className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-slate-900 shadow-2xl ring-1 ring-slate-200 hover:-translate-y-1"
        />
      </div>
    </main>
  );
}
