"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SubscriptionGate from "@/components/SubscriptionGate";
import type { ConsumptionAppliance, ConsumptionResults } from "@/lib/energy-tools/consumption/calculate";

export default function EnergyConsumptionPage() {
  const [appliances, setAppliances] = useState<ConsumptionAppliance[]>([
    {
      id: 1,
      name: "",
      quantity: 1,
      watts: 0,
      hoursPerDay: 0,
    },
  ]);

  const [meterDaily, setMeterDaily] = useState(0);

  const [calculations, setCalculations] = useState<ConsumptionResults | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  useEffect(() => {
    const hasValidAppliance = appliances.some(
      (appliance) =>
        appliance.name.trim() !== "" &&
        appliance.quantity > 0 &&
        appliance.watts > 0 &&
        appliance.hoursPerDay > 0,
    );

    if (!hasValidAppliance && meterDaily <= 0) {
      setCalculations(null);
      setCalculationError(null);
      setCalculationLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setCalculationLoading(true);
        setCalculationError(null);

        const response = await fetch(
          "/api/energy-tools/consumption/calculate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              appliances,
              meterDaily,
            }),
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to calculate the energy consumption assessment.",
          );
        }

        setCalculations(data.results);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Consumption calculation failed:", error);
        setCalculationError(
          error instanceof Error
            ? error.message
            : "Unable to calculate the energy consumption assessment.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCalculationLoading(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [appliances, meterDaily]);


  const addAppliance = () => {
    setAppliances((current) => [
      ...current,
      {
        id: Date.now() + Math.random(),
        name: "",
        quantity: 1,
        watts: 0,
        hoursPerDay: 0,
      },
    ]);
  };

  const updateAppliance = (
    id: number,
    field: keyof Omit<ConsumptionAppliance, "id">,
    value: string | number,
  ) => {
    setAppliances((current) =>
      current.map((appliance) => {
        if (appliance.id !== id) return appliance;

        if (field === "name") {
          return {
            ...appliance,
            name: String(value),
          };
        }

        const numericValue = Number(value);

        if (field === "quantity") {
          return {
            ...appliance,
            quantity: Math.max(
              0,
              Number.isFinite(numericValue) ? numericValue : 0,
            ),
          };
        }

        if (field === "watts") {
          return {
            ...appliance,
            watts: Math.max(
              0,
              Number.isFinite(numericValue) ? numericValue : 0,
            ),
          };
        }

        return {
          ...appliance,
          hoursPerDay: Math.min(
            24,
            Math.max(
              0,
              Number.isFinite(numericValue) ? numericValue : 0,
            ),
          ),
        };
      }),
    );
  };

  const removeAppliance = (id: number) => {
    setAppliances((current) =>
      current.length > 1
        ? current.filter((appliance) => appliance.id !== id)
        : current,
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-950">
      <section className="bg-[#07111f]">
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <Link
            href="/energy-tools"
            className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400"
          >
            â† Energy Tools
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Energy Consumption
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find out what is consuming your electricity.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Enter the appliances and equipment you use, how many you have,
            their power ratings and how long they operate each day. The tool
            ranks your biggest electricity consumers and estimates daily and
            monthly energy usage.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  Electricity users
                </p>
                <h2 className="mt-2 text-xl font-black sm:text-2xl">
                  What is using your electricity?
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Add each major appliance or electrical load you want to
                  investigate.
                </p>
              </div>

              <button
                type="button"
                onClick={addAppliance}
                className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700"
              >
                + Add appliance
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {appliances.map((appliance, index) => (
                <div
                  key={appliance.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-slate-800">
                      Appliance {index + 1}
                    </p>

                    {appliances.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAppliance(appliance.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="block lg:col-span-1">
                      <span className="text-xs font-bold text-slate-700">
                        Appliance
                      </span>
                      <input
                        type="text"
                        value={appliance.name}
                        onChange={(e) =>
                          updateAppliance(
                            appliance.id,
                            "name",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. Air conditioner"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        Quantity
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={appliance.quantity}
                        onChange={(e) =>
                          updateAppliance(
                            appliance.id,
                            "quantity",
                            e.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        Power rating
                      </span>
                      <div className="mt-2 flex">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={appliance.watts}
                          onChange={(e) =>
                            updateAppliance(
                              appliance.id,
                              "watts",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-l-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                        />
                        <span className="flex items-center rounded-r-xl border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs font-bold text-slate-500">
                          W
                        </span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-xs font-bold text-slate-700">
                        Hours per day
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={appliance.hoursPerDay}
                        onChange={(e) =>
                          updateAppliance(
                            appliance.id,
                            "hoursPerDay",
                            e.target.value,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <SubscriptionGate tool="consumption">
              {calculations && (
              <section className="rounded-2xl bg-[#07111f] p-5 text-white shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                  Your consumption
                </p>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400">Daily identified</p>
                    <p className="mt-1 text-2xl font-black">
                      {calculations.totalDailyKwh.toFixed(2)} kWh
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400">Monthly identified</p>
                    <p className="mt-1 text-2xl font-black">
                      {calculations.totalMonthlyKwh.toFixed(2)} kWh
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400">Largest consumer</p>
                    <p className="mt-1 text-lg font-black">
                      {calculations.largestConsumer?.name || "Not identified yet"}
                    </p>
                    {calculations.largestConsumer && (
                      <p className="mt-1 text-sm text-slate-400">
                        {calculations.largestConsumer.dailyKwh.toFixed(2)} kWh/day
                        {" Â· "}
                        {calculations.largestConsumerPercentage.toFixed(1)}% of
                        identified usage
                      </p>
                    )}
                  </div>
                </div>
              </section>
              )}
            </SubscriptionGate>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Meter comparison
              </p>

              <h2 className="mt-2 text-lg font-black">
                Compare with measured electricity
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                If you know your average daily grid consumption, enter it to
                see how much remains unexplained by the appliances entered
                above.
              </p>

              <label className="mt-5 block">
                <span className="text-xs font-bold text-slate-700">
                  Measured daily consumption
                </span>
                <div className="mt-2 flex">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={meterDaily}
                    onChange={(e) =>
                      setMeterDaily(
                        Math.max(
                          0,
                          Number.isFinite(Number(e.target.value))
                            ? Number(e.target.value)
                            : 0,
                        ),
                      )
                    }
                    className="w-full rounded-l-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                  />
                  <span className="flex items-center rounded-r-xl border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs font-bold text-slate-500">
                    kWh/day
                  </span>
                </div>
              </label>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-500">
                    Unexplained difference
                  </span>
                  <span className="text-sm font-black text-slate-900">
                    {calculations ? `${calculations.gap.toFixed(2)} kWh/day` : "—"}
                  </span>
                </div>

                {calculations && calculations.hasData && meterDaily > 0 && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {calculations.gap >= 0
                      ? `${calculations.gapPercentage.toFixed(1)}% more energy is being measured than the appliances entered here.`
                      : `${Math.abs(calculations.gapPercentage).toFixed(1)}% more appliance usage was entered than the measured daily consumption.`}
                  </p>
                )}
              </div>
            </section>
          </aside>
        </div>

        <SubscriptionGate tool="consumption">
          {calculations && (
            <>
            {calculations.largestConsumer && (
            <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">
                What is consuming your electricity?
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                {calculations.largestConsumer.name} is your largest identified consumer.
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
                It accounts for{" "}
                <strong>
                  {calculations.largestConsumerPercentage.toFixed(1)}%
                </strong>{" "}
                of the electricity usage identified in this assessment. To reduce
                your electricity consumption, consider reducing its operating
                hours, using it more efficiently, or switching it off when it is
                not essential. You can also review the other high-consumption
                appliances above and prioritize non-essential loads for reduction.
              </p>
            </section>
          )}

          {calculations.rankedAppliances.length > 0 && (
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                Consumption ranking
              </p>

              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                Where your electricity is going
              </h2>

              <div className="mt-6 space-y-4">
                {calculations.rankedAppliances.map((appliance, index) => (
                  <div key={appliance.id}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900">
                          {index + 1}. {appliance.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {appliance.quantity} Ã— {appliance.watts} W Ã—{" "}
                          {appliance.hoursPerDay} h/day
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm font-black">
                          {appliance.dailyKwh.toFixed(2)} kWh/day
                        </p>
                        <p className="text-xs text-slate-500">
                          {appliance.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${Math.min(100, appliance.percentage)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
            </>
          )}
        </SubscriptionGate>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/energy-tools/calculator"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            Open Energy Calculator
          </Link>

          <Link
            href="/energy-tools"
            className="rounded-xl bg-[#07111f] px-4 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Back to Energy Tools
          </Link>
        </div>
      </main>
    </div>
  );
}
