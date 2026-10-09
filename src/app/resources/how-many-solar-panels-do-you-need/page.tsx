import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How Many Solar Panels Do You Need? | Samiz Tech",
  description:
    "Learn how to estimate the number of solar panels you need using daily energy consumption, peak sun hours, panel wattage and system losses.",
  keywords: [
    "how many solar panels do I need",
    "solar panel calculator Nigeria",
    "how to calculate solar panels",
    "solar panel sizing",
    "solar power for Nigerian homes",
    "solar PV system sizing",
    "solar panel wattage calculation",
  ],
  alternates: {
    canonical:
      "https://www.samiztech.com.ng/resources/how-many-solar-panels-do-you-need",
  },
  openGraph: {
    type: "article",
    url: "https://www.samiztech.com.ng/resources/how-many-solar-panels-do-you-need",
    title: "How Many Solar Panels Do You Need?",
    description:
      "A practical guide to estimating solar panel quantity from energy demand, sunlight and system efficiency.",
    siteName: "Samiz Tech Engineering Ltd.",
    locale: "en_NG",
  },
};

export default function SolarPanelSizingArticle() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <article className="mx-auto max-w-4xl px-6 py-16 lg:px-10 lg:py-24">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-700">
          Solar & Power Systems
        </p>

        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
          How Many Solar Panels Do You Need?
        </h1>

        <p className="mt-6 text-lg leading-8 text-slate-600">
          The number of solar panels required for a home or business depends on
          how much electricity you use, the sunlight available at your location,
          panel wattage and losses throughout the system. This guide explains
          how to make a practical first estimate before selecting your solar
          equipment.
        </p>

        <div className="mt-10 border-l-4 border-blue-700 bg-slate-50 px-6 py-5">
          <p className="font-semibold text-slate-900">
            Quick principle:
          </p>
          <p className="mt-2 leading-7 text-slate-700">
            Estimate your daily energy consumption in kilowatt-hours (kWh),
            account for the effective sunlight hours and system losses, then
            divide by the wattage of one panel. Treat the result as a planning
            estimate, not a final installation design.
          </p>
        </div>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 1: Calculate your daily energy consumption
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            List the appliances you want the solar system to support. For each
            appliance, estimate its power in watts and the number of hours it
            operates each day.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Use this formula for each appliance:
          </p>

          <div className="mt-5 rounded-lg bg-slate-50 p-5 leading-8 text-slate-800">
            <p className="font-semibold">
              Daily energy (Wh) = Power (W) × Operating hours per day
            </p>
            <p className="mt-2">
              Daily energy (kWh) = Daily energy (Wh) ÷ 1,000
            </p>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            Add the energy estimates for all appliances to determine your
            approximate daily consumption. For a more accurate result, use
            measured consumption or electricity bills where available, and
            account for appliances that cycle on and off.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            You can start with our{" "}
            <Link
              href="/energy-tools/calculator"
              className="font-semibold text-blue-700 underline underline-offset-4"
            >
              Energy Calculator
            </Link>{" "}
            to estimate your electrical demand.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 2: Understand peak sun hours
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Peak sun hours represent the equivalent number of hours per day
            when solar irradiance averages 1,000 watts per square metre. They
            are not the same as the total number of daylight hours.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            Solar production varies with location, season, weather, shading,
            roof orientation and panel tilt. For a preliminary example, we will
            use five peak sun hours per day. This is an illustrative assumption,
            not a guaranteed value for every location in Nigeria.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            For an actual installation, use solar resource data for the site
            and design for the months or operating conditions that matter most
            to the customer.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 3: Allow for system losses
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Solar panels do not deliver their rated output continuously. Heat,
            dust, wiring, mismatch, shading, conversion equipment and other
            operating conditions reduce usable energy.
          </p>

          <p className="mt-5 leading-8 text-slate-700">
            For an initial estimate, you can assume an overall performance
            factor of 0.80, meaning 80% of the theoretical energy is available.
            This is only a planning assumption; a real system's performance
            factor depends on its design, components, site and operating
            conditions.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Step 4: Calculate the number of panels
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Use the following formula to estimate the required solar array
            capacity:
          </p>

          <div className="mt-5 rounded-lg bg-slate-50 p-5 leading-8 text-slate-800">
            <p className="font-semibold">
              Required PV capacity (W) = Daily energy demand (Wh) ÷ (Peak sun
              hours × Performance factor)
            </p>
            <p className="mt-3 font-semibold">
              Number of panels = Required PV capacity (W) ÷ Panel rating (W)
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Round up to a whole panel, then check the final array against
              inverter limits, battery charging requirements and available
              installation space.
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Worked example: A home using 5 kWh per day
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Suppose a home uses approximately 5 kWh of electricity per day.
            For this example, assume five peak sun hours per day, an 80%
            performance factor and solar panels rated at 500 W each.
          </p>

          <div className="mt-6 overflow-x-auto border border-slate-200">
            <table className="w-full min-w-[500px] text-left text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="px-4 py-3">Calculation</th>
                  <th className="px-4 py-3">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="px-4 py-3">Daily energy demand</td>
                  <td className="px-4 py-3">5,000 Wh</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Peak sun hours</td>
                  <td className="px-4 py-3">5 hours</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Performance factor</td>
                  <td className="px-4 py-3">0.80</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Estimated PV capacity</td>
                  <td className="px-4 py-3">
                    5,000 ÷ (5 × 0.80) = 1,250 W
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Panel rating</td>
                  <td className="px-4 py-3">500 W</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold">
                    Estimated panel quantity
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    1,250 ÷ 500 = 2.5, rounded up to 3 panels
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="mt-5 leading-8 text-slate-700">
            Three 500 W panels provide 1.5 kWp of rated DC capacity. Under the
            stated assumptions, the array's estimated daily energy is about
            6 kWh before considering any additional site-specific design
            constraints. Actual production can be lower, and the array may need
            to be larger if the system must meet demand during less sunny
            periods or support substantial battery charging.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Solar panel quantity is not the whole system design
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            The number of panels alone does not determine whether a solar
            installation will meet your needs. A complete design must also
            consider:
          </p>

          <ul className="mt-5 list-disc space-y-3 pl-6 leading-8 text-slate-700">
            <li>
              <strong>Inverter capacity:</strong> It must support the expected
              simultaneous loads and relevant starting surges.
            </li>
            <li>
              <strong>Battery storage:</strong> For hybrid or off-grid systems,
              storage must be sized for the required backup duration, usable
              capacity and battery limits.
            </li>
            <li>
              <strong>Inverter PV limits:</strong> Check the maximum PV power,
              operating voltage range, maximum input voltage and MPPT current.
            </li>
            <li>
              <strong>Roof or site conditions:</strong> Shading, orientation,
              tilt, structural capacity and available space affect performance.
            </li>
            <li>
              <strong>Safety and protection:</strong> Correct cable sizing,
              isolation, earthing and surge and overcurrent protection are
              essential to the installation design.
            </li>
          </ul>

          <p className="mt-5 leading-8 text-slate-700">
            For systems with batteries, do not size the PV array from daily
            consumption alone. Account for energy needed to recharge the
            battery, conversion losses and the available solar charging window.
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Estimate your solar system requirements
          </h2>

          <p className="mt-5 leading-8 text-slate-700">
            Use the Samiz Solar Calculator to explore solar system requirements.
            Treat calculator outputs as estimates and confirm equipment
            compatibility and site conditions before purchasing or installing
            a system.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/energy-tools/solar"
              className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Open Solar Calculator
            </Link>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Request Engineering Support
            </Link>
          </div>
        </section>

        <footer className="mt-16 border-t border-slate-200 pt-8 text-sm leading-7 text-slate-500">
          <p>
            Prepared by Samiz Tech Engineering Ltd. Final solar system sizing
            should be based on the actual load profile, local solar resource,
            equipment specifications and applicable electrical installation
            requirements.
          </p>
          <p className="mt-3">
            <Link
              href="/resources"
              className="font-semibold text-blue-700 underline underline-offset-4"
            >
              Explore more energy resources
            </Link>
          </p>
        </footer>
      </article>
    </main>
  );
}