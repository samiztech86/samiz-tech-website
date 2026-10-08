import Link from "next/link";

const tools = [
  {
    title: "Energy Calculator",
    description:
      "Estimate electrical loads, energy consumption, solar PV capacity, inverter size, battery capacity and generator requirements.",
    href: "/energy-tools/calculator",
    available: true,
  },
  {
    title: "Solar Calculator",
    description:
      "Calculate solar PV capacity and system requirements for your property.",
    href: "/energy-tools/solar",
    available: true,
  },
  {
    title: "Energy Consumption",
    description:
      "Identify what is consuming electricity, estimate energy usage, and understand where your electricity is being consumed.",
    href: "/energy-tools/consumption",
    available: true,
  },
  {
    title: "Generator Calculator",
    description:
      "Estimate generator capacity, runtime, fuel consumption and operating cost.",
    href: "/energy-tools/generator",
    available: true,
  },
  {
    title: "Load Analysis",
    description:
      "Analyze connected loads, critical loads and estimated energy demand.",
    href: "/energy-tools/load-analysis",
    available: true,
  },
];

export default function EnergyToolsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
            Samiz Energy Tools
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Practical engineering tools for better energy decisions.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Estimate electrical loads, energy consumption and system
            requirements before making an engineering or energy investment.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <div
              key={tool.title}
              className="flex flex-col border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-xl font-bold text-slate-950">
                    {tool.title}
                  </h2>

                  {!tool.available && (
                    <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Coming soon
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {tool.description}
                </p>
              </div>

              {tool.available ? (
                <Link
                  href={tool.href!}
                  className="mt-6 inline-flex items-center justify-center bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Open Calculator
                </Link>
              ) : (
                <div className="mt-6 border border-slate-200 px-5 py-3 text-center text-sm font-bold text-slate-400">
                  Coming Soon
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
