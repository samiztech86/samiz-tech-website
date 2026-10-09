import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Calculate Electrical Load for a Home | Samiz Tech",
  description:
    "Learn how to calculate household electrical load, estimate total power demand, apply diversity, and choose the right inverter, generator or solar system.",
  keywords: [
    "how to calculate electrical load",
    "electrical load calculation",
    "home electrical load calculation",
    "inverter sizing Nigeria",
    "generator sizing Nigeria",
    "solar system sizing Nigeria",
    "electrical load calculation Nigeria",
  ],
  alternates: {
    canonical:
      "https://www.samiztech.com.ng/resources/how-to-calculate-electrical-load",
  },
  openGraph: {
    type: "article",
    url: "https://www.samiztech.com.ng/resources/how-to-calculate-electrical-load",
    title: "How to Calculate Electrical Load for a Home",
    description:
      "A practical guide to calculating household electrical load and estimating power requirements.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
};

export default function ElectricalLoadArticle() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          Electrical Engineering
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          How to Calculate Electrical Load for a Home
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-600">
          Before selecting an inverter, generator, battery bank or solar PV
          system, you need to understand how much electrical power your home
          actually requires. This guide explains a practical method for
          calculating household electrical load.
        </p>

        <div className="mt-10 border-l-4 border-blue-700 bg-slate-50 px-6 py-5">
          <p className="font-semibold text-slate-900">
            Quick principle:
          </p>
          <p className="mt-2 leading-7 text-slate-700">
            Electrical load is the amount of power demanded by the appliances
            and equipment operating on an electrical system at a particular
            time.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            What is electrical load?
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Electrical load refers to the power consumed by electrical
            equipment connected to a supply system. Common residential loads
            include lighting, televisions, refrigerators, fans, pumps,
            air-conditioners, pressing irons, washing machines and other
            appliances.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Load is commonly expressed in watts (W) or kilowatts (kW). For
            example, an appliance rated at 1,000 W has a nominal power demand
            of 1 kW while operating.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 1: List the appliances
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Start by making a list of the appliances and electrical equipment
            you expect to operate. Record the rated power of each appliance
            from its nameplate, manufacturer's specification or technical
            documentation.
          </p>

          <div className="mt-6 overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3">Appliance</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Power Each</th>
                  <th className="px-4 py-3">Total Power</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">LED lights</td>
                  <td className="px-4 py-3">10</td>
                  <td className="px-4 py-3">10 W</td>
                  <td className="px-4 py-3">100 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Television</td>
                  <td className="px-4 py-3">2</td>
                  <td className="px-4 py-3">120 W</td>
                  <td className="px-4 py-3">240 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Refrigerator</td>
                  <td className="px-4 py-3">1</td>
                  <td className="px-4 py-3">200 W</td>
                  <td className="px-4 py-3">200 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Standing fan</td>
                  <td className="px-4 py-3">3</td>
                  <td className="px-4 py-3">80 W</td>
                  <td className="px-4 py-3">240 W</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 2: Calculate the connected load
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Multiply the quantity of each appliance by its rated power, then
            add the results together.
          </p>

          <div className="mt-6 bg-slate-950 p-6 text-lg font-semibold text-white">
            Total Connected Load = Sum of All Appliance Loads
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            Using the example above, the connected load is 100 W + 240 W +
            200 W + 240 W = <strong>780 W</strong>.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 3: Consider which appliances run at the same time
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            The connected load is not always the same as the actual maximum
            demand. In a real home, many appliances are not operating
            simultaneously.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            For example, a pressing iron may be used for a short period while
            an air-conditioner, refrigerator, lights and television are
            operating. The design therefore needs to consider the expected
            simultaneous demand rather than simply adding every appliance
            rating without engineering judgement.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 4: Pay attention to starting loads
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Some equipment requires more power during startup than during
            normal operation. Motors and compressors are common examples.
            Refrigerators, water pumps and air-conditioners can therefore
            influence the required inverter or generator capacity.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            This is one reason why selecting a backup system based only on the
            total wattage printed on a simple appliance list can result in an
            undersized system.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Watts, kilowatts and energy consumption
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Power and energy are related but they are not the same thing.
            Power describes the rate at which electricity is being consumed,
            while energy describes consumption over time.
          </p>

          <div className="mt-6 bg-slate-50 p-6">
            <p className="font-bold text-slate-900">
              Energy (kWh) = Power (kW) × Operating Time (hours)
            </p>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            This distinction is particularly important when sizing batteries
            and solar PV systems because the system must satisfy both the
            instantaneous power requirement and the required energy
            consumption.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Use our Energy Calculator
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            If you want to calculate your own electrical load, you can use the
            Samiz Energy Calculator to estimate electrical loads, energy
            consumption and related system requirements.
          </p>

          <Link
            href="/energy-tools/calculator"
            className="mt-6 inline-flex bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Open Energy Calculator →
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            What happens after calculating the load?
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Once the electrical demand has been established, the result can
            be used as part of the engineering process for selecting an
            inverter, generator, solar PV array, battery capacity, cables,
            protective devices and other components.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            The final system should also consider operating patterns,
            equipment characteristics, installation conditions, safety
            requirements and applicable electrical standards.
          </p>
        </section>

        <section className="mt-14 border-t border-slate-200 pt-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
            Need Engineering Support?
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Get professional power-system guidance from Samiz Tech
          </h2>

          <p className="mt-4 max-w-2xl leading-8 text-slate-600">
            Samiz Tech Engineering provides electrical engineering, solar
            power, backup power and energy infrastructure services for homes,
            businesses, estates and other facilities.
          </p>

          <Link
            href="/contact"
            className="mt-6 inline-flex bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Discuss Your Power Project →
          </Link>
        </section>
      </article>
    </main>
  );
}
