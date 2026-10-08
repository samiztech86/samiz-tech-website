"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";

type GeneratorHistoryEntry = {
  id: number;
  date: string;
  generatorKey: string;
  generatorName: string;
  openingRuntime: number;
  closingRuntime: number;
  runtimeUsed: number;
};

type GeneratorResult = {
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
  runtimeUsed: number;
  fuelConsumed: number;
  fuelCost: number;
  runtimeSinceService: number;
  serviceRemaining: number;
  serviceDue: boolean;
};

type GeneratorReport = {
  reportId: string;
  reportType: string;
  createdAt: string;
  generators: GeneratorResult[];
  generatorHistory: GeneratorHistoryEntry[];
  summary: {
    totalCapacityKva: number;
    totalRuntime: number;
    totalFuelConsumed: number;
    totalFuelCost: number;
  };
};

export default function GeneratorReportPage() {
  const router = useRouter();

  const [report, setReport] = useState<GeneratorReport | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("samiz_generator_report");

      if (!saved) {
        setReport(null);
        return;
      }

      setReport(JSON.parse(saved));
    } catch {
      setReport(null);
    }
  }, []);

  const exportToExcel = () => {
    if (!report) {
      return;
    }

    const summarySheet = XLSX.utils.json_to_sheet([
      {
        "Report ID": report.reportId,
        "Report Type": report.reportType,
        "Generated At": report.createdAt,
        "Total Capacity (kVA)": report.summary.totalCapacityKva,
        "Total Runtime (hrs)": report.summary.totalRuntime,
        "Fuel Consumed (L)": report.summary.totalFuelConsumed,
        "Fuel Cost (NGN)": report.summary.totalFuelCost,
      },
    ]);

    const performanceSheet = XLSX.utils.json_to_sheet(
      report.generators.map((generator) => ({
        Generator: generator.name,
        "Capacity (kVA)": generator.capacityKva,
        "Fuel Type": generator.fuelType,
        "Fuel Price (NGN/L)": generator.fuelPrice,
        "Consumption (L/hr)": generator.fuelConsumptionPerHour,
        "Opening Runtime (hrs)": generator.openingRuntime,
        "Closing Runtime (hrs)": generator.closingRuntime,
        "Runtime Used (hrs)": generator.runtimeUsed,
        "Fuel Consumed (L)": generator.fuelConsumed,
        "Fuel Cost (NGN)": generator.fuelCost,
        "Service Interval (hrs)": generator.serviceInterval,
        "Last Service (hrs)": generator.lastServiceRuntime,
        "Runtime Since Service (hrs)": generator.runtimeSinceService,
        "Service Remaining (hrs)": generator.serviceRemaining,
        "Service Due": generator.serviceDue ? "Yes" : "No",
      })),
    );

    const historySheet = XLSX.utils.json_to_sheet(
      report.generatorHistory.map((entry) => ({
        Date: entry.date,
        Generator: entry.generatorName,
        "Opening Runtime (hrs)": entry.openingRuntime,
        "Closing Runtime (hrs)": entry.closingRuntime,
        "Runtime Used (hrs)": entry.runtimeUsed,
      })),
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(
      workbook,
      performanceSheet,
      "Generator Performance",
    );
    XLSX.utils.book_append_sheet(
      workbook,
      historySheet,
      "Runtime History",
    );

    XLSX.writeFile(
      workbook,
      `Samiz-Generator-Report-${report.reportId}.xlsx`,
    );
  };

  const shareOnWhatsApp = () => {
    if (!report) {
      return;
    }

    const reportUrl =
      typeof window !== "undefined" ? window.location.href : "";

    const message = [
      "Samiz Tech Engineering Ltd.",
      "Generator Performance & Fuel Consumption Report",
      "",
      `Report ID: ${report.reportId}`,
      `Total Capacity: ${formatNumber(report.summary.totalCapacityKva)} kVA`,
      `Total Runtime: ${formatNumber(report.summary.totalRuntime)} hrs`,
      `Fuel Consumed: ${formatNumber(report.summary.totalFuelConsumed)} L`,
      `Fuel Cost: ₦${formatNumber(report.summary.totalFuelCost)}`,
      `Generators: ${report.generators.length}`,
      "",
      `View Report: ${reportUrl}`,
    ].join("\n");

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const formatNumber = (value: number, decimals = 2) =>
    value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });

  const formatCurrency = (value: number) =>
    `₦${value.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  if (!report) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="px-6 py-20 sm:px-10 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              Samiz Energy Tools
            </p>

            <h1 className="mt-4 text-3xl font-bold sm:text-5xl">
              Generator Report
            </h1>

            <p className="mt-5 text-slate-300">
              No generator report is available yet. Return to the
              Generator Calculator and generate a report first.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/energy-tools/generator")
              }
              className="mt-8 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Back to Generator Calculator
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <section className="border-b border-slate-800 bg-slate-950 px-6 py-10 text-white sm:px-10 lg:px-16 print:bg-white print:text-black">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400 print:text-slate-700">
                Samiz Tech Engineering Ltd.
              </p>

              <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                Generator Performance & Fuel Consumption Report
              </h1>

              <p className="mt-3 text-slate-300 print:text-slate-700">
                Generator runtime, fuel consumption, operating cost
                and maintenance monitoring report.
              </p>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm print:border-slate-300 print:bg-white">
              <p>
                <span className="font-semibold">Report ID:</span>{" "}
                {report.reportId}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Generated:</span>{" "}
                {new Date(report.createdAt).toLocaleString("en-NG")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Capacity
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(
                  report.summary.totalCapacityKva,
                )}{" "}
                kVA
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Total Runtime
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(report.summary.totalRuntime)} hrs
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Fuel Consumed
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatNumber(
                  report.summary.totalFuelConsumed,
                )}{" "}
                L
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">
                Fuel Cost
              </p>
              <p className="mt-2 text-2xl font-bold">
                {formatCurrency(report.summary.totalFuelCost)}
              </p>
            </div>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold">
                Generator Performance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Current calculated performance for each generator in
                the report.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Generator
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Capacity
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Fuel
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Runtime
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Fuel Used
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Fuel Cost
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Service
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {report.generators.map((generator) => (
                    <tr
                      key={generator.id}
                      className="border-t border-slate-200"
                    >
                      <td className="px-6 py-4 font-semibold">
                        {generator.name || "Unnamed Generator"}
                      </td>

                      <td className="px-6 py-4">
                        {formatNumber(generator.capacityKva)} kVA
                      </td>

                      <td className="px-6 py-4">
                        {generator.fuelType}
                      </td>

                      <td className="px-6 py-4">
                        {formatNumber(generator.runtimeUsed)} hrs
                      </td>

                      <td className="px-6 py-4">
                        {formatNumber(generator.fuelConsumed)} L
                      </td>

                      <td className="px-6 py-4">
                        {formatCurrency(generator.fuelCost)}
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          generator.serviceDue
                            ? "text-red-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {generator.serviceDue
                          ? "Service Due"
                          : `${formatNumber(
                              generator.serviceRemaining,
                            )} hrs remaining`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold">
                Generator Details
              </h2>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              {report.generators.map((generator) => (
                <article
                  key={generator.historyKey}
                  className="rounded-xl border border-slate-200 p-5"
                >
                  <h3 className="text-lg font-bold">
                    {generator.name || "Unnamed Generator"}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Capacity</p>
                      <p className="font-semibold">
                        {formatNumber(generator.capacityKva)} kVA
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">Fuel Type</p>
                      <p className="font-semibold">
                        {generator.fuelType}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Fuel Price
                      </p>
                      <p className="font-semibold">
                        {formatCurrency(generator.fuelPrice)}/L
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Consumption Rate
                      </p>
                      <p className="font-semibold">
                        {formatNumber(
                          generator.fuelConsumptionPerHour,
                        )}{" "}
                        L/hr
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Opening Runtime
                      </p>
                      <p className="font-semibold">
                        {formatNumber(
                          generator.openingRuntime,
                        )}{" "}
                        hrs
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Closing Runtime
                      </p>
                      <p className="font-semibold">
                        {formatNumber(
                          generator.closingRuntime,
                        )}{" "}
                        hrs
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Service Interval
                      </p>
                      <p className="font-semibold">
                        {formatNumber(
                          generator.serviceInterval,
                        )}{" "}
                        hrs
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-500">
                        Last Service
                      </p>
                      <p className="font-semibold">
                        {formatNumber(
                          generator.lastServiceRuntime,
                        )}{" "}
                        hrs
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="text-2xl font-bold">
                Runtime Reading History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recorded generator runtime readings included in this
                report.
              </p>
            </div>

            {report.generatorHistory.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No runtime readings were recorded for this report.
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
                    </tr>
                  </thead>

                  <tbody>
                    {report.generatorHistory.map((entry) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-6 text-blue-950">
            <h2 className="font-bold">
              Engineering Note
            </h2>

            <p className="mt-2">
              Fuel consumption is estimated from recorded runtime
              and the entered fuel consumption rate. Actual generator
              fuel consumption varies with electrical loading,
              engine condition, ambient conditions, fuel quality,
              maintenance condition and operating practice.
            </p>

            <p className="mt-3">
              This report should therefore be used as an operational
              engineering estimate and should be validated against
              measured fuel records and manufacturer data where
              required.
            </p>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between print:hidden">
            <button
              type="button"
              onClick={() =>
                router.push("/energy-tools/generator")
              }
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-50"
            >
              Back to Generator Calculator
            </button>

            <button
              type="button"
              onClick={exportToExcel}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-slate-50"
            >
              Export to Excel
            </button>

            <button
              type="button"
              onClick={shareOnWhatsApp}
              className="rounded-xl border border-green-600 bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
            >
              Share on WhatsApp
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              Print Report
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}