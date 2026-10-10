import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Energy & Engineering Resources | Samiz Tech",
  description:
    "Practical energy, electrical engineering, solar power and power systems resources from Samiz Tech Engineering Ltd.",
  keywords: [
    "solar energy Nigeria",
    "solar installation Nigeria",
    "electrical engineering Nigeria",
    "solar power Lagos",
    "energy management Nigeria",
    "solar battery systems",
    "electrical engineering resources",
    "energy efficiency Nigeria",
  ],
  alternates: {
    canonical: "https://www.samiztech.com.ng/resources",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/resources",
    title: "Energy & Engineering Resources | Samiz Tech",
    description:
      "Practical resources for solar power, electrical engineering, energy management and power systems.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
};

const resources = [
  {
    title: "How to Calculate Electrical Load for a Home",
    description:
      "Learn how to calculate household electrical load, understand connected load and estimate the power requirements for inverter, generator and solar systems.",
    href: "/resources/how-to-calculate-electrical-load",
    label: "Electrical Engineering",
  },
  {
    title: "How to Size an Inverter for Your Power Needs",
    description:
      "Learn how to choose the right inverter capacity using electrical load, starting power, surge requirements, power factor and system operating conditions.",
    href: "/resources/how-to-size-an-inverter",
    label: "Solar & Power Systems",
  },
  {
    title: "How Many Solar Panels Do You Need?",
    description:
      "Estimate the number of solar panels required using daily energy consumption, peak sun hours, panel wattage and system losses.",
    href: "/resources/how-many-solar-panels-do-you-need",
    label: "Solar & Power Systems",
  },
  {
    title: "How to Calculate Battery Capacity for an Inverter",
    description:
      "Estimate inverter battery capacity using energy consumption, backup duration, battery voltage, depth of discharge and inverter efficiency.",
    href: "/resources/how-to-calculate-battery-capacity",
    label: "Solar & Power Systems",
  },
];

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-24">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
            Samiz Resources
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Practical knowledge for better energy decisions.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Explore practical resources covering solar power, electrical
            engineering, energy management and power systems for homes,
            businesses, estates and industrial facilities.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {resources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className="group border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                {resource.label}
              </p>

              <h2 className="mt-3 text-2xl font-bold text-slate-950 group-hover:text-blue-700">
                {resource.title}
              </h2>

              <p className="mt-4 text-sm leading-7 text-slate-600">
                {resource.description}
              </p>

              <span className="mt-6 inline-flex text-sm font-bold text-slate-950 group-hover:text-blue-700">
                Explore resource ?
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#07111f]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-400">
            Samiz Tech Engineering Ltd.
          </p>

          <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Engineering knowledge backed by practical field experience.
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Our resources are designed to help property owners, businesses,
            engineers and facility teams understand energy systems before
            making important power and infrastructure decisions.
          </p>
        </div>
      </section>
    </main>
  );
}





