"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SubscriptionGate from "@/components/SubscriptionGate";
import type {
  GeneratorInput,
  GeneratorResults,
  GeneratorResult,
} from "@/lib/energy-tools/generator/calculate";

type GeneratorHistoryEntry = {
  id: number;
  date: string;
  generatorKey: string;
  generatorName: string;
  openingRuntime: number;
  closingRuntime: number;
  runtimeUsed: number;
};

type Generator = {
  id: number;
  historyKey: string;
  name: string;
  capacityKva: number;
  fuelType: "Diesel" | "Petrol" | "Gas";
  fuelPrice: number;
  fuelConsumptionPerHour: number;
  openingRuntime: number;
  closingRuntime: number;
  serviceInterval: number;
  lastServiceRuntime: number;
};

const createGenerator = (): Generator => ({
  id: 1,
  historyKey: `generator-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "Main Generator",
  capacityKva: 350,
  fuelType: "Diesel",
  fuelPrice: 1200,
  fuelConsumptionPerHour: 2.5,
  openingRuntime: 0,
  closingRuntime: 0,
  serviceInterval: 200,
  lastServiceRuntime: 0,
});

export default function GeneratorPage() {
  const router = useRouter();

  const [generators, setGenerators] = useState<Generator[]>([
    createGenerator(),
  ]);

  const [generatorHistory, setGeneratorHistory] =
    useState<GeneratorHistoryEntry[]>(() => {
      if (typeof window === "undefined") return [];

      try {
        const saved = localStorage.getItem(
          "samiz_energy_generator_history",
        );

        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    });

  const [generatorCalculation, setGeneratorCalculation] =
    useState<GeneratorResults | null>(null);

  const [calculationLoading, setCalculationLoading] =
    useState(false);

  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const calculate = async () => {
      setCalculationLoading(true);
      setCalculationError(null);

      try {
        const response = await fetch(
          "/api/energy-tools/generator/calculate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              generators: generators as GeneratorInput[],
            }),
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to calculate generator performance.",
          );
        }

        setGeneratorCalculation(data.results);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setCalculationError(
          error instanceof Error
            ? error.message
            : "Unable to calculate generator performance.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCalculationLoading(false);
        }
      }
    };

    const timeout = window.setTimeout(calculate, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [generators]);

  const generatorResults: GeneratorResult[] =
    generatorCalculation?.generatorResults ?? [];

  const totalGeneratorRuntime =
    generatorCalculation?.totalGeneratorRuntime ?? 0;

  const totalGeneratorFuel =
    generatorCalculation?.totalGeneratorFuel ?? 0;

  const totalGeneratorCost =
    generatorCalculation?.totalGeneratorCost ?? 0;

  const totalGeneratorCapacityKva =
    generatorCalculation?.totalGeneratorCapacityKva ?? 0;

  const addGenerator = () => {
    setGenerators((current) => [
      ...current,
      {
        ...createGenerator(),
        id: current.length
          ? Math.max(...current.map((generator) => generator.id)) + 1
          : 1,
        name: `Generator ${current.length + 1}`,
      },
    ]);
  };

  const removeGenerator = (generatorId: number) => {
    setGenerators((current) =>
      current.filter((generator) => generator.id !== generatorId),
    );
  };

  const updateGenerator = (
    generatorId: number,
    field: keyof Generator,
    value: string | number,
  ) => {
    setGenerators((current) =>
      current.map((generator) => {
        if (generator.id !== generatorId) return generator;

        if (field === "name" || field === "fuelType") {
          return {
            ...generator,
            [field]: value,
          };
        }

        return {
          ...generator,
          [field]: Math.max(0, Number(value)),
        };
      }),
    );
  };

  const saveGeneratorReading = (generatorId: number) => {
    const generator = generators.find(
      (item) => item.id === generatorId,
    );

    if (!generator) return;

    const openingRuntime = Math.max(
      0,
      Number(generator.openingRuntime),
    );

    const closingRuntime = Math.max(
      0,
      Number(generator.closingRuntime),
    );

    if (closingRuntime < openingRuntime) {
      alert(
        "Closing runtime cannot be lower than the opening runtime.",
      );
      return;
    }

    if (closingRuntime === openingRuntime) {
      alert(
        "The opening and closing runtime readings are the same. Enter a new closing reading.",
      );
      return;
    }

    const runtimeUsed = closingRuntime - openingRuntime;

    const entry: GeneratorHistoryEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      generatorKey: generator.historyKey,
      generatorName:
        generator.name || "Unnamed Generator",
      openingRuntime,
      closingRuntime,
      runtimeUsed,
    };

    setGeneratorHistory((current) => {
      const updated = [entry, ...current];

      localStorage.setItem(
        "samiz_energy_generator_history",
        JSON.stringify(updated),
      );

      return updated;
    });

    setGenerators((current) =>
      current.map((item) =>
        item.id === generatorId
          ? {
              ...item,
              openingRuntime: closingRuntime,
              closingRuntime,
            }
          : item,
      ),
    );

    alert(
      `${generator.name || "Generator"} reading saved successfully. The closing reading is now set as the new opening reading.`,
    );
  };

  const deleteGeneratorHistoryEntry = (
    entryId: number,
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this saved generator reading?",
      )
    ) {
      return;
    }

    setGeneratorHistory((current) => {
      const updated = current.filter(
        (entry) => entry.id !== entryId,
      );

      localStorage.setItem(
        "samiz_energy_generator_history",
        JSON.stringify(updated),
      );

      return updated;
    });
  };

  const generateGeneratorReport = () => {
    let reportHistory = generatorHistory;

    try {
      const savedHistory = localStorage.getItem(
        "samiz_energy_generator_history",
      );

      if (savedHistory) {
        reportHistory = JSON.parse(savedHistory);
      }
    } catch {
      reportHistory = generatorHistory;
    }

    const report = {
      reportId: `SAMIZ-GEN-${Date.now()}`,
      reportType: "generator-performance",
      createdAt: new Date().toISOString(),
      generators: generatorResults,
      generatorHistory: reportHistory,
      summary: {
        totalCapacityKva: totalGeneratorCapacityKva,
        totalRuntime: totalGeneratorRuntime,
        totalFuelConsumed: totalGeneratorFuel,
        totalFuelCost: totalGeneratorCost,
      },
    };

    localStorage.setItem(
      "samiz_generator_report",
      JSON.stringify(report),
    );

    router.push("/energy-tools/generator/report");
  };

  const formatNumber = (value: number, decimals = 2) =>
    value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });

  const formatCurrency = (value: number) =>
    `Ã¢â€šÂ¦${value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-slate-800 bg-slate-950 px-6 py-14 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
            Samiz Energy Tools
          </p>

          <div className="mt-4 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Generator Calculator
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
              Track generator runtime, estimate fuel consumption and
              operating cost, monitor service intervals, and manage
              multiple generators from one engineering workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-6 py-10 text-slate-950 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <SubscriptionGate tool="generator">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Total Capacity
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(totalGeneratorCapacityKva)} kVA
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Runtime Used
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(totalGeneratorRuntime)} hrs
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Fuel Consumed
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(totalGeneratorFuel)} L
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  Fuel Cost
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(totalGeneratorCost)}
                </p>
              </div>
            </div>
          </SubscriptionGate>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Generator Fleet
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Add each generator you want to monitor.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={generateGeneratorReport}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
              >
                View Generator Report
              </button>

              <button
                type="button"
                onClick={addGenerator}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                + Add Generator
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {generatorResults.map((generator) => (
              <article
                key={generator.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      {generator.name || "Unnamed Generator"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {generator.capacityKva} kVA Ã‚Â·{" "}
                      {generator.fuelType}
                    </p>
                  </div>

                  {generators.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeGenerator(generator.id)
                      }
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="text-sm font-medium">
                    Generator Name
                    <input
                      type="text"
                      value={generator.name}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "name",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Capacity (kVA)
                    <input
                      type="number"
                      min="0"
                      value={generator.capacityKva}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "capacityKva",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Fuel Type
                    <select
                      value={generator.fuelType}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "fuelType",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none focus:border-slate-950"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Gas">Gas</option>
                    </select>
                  </label>

                  <label className="text-sm font-medium">
                    Fuel Price (Ã¢â€šÂ¦/L)
                    <input
                      type="number"
                      min="0"
                      value={generator.fuelPrice}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "fuelPrice",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Fuel Consumption (L/hr)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={generator.fuelConsumptionPerHour}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "fuelConsumptionPerHour",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Opening Runtime (hrs)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={generator.openingRuntime}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "openingRuntime",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Closing Runtime (hrs)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={generator.closingRuntime}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "closingRuntime",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Service Interval (hrs)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={generator.serviceInterval}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "serviceInterval",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Last Service Runtime (hrs)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={generator.lastServiceRuntime}
                      onChange={(event) =>
                        updateGenerator(
                          generator.id,
                          "lastServiceRuntime",
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-slate-950"
                    />
                  </label>
                </div>

                <SubscriptionGate tool="generator">
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Runtime Used
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatNumber(generator.runtimeUsed)} hrs
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Fuel Consumed
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatNumber(generator.fuelConsumed)} L
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Fuel Cost
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatCurrency(generator.fuelCost)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Service Remaining
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatNumber(generator.serviceRemaining)} hrs
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-100 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">
                        Service Status
                      </p>
                      <p
                        className={`mt-1 text-lg font-bold ${
                          generator.serviceDue
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {generator.serviceDue
                          ? "Service Due"
                          : "Service OK"}
                      </p>
                    </div>
                  </div>
                </SubscriptionGate>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() =>
                      saveGeneratorReading(generator.id)
                    }
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save Runtime Reading
                  </button>

                  <p className="text-sm text-slate-500">
                    Saving a reading moves the closing runtime into
                    the next opening runtime.
                  </p>
                </div>
              </article>
            ))}
          </div>

          <SubscriptionGate tool="generator">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-6">
                <h2 className="text-xl font-bold">
                  Generator Reading History
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saved runtime readings are stored locally on this
                  device.
                </p>
              </div>

              {generatorHistory.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No generator readings have been saved yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-4 font-semibold">
                          Date
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Generator
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Opening
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Closing
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Runtime Used
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {generatorHistory.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-t border-slate-200"
                        >
                          <td className="px-6 py-4">
                            {new Date(entry.date).toLocaleString(
                              "en-NG",
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {entry.generatorName}
                          </td>
                          <td className="px-6 py-4">
                            {formatNumber(
                              entry.openingRuntime,
                            )}{" "}
                            hrs
                          </td>
                          <td className="px-6 py-4">
                            {formatNumber(
                              entry.closingRuntime,
                            )}{" "}
                            hrs
                          </td>
                          <td className="px-6 py-4">
                            {formatNumber(entry.runtimeUsed)} hrs
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                deleteGeneratorHistoryEntry(
                                  entry.id,
                                )
                              }
                              className="font-semibold text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </SubscriptionGate>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-6 text-blue-950">
            <p className="font-semibold">
              Engineering note
            </p>
            <p className="mt-2">
              Fuel consumption is estimated from the entered
              runtime and fuel consumption rate. Actual generator
              consumption varies with loading, engine condition,
              ambient conditions, fuel quality, and operating
              practice. Use the results as an operational estimate,
              not as a substitute for manufacturer data or measured
              fuel records.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}