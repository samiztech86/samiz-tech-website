import Image from "next/image";
import WhatsAppButton from "@/components/WhatsAppButton";

const projects = [
  {
    number: "01",
    category: "SOLAR & BACKUP POWER",
    title: "Integrated Solar Energy Systems",
    description:
      "Engineered solar and battery systems designed around the facility's actual load profile, operating requirements and backup expectations.",
    scope: [
      "Load assessment",
      "Solar PV design",
      "Inverter integration",
      "Battery storage",
      "Installation & commissioning",
    ],
    status: "ENERGY INFRASTRUCTURE",
  },
  {
    number: "02",
    category: "ELECTRICAL INFRASTRUCTURE",
    title: "Power Distribution Systems",
    description:
      "Electrical distribution infrastructure designed to provide safe, reliable and maintainable power throughout residential, commercial and institutional facilities.",
    scope: [
      "Distribution boards",
      "Cable sizing",
      "Protection systems",
      "Earthing",
      "Testing & commissioning",
    ],
    status: "ELECTRICAL ENGINEERING",
  },
  {
    number: "03",
    category: "SMART ENERGY",
    title: "Intelligent Energy Monitoring",
    description:
      "Connected monitoring infrastructure that provides visibility into power generation, consumption, equipment status and energy performance.",
    scope: [
      "Energy metering",
      "IoT connectivity",
      "Telemetry",
      "Remote monitoring",
      "Energy analytics",
    ],
    status: "SMART ENERGY",
  },
  {
    number: "04",
    category: "FACILITY SYSTEMS",
    title: "Integrated Energy Infrastructure",
    description:
      "Coordinated power systems combining utility supply, backup generation, solar, storage and facility loads into a more resilient energy architecture.",
    scope: [
      "Grid integration",
      "Generator systems",
      "Solar integration",
      "Automatic changeover",
      "Critical load management",
    ],
    status: "ENERGY MANAGEMENT",
  },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
{/* HERO */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-5xl">
            <div className="mb-7 flex items-center gap-3">
              <span className="h-px w-12 bg-blue-500" />

              <span className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Projects & Engineering
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Engineering energy systems that work in the{" "}
              <span className="text-blue-400">real world.</span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-300">
              From solar and backup power to electrical infrastructure and
              intelligent monitoring, Samiz Tech approaches every project as
              an integrated engineering system.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#projects"
                className="bg-blue-600 px-7 py-4 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                Explore Projects
              </a>

              <WhatsAppButton
                label="Discuss a Project"
                message="Hello Samiz Tech, I would like to discuss an engineering project."
                className="border border-slate-600 px-5 py-3 text-sm font-bold text-white hover:border-[#25D366]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section id="projects">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="mb-16 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
                Our work
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
                Built around the needs of each facility.
              </h2>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Every installation has different loads, operating conditions,
              infrastructure and reliability requirements. Our engineering
              process starts there.
            </p>
          </div>

          <div className="space-y-6">
            {projects.map((project) => (
              <article
                key={project.number}
                className="group overflow-hidden border border-slate-200 bg-white transition hover:border-blue-300 hover:shadow-xl"
              >
                <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
                  {/* PROJECT VISUAL */}
                  <div className="relative min-h-[330px] overflow-hidden bg-[#07111f]">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute left-[15%] top-[20%] h-px w-[70%] bg-blue-400" />
                      <div className="absolute left-[15%] top-[45%] h-px w-[70%] bg-blue-400" />
                      <div className="absolute left-[15%] top-[70%] h-px w-[70%] bg-blue-400" />

                      <div className="absolute left-[25%] top-[10%] h-[80%] w-px bg-blue-400" />
                      <div className="absolute left-[50%] top-[10%] h-[80%] w-px bg-blue-400" />
                      <div className="absolute left-[75%] top-[10%] h-[80%] w-px bg-blue-400" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center p-10">
                      <div className="relative w-full max-w-md">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="border border-blue-500/60 bg-blue-500/10 p-5 text-center">
                            <p className="text-[9px] font-bold tracking-widest text-blue-400">
                              SOURCE
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              GRID
                            </p>
                          </div>

                          <div className="flex items-center justify-center">
                            <span className="h-px w-full bg-blue-500/60" />
                          </div>

                          <div className="border border-slate-600 bg-slate-900 p-5 text-center">
                            <p className="text-[9px] font-bold tracking-widest text-slate-500">
                              CONTROL
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              MDB
                            </p>
                          </div>
                        </div>

                        <div className="mx-auto h-12 w-px bg-blue-500/60" />

                        <div className="grid grid-cols-3 gap-3">
                          <div className="border border-emerald-500/50 bg-emerald-500/10 p-5 text-center">
                            <p className="text-[9px] font-bold tracking-widest text-emerald-400">
                              GENERATION
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              SOLAR
                            </p>
                          </div>

                          <div className="border border-slate-600 bg-slate-900 p-5 text-center">
                            <p className="text-[9px] font-bold tracking-widest text-slate-500">
                              STORAGE
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              BESS
                            </p>
                          </div>

                          <div className="border border-slate-600 bg-slate-900 p-5 text-center">
                            <p className="text-[9px] font-bold tracking-widest text-slate-500">
                              LOAD
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              FACILITY
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute left-6 top-6">
                      <span className="text-sm font-bold tracking-[0.25em] text-blue-400">
                        {project.number}
                      </span>
                    </div>
                  </div>

                  {/* PROJECT INFORMATION */}
                  <div className="p-8 lg:p-12">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                      {project.category}
                    </p>

                    <h3 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                      {project.title}
                    </h3>

                    <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
                      {project.description}
                    </p>

                    <div className="mt-8">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                        Typical engineering scope
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {project.scope.map((item) => (
                          <div
                            key={item}
                            className="flex items-center gap-3 border-b border-slate-100 pb-3 text-sm text-slate-700"
                          >
                            <span className="text-blue-600">+</span>
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-9 flex flex-wrap items-center justify-between gap-5 border-t border-slate-200 pt-6">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        {project.status}
                      </span>

                      <WhatsAppButton
                        label="Discuss this project"
                        message={`Hello Samiz Tech, I am interested in a project similar to your ${project.title} work. I would like to discuss my requirements.`}
                        className="text-xs font-bold uppercase tracking-wider text-blue-700 hover:text-blue-900"
                      />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ENGINEERING PROCESS */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              Project process
            </p>

            <h2 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              From assessment to commissioning.
            </h2>
          </div>

          <div className="grid border border-slate-200 bg-white md:grid-cols-5">
            {[
              ["01", "ASSESS", "Understand the facility, loads and operating requirements."],
              ["02", "DESIGN", "Develop the appropriate electrical and energy architecture."],
              ["03", "ENGINEER", "Specify equipment, protection, controls and installation requirements."],
              ["04", "INSTALL", "Execute installation with testing, quality control and safety."],
              ["05", "COMMISSION", "Verify system performance and hand over the completed system."],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="border-b border-slate-200 p-7 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <span className="text-xs font-bold text-blue-600">
                  {number}
                </span>

                <h3 className="mt-5 text-sm font-bold tracking-wider">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ENERGYOS CONNECTION */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
                Engineering + Intelligence
              </p>

              <h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                The physical system is only the beginning.
              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
                Samiz Tech is developing EnergyOS to add an intelligent
                operating layer to the energy infrastructure we engineer.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <a
                href="/energyos"
                className="bg-blue-600 px-7 py-4 text-sm font-bold text-white hover:bg-blue-500"
              >
                Explore EnergyOS
              </a>

              <WhatsAppButton
                label="Discuss your system"
                message="Hello Samiz Tech, I would like to discuss an energy infrastructure project and learn how EnergyOS could fit into it."
                className="border border-slate-600 px-5 py-3 text-sm font-bold text-white hover:border-[#25D366]"
              />
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
                Have a project?
              </p>

              <h2 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Let's engineer the right energy solution for your facility.
              </h2>
            </div>

            <div className="flex flex-wrap gap-4">
              <WhatsAppButton
                label="Start on WhatsApp"
                message="Hello Samiz Tech, I would like to discuss a project. Please let me know how we can get started."
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


