import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How to Size an Inverter for Your Power Needs | Samiz Tech",
  description:
    "Learn how to size an inverter correctly using electrical load, starting power, continuous demand and system requirements.",
  keywords: [
    "how to size an inverter",
    "inverter sizing",
    "inverter size calculator",
    "inverter sizing Nigeria",
    "how many kVA inverter do I need",
    "solar inverter sizing",
    "home inverter sizing",
  ],
  alternates: {
    canonical:
      "https://www.samiztech.com.ng/resources/how-to-size-an-inverter",
  },
  openGraph: {
    type: "article",
    url: "https://www.samiztech.com.ng/resources/how-to-size-an-inverter",
    title: "How to Size an Inverter for Your Power Needs",
    description:
      "A practical guide to choosing an inverter based on electrical load, starting power and operating requirements.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
};

export default function InverterSizingArticle() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          Solar & Power Systems
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          How to Size an Inverter for Your Power Needs
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-600">
          Choosing the right inverter is important for a reliable backup power
          or solar system. An undersized inverter can overload or shut down,
          while an unnecessarily large inverter can increase system cost.
          This guide explains a practical approach to inverter sizing.
        </p>

        <div className="mt-10 border-l-4 border-blue-700 bg-slate-50 px-6 py-5">
          <p className="font-semibold text-slate-900">
            Quick principle:
          </p>
          <p className="mt-2 leading-7 text-slate-700">
            Your inverter should be selected from the expected simultaneous
            load, while also accounting for startup or surge requirements of
            equipment such as refrigerators, pumps and air-conditioners.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            What does an inverter do?
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            An inverter converts direct current (DC) electricity from a
            battery or other DC source into alternating current (AC) electricity
            that can be used by conventional household and commercial
            appliances.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            In solar and backup power systems, the inverter is one of the
            central components because it determines how much AC power can be
            supplied to the connected loads.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 1: Determine your electrical load
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Start by identifying the appliances you want the inverter to
            operate. Record their rated power and determine which appliances
            are likely to operate at the same time.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            For example, suppose your expected simultaneous load is:
          </p>

          <div className="mt-6 overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3">Load</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Power Each</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Televisions</td>
                  <td className="px-4 py-3">2</td>
                  <td className="px-4 py-3">120 W</td>
                  <td className="px-4 py-3">240 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Fans</td>
                  <td className="px-4 py-3">3</td>
                  <td className="px-4 py-3">80 W</td>
                  <td className="px-4 py-3">240 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Lights</td>
                  <td className="px-4 py-3">10</td>
                  <td className="px-4 py-3">10 W</td>
                  <td className="px-4 py-3">100 W</td>
                </tr>
                <tr className="border-t border-slate-200">
                  <td className="px-4 py-3">Refrigerator</td>
                  <td className="px-4 py-3">1</td>
                  <td className="px-4 py-3">200 W</td>
                  <td className="px-4 py-3">200 W</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            The running load in this example is 780 W. The actual design must
            still consider whether these loads operate simultaneously and
            whether any of them have significant starting requirements.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 2: Convert watts to kilowatts
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Inverter capacity is commonly discussed in watts, kilowatts (kW)
            or volt-amperes (VA/kVA).
          </p>

          <div className="mt-6 bg-slate-950 p-6 text-lg font-semibold text-white">
            1 kW = 1,000 W
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            Therefore, a 780 W load is equivalent to 0.78 kW of real power.
            This is the starting point for selecting an appropriate inverter
            capacity.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 3: Allow design headroom
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            An inverter should not normally be selected to operate permanently
            at its absolute maximum rating. Design headroom provides room for
            load variation and helps prevent unnecessary overload conditions.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            For example, if the calculated continuous load is approximately
            0.78 kW, selecting an inverter with a capacity comfortably above
            that demand may be more appropriate than selecting one whose
            nominal rating is almost exactly 0.78 kW.
          </p>

          <div className="mt-6 bg-slate-50 p-6">
            <p className="font-bold text-slate-900">
              Basic sizing idea: Inverter capacity &gt; expected simultaneous
              running load
            </p>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            The exact engineering margin depends on the system, equipment,
            manufacturer specifications and expected operating conditions.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 4: Check starting or surge power
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Some appliances draw significantly more power when they start.
            This is particularly important for loads containing motors or
            compressors.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Refrigerators, freezers, water pumps and air-conditioners are
            common examples. The inverter must have sufficient surge capability
            to start these loads without tripping.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Always check the manufacturer's specifications for starting
            current or surge requirements where available rather than relying
            on a generic multiplier for every appliance.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            kW and kVA are not always the same
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Inverter capacity may be stated in kVA rather than kW. The
            relationship depends on the system power factor.
          </p>

          <div className="mt-6 bg-slate-50 p-6">
            <p className="font-bold text-slate-900">
              Apparent Power (kVA) = Real Power (kW) ÷ Power Factor
            </p>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            For example, a 4 kW real-power requirement at a power factor of
            0.8 corresponds to approximately 5 kVA of apparent power.
            However, actual inverter selection should also consider the
            inverter manufacturer's continuous power rating, surge rating and
            operating specifications.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Inverter size is different from battery size
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            A common mistake is to treat inverter capacity and battery
            capacity as the same thing. They perform different functions.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            The inverter determines how much AC power can be supplied to the
            loads. The battery determines how much stored energy is available
            and how long the loads can continue operating when the grid or
            generator is unavailable.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Therefore, a properly designed system must consider both
            instantaneous power demand and required backup duration.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Example: choosing an inverter
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Suppose a home has an expected simultaneous running load of 3.2
            kW. The equipment includes a refrigerator, several fans,
            lighting, televisions and other household loads.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            The design should not simply select a 3.2 kW inverter and assume
            the job is complete. The engineer should check operating margin,
            power factor, starting requirements, surge capability, battery
            voltage and the manufacturer's continuous output rating.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            If motor-driven loads are included, their startup characteristics
            may significantly influence the final inverter selection.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Use our Energy Calculator
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            You can use the Samiz Energy Calculator to estimate your electrical
            load before selecting an inverter, battery or solar system.
          </p>

          <Link
            href="/energy-tools/solar"
            className="mt-6 inline-flex bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            Calculate Your Electrical Load →
          </Link>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Factors to check before buying an inverter
          </h2>

          <ul className="mt-5 space-y-3 leading-8 text-slate-700">
            <li>• Expected simultaneous running load</li>
            <li>• Starting and surge requirements</li>
            <li>• Continuous output rating</li>
            <li>• Power factor and kVA rating</li>
            <li>• Battery voltage and compatibility</li>
            <li>• Solar PV input requirements for hybrid systems</li>
            <li>• Operating temperature and installation conditions</li>
            <li>• Manufacturer specifications and warranty</li>
          </ul>
        </section>

        <section className="mt-14 border-t border-slate-200 pt-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700">
            Need Engineering Support?
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Get professional power-system guidance from Samiz Tech
          </h2>

          <p className="mt-4 max-w-2xl leading-8 text-slate-600">
            Samiz Tech Engineering Ltd. provides electrical engineering, solar
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
