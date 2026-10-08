"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { downloadReportExcel } from "@/lib/exportExcel";

type Appliance = {
  id: number;
  name: string;
  quantity: number;
  watts: number;
  hoursPerDay: number;
};

type Meter = {
  identifierType: string;
  identifier: string;
  previousReading: number;
  currentReading: number;
  days: number;
};

type Area = {
  id: number;
  name: string;
  common: boolean;
  appliances: Appliance[];
  meter?: Meter;
};

type GeneratorResult = {
  id: number;
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

type ReportResults = {
  applianceLoad: number;
  applianceEnergy: number;
  commonAreaMeasuredEnergy: number;
  commonAreaDailyEnergy: number;
  gridEnergy: number;
  gridDailyEnergy: number;
  estimatedDailyEnergy: number;
  weeklyEnergy: number;
  monthlyEnergy: number;
  measuredSubMeterEnergy: number;
  measuredVsEstimatedDifference: number;

  generatorResults: GeneratorResult[];
  totalGeneratorRuntime: number;
  totalGeneratorFuel: number;
  totalGeneratorCost: number;
  totalGeneratorCapacityKva: number;

  installedPvKwp: number;
  installedBatteryKwh: number;
  recommendedInverterKva: number;
};

type EnergyReport = {
  id: number;
  createdAt: string;
  propertyName: string;
  propertyType: string;
  generators: GeneratorResult[];
  areas: Area[];
  gridMeter: Meter;
  results: ReportResults;
};

export default function ReportsPage() {
  const [isLoadAnalysisReport, setIsLoadAnalysisReport] = useState(false);

  const [report, setReport] = useState<EnergyReport | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem("samiz_energy_assessment");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [loadAnalysisReport, setLoadAnalysisReport] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    setIsLoadAnalysisReport(params.get("type") === "load-analysis");
  }, []);

  useEffect(() => {
    if (!isLoadAnalysisReport || typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("samiz_load_analysis_report");
      setLoadAnalysisReport(stored ? JSON.parse(stored) : null);
    } catch {
      setLoadAnalysisReport(null);
    }
  }, [isLoadAnalysisReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!report) {
      return;
    }

    const message = [
      "SAMIZ TECH ENERGY ASSESSMENT",
      "",
      `Property: ${report.propertyName}`,
      `Property type: ${report.propertyType}`,
      "",
      "BASIC ENERGY RESULTS",
      `Connected load: ${report.results.applianceLoad.toFixed(0)} W`,
      `Daily energy: ${report.results.estimatedDailyEnergy.toFixed(2)} kWh`,
      `Weekly energy: ${report.results.weeklyEnergy.toFixed(2)} kWh`,
      `Monthly energy: ${report.results.monthlyEnergy.toFixed(2)} kWh`,
      "",
      "A detailed engineering assessment is available with Premium Energy Assessment.",
      "",
      "Prepared using Samiz Tech Engineering Ltd.",
    ].join("\n");

    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  const handleCopy = async () => {
    if (!report) {
      return;
    }

    const { results } = report;

    const text = [
      "SAMIZ TECH ENERGY ASSESSMENT",
      "",
      `Property: ${report.propertyName}`,
      `Property type: ${report.propertyType}`,
      "",
      "BASIC ENERGY RESULTS",
      `Connected load: ${results.applianceLoad.toFixed(0)} W`,
      `Daily energy: ${results.estimatedDailyEnergy.toFixed(2)} kWh`,
      `Weekly energy: ${results.weeklyEnergy.toFixed(2)} kWh`,
      `Monthly energy: ${results.monthlyEnergy.toFixed(2)} kWh`,
      "",
      "PREMIUM ENERGY ASSESSMENT",
      "Detailed meter, generator, solar, battery, inverter and advanced energy analysis are available with Premium.",
      "",
      "Prepared using Samiz Tech Engineering Ltd.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      alert("Energy assessment copied to clipboard.");
    } catch {
      alert("Unable to copy the report.");
    }
  };

  const handleExcelExport = () => {
    if (!report) {
      return;
    }

    const { results } = report;

    const safePropertyName = report.propertyName
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "");

    downloadReportExcel(
      `Samiz-Energy-Assessment-${safePropertyName}.xlsx`,
      [
        {
          name: "Executive Summary",
          rows: [
            {
              "Report ID": `SAMIZ-${report.id}`,
              "Assessment Date": new Date(report.createdAt).toLocaleString("en-NG"),
              Property: report.propertyName,
              "Property Type": report.propertyType,
              "Daily Energy (kWh)": results.estimatedDailyEnergy,
              "Weekly Energy (kWh)": results.weeklyEnergy,
              "Monthly Energy (kWh)": results.monthlyEnergy,
              "Connected Load (W)": results.applianceLoad,
            },
          ],
        },

        {
          name: "Consumption",
          rows: [
            {
              "Appliance Energy (kWh/day)": results.applianceEnergy,
              "Estimated Daily Energy (kWh/day)": results.estimatedDailyEnergy,
              "Weekly Energy (kWh)": results.weeklyEnergy,
              "Monthly Energy (kWh)": results.monthlyEnergy,
            },
          ],
        },

        {
          name: "Areas",
          rows: (report.areas ?? []).flatMap((area) => {
            if (!area.appliances?.length) {
              return [
                {
                  Area: area.name,
                  Appliance: "",
                  Quantity: 0,
                  "Power (W)": 0,
                  "Hours/Day": 0,
                },
              ];
            }

            return area.appliances.map((appliance) => ({
              Area: area.name,
              Appliance: appliance.name,
              Quantity: appliance.quantity,
              "Power (W)": appliance.watts,
              "Hours/Day": appliance.hoursPerDay,
            }));
          }),
        },

        {
          name: "Premium Assessment",
          rows: [
            {
              Note: "Detailed meter, generator, solar, battery, inverter and advanced energy analysis are available with Premium Energy Assessment.",
            },
          ],
        },
      ],
    );
  };

  if (!report && !isLoadAnalysisReport) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-950">

        <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-6 py-16">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-black text-blue-600">
              S
            </div>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              No assessment found
            </p>

            <h1 className="mt-3 text-3xl font-black">
              Build your energy profile first.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-500">
              Complete the Energy Assessment and select Generate Energy Report
              to create your Samiz assessment.
            </p>

            <Link
              href="/energy-tools/calculator"
              className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-black text-white hover:bg-blue-700"
            >
              Start Energy Assessment ?
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (isLoadAnalysisReport) {
    if (!loadAnalysisReport) {
      return (
        <div className="min-h-screen bg-slate-100 px-6 py-16 text-slate-950">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">
              Samiz Tech Engineering Ltd
            </p>

            <h1 className="mt-3 text-3xl font-black">
              Load Analysis Report
            </h1>

            <p className="mt-8 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              No Load Analysis report was found.
            </p>
          </div>
        </div>
      );
    }

    const project = loadAnalysisReport.project;
    const designBasis = loadAnalysisReport.designBasis;
    const loads = loadAnalysisReport.loads ?? [];
    const analysis = loadAnalysisReport.analysis;

    const reportDate = new Date(
      loadAnalysisReport.createdAt,
    ).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const handleLoadAnalysisExcel = () => {
      downloadReportExcel(
        `Samiz_Load_Analysis_${loadAnalysisReport.reportId}.xlsx`,
        [
          {
            name: "Executive Summary",
            rows: [
              {
                Project: project.projectName || "Unnamed project",
                "Project Type": project.projectType,
                Buildings: project.buildingCount,
                Units: project.unitCount,
                "Connected Load (kW)": analysis.connectedKw,
                "Diversified Load (kW)": analysis.diversifiedKw,
                "Design Demand (kW)": analysis.designDemandKw,
                "Apparent Power (kVA)": analysis.apparentPowerKva,
                "Critical Load (kW)": analysis.criticalKw,
                "Non-Critical Load (kW)": analysis.nonCriticalKw,
                "Daily Energy (kWh)": analysis.dailyEnergyKwh,
                "Monthly Energy (kWh)": analysis.monthlyEnergyKwh,
                "Annual Energy (kWh)": analysis.annualEnergyKwh,
              },
            ],
          },
          {
            name: "Design Basis",
            rows: [
              {
                "Phase Type": designBasis.phaseType,
                "Voltage (V)": designBasis.voltage,
                "Power Factor": designBasis.powerFactor,
                "Diversity Factor (%)": designBasis.diversityFactor,
                "Design Margin (%)": designBasis.designMargin,
                "Future Expansion (%)": designBasis.futureExpansion,
              },
            ],
          },
          {
            name: "Load Schedule",
            rows: loads.map((load: any) => ({
              Building: load.building,
              Zone: load.zone,
              Load: load.name,
              Category: load.category,
              Quantity: load.quantity,
              "Rating (W)": load.watts,
              "Hours/Day": load.hoursPerDay,
              "Demand Factor": load.demandFactor,
              "Power Factor": load.powerFactor,
              Critical: load.critical ? "Yes" : "No",
              Phase: load.phase,
            })),
          },
          {
            name: "Demand & Capacity",
            rows: [
              {
                "Connected Load (kW)": analysis.connectedKw,
                "Diversified Load (kW)": analysis.diversifiedKw,
                "Design Demand (kW)": analysis.designDemandKw,
                "Apparent Power (kVA)": analysis.apparentPowerKva,
                "Future Capacity (kW)": analysis.futureCapacityKw,
                "Future Capacity (kVA)": analysis.futureCapacityKva,
                "Transformer (kVA)": analysis.recommendedTransformerKva,
                "Generator (kVA)": analysis.recommendedGeneratorKva,
                "Inverter (kVA)": analysis.recommendedInverterKva,
              },
            ],
          },
          {
            name: "Phase Analysis",
            rows: [
              {
                Phase: "L1",
                "Load (kW)": analysis.phaseL1Kw,
                "Load (kVA)": analysis.phaseL1Kva,
                "Current (A)": analysis.phaseL1Current,
              },
              {
                Phase: "L2",
                "Load (kW)": analysis.phaseL2Kw,
                "Load (kVA)": analysis.phaseL2Kva,
                "Current (A)": analysis.phaseL2Current,
              },
              {
                Phase: "L3",
                "Load (kW)": analysis.phaseL3Kw,
                "Load (kVA)": analysis.phaseL3Kva,
                "Current (A)": analysis.phaseL3Current,
              },
              {
                Phase: "Summary",
                "Average Load (kW)": analysis.averagePhaseKw,
                "Maximum Load (kW)": analysis.maximumPhaseKw,
                "Minimum Load (kW)": analysis.minimumPhaseKw,
                "Phase Imbalance (%)": analysis.phaseImbalancePercentage,
              },
            ],
          },
        ],
      );
    };

    const handleLoadAnalysisWhatsApp = () => {
      const message = [
        "Samiz Tech Engineering Ltd",
        "Load Analysis Report",
        "",
        `Project: ${project.projectName || "Unnamed project"}`,
        `Project Type: ${project.projectType}`,
        `Connected Load: ${Number(analysis.connectedKw).toFixed(2)} kW`,
        `Design Demand: ${Number(analysis.designDemandKw).toFixed(2)} kW`,
        `Apparent Power: ${Number(analysis.apparentPowerKva).toFixed(2)} kVA`,
        `Transformer: ${Number(analysis.recommendedTransformerKva).toFixed(0)} kVA`,
        `Generator: ${Number(analysis.recommendedGeneratorKva).toFixed(0)} kVA`,
        `Inverter: ${Number(analysis.recommendedInverterKva).toFixed(0)} kVA`,
        `Phase Imbalance: ${Number(analysis.phaseImbalancePercentage).toFixed(2)}%`,
        "",
        `Report ID: ${loadAnalysisReport.reportId}`,
        "Generated by Samiz Energy Tools",
      ].join("\n");

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    };

    const handleLoadAnalysisPrint = () => {
      window.print();
    };

    return (
      <div className="min-h-screen bg-slate-100 text-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

            <section className="bg-[#07111f] px-6 py-10 text-white sm:px-10 sm:py-14">
              <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                    Samiz Tech Engineering Ltd
                  </p>

                  <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                    Load Analysis Report
                  </h1>

                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                    Professional engineering load assessment covering connected
                    load, demand, capacity, phase loading, energy projection
                    and preliminary equipment sizing.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 lg:min-w-[250px]">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Report ID
                  </p>

                  <p className="mt-2 text-sm font-black">
                    {loadAnalysisReport.reportId}
                  </p>

                  <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Report date
                  </p>

                  <p className="mt-2 text-sm font-black">
                    {reportDate}
                  </p>
                </div>
              </div>
            </section>

            <section className="border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <button
                  type="button"
                  onClick={handleLoadAnalysisPrint}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
                >
                  Print / Save PDF
                </button>

                <button
                  type="button"
                  onClick={handleLoadAnalysisExcel}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  Download Excel
                </button>

                <button
                  type="button"
                  onClick={handleLoadAnalysisWhatsApp}
                  className="inline-flex items-center justify-center rounded-xl bg-green-500 px-5 py-3 text-sm font-black text-white transition hover:bg-green-600"
                >
                  Share on WhatsApp
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Print / Save PDF opens your browser print dialog. Download
                Excel exports the engineering data, while WhatsApp shares a
                concise report summary.
              </p>
            </section>

            <section className="border-b border-slate-200 px-6 py-8 sm:px-10">
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Project
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {project.projectName || "Unnamed project"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Project type
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {project.projectType}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Buildings
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {project.buildingCount}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Units
                  </p>
                  <p className="mt-2 text-lg font-black">
                    {project.unitCount}
                  </p>
                </div>
              </div>
            </section>

            <section className="px-6 py-10 sm:px-10">
              <SectionTitle
                eyebrow="01"
                title="Design basis"
                description="Primary electrical design assumptions used for the load analysis."
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <PlanningCard
                  title="Supply configuration"
                  value={`${designBasis.phaseType} phase`}
                  text={`Nominal system voltage: ${designBasis.voltage} V.`}
                />

                <PlanningCard
                  title="Power factor"
                  value={`${designBasis.powerFactor}`}
                  text="Design power factor used for apparent-power calculations."
                />

                <PlanningCard
                  title="Diversity factor"
                  value={`${designBasis.diversityFactor}%`}
                  text="Applied to the aggregated demand assessment."
                />

                <PlanningCard
                  title="Design margin"
                  value={`${designBasis.designMargin}%`}
                  text="Additional capacity allowance included in the design."
                />

                <PlanningCard
                  title="Future expansion"
                  value={`${designBasis.futureExpansion}%`}
                  text="Allowance for anticipated future load growth."
                />

                <PlanningCard
                  title="Load schedule"
                  value={`${loads.length} entries`}
                  text="Individual load items included in the engineering schedule."
                />
              </div>
            </section>

            <section className="border-t border-slate-200 px-6 py-10 sm:px-10">
              <SectionTitle
                eyebrow="02"
                title="Executive engineering summary"
                description="Principal results from the completed load calculation."
              />

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryCard
                  label="Connected load"
                  value={`${Number(analysis.connectedKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Diversified load"
                  value={`${Number(analysis.diversifiedKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Design demand"
                  value={`${Number(analysis.designDemandKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Apparent power"
                  value={`${Number(analysis.apparentPowerKva).toFixed(2)} kVA`}
                />

                <SummaryCard
                  label="Critical load"
                  value={`${Number(analysis.criticalKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Non-critical load"
                  value={`${Number(analysis.nonCriticalKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Daily energy"
                  value={`${Number(analysis.dailyEnergyKwh).toFixed(2)} kWh`}
                />

                <SummaryCard
                  label="Annual energy"
                  value={`${Number(analysis.annualEnergyKwh).toFixed(2)} kWh`}
                />
              </div>
            </section>

            <section className="border-t border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
              <SectionTitle
                eyebrow="03"
                title="Capacity planning"
                description="Preliminary equipment capacity recommendations derived from the calculated demand."
              />

              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <PlanningCard
                  title="Transformer"
                  value={`${Number(analysis.recommendedTransformerKva).toFixed(0)} kVA`}
                  text={`Future capacity basis: ${Number(analysis.futureCapacityKva).toFixed(2)} kVA.`}
                />

                <PlanningCard
                  title="Generator"
                  value={`${Number(analysis.recommendedGeneratorKva).toFixed(0)} kVA`}
                  text="Preliminary standby generator capacity recommendation."
                />

                <PlanningCard
                  title="Inverter"
                  value={`${Number(analysis.recommendedInverterKva).toFixed(0)} kVA`}
                  text="Preliminary inverter capacity recommendation."
                />
              </div>
            </section>

            <section className="border-t border-slate-200 px-6 py-10 sm:px-10">
              <SectionTitle
                eyebrow="04"
                title="Phase analysis"
                description="Calculated phase loading for the selected electrical configuration."
              />

              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-4 py-3 font-bold">Phase</th>
                      <th className="px-4 py-3 font-bold">Load (kW)</th>
                      <th className="px-4 py-3 font-bold">Load (kVA)</th>
                      <th className="px-4 py-3 font-bold">Current (A)</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[
                      ["L1", analysis.phaseL1Kw, analysis.phaseL1Kva, analysis.phaseL1Current],
                      ["L2", analysis.phaseL2Kw, analysis.phaseL2Kva, analysis.phaseL2Current],
                      ["L3", analysis.phaseL3Kw, analysis.phaseL3Kva, analysis.phaseL3Current],
                    ].map(([phase, kw, kva, current]) => (
                      <tr
                        key={String(phase)}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4 font-black">{phase}</td>
                        <td className="px-4 py-4">{Number(kw).toFixed(2)}</td>
                        <td className="px-4 py-4">{Number(kva).toFixed(2)}</td>
                        <td className="px-4 py-4">{Number(current).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="Average phase load"
                  value={`${Number(analysis.averagePhaseKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Maximum phase load"
                  value={`${Number(analysis.maximumPhaseKw).toFixed(2)} kW`}
                />

                <SummaryCard
                  label="Phase imbalance"
                  value={`${Number(analysis.phaseImbalancePercentage).toFixed(2)}%`}
                />
              </div>
            </section>

            <section className="border-t border-slate-200 px-6 py-10 sm:px-10">
              <SectionTitle
                eyebrow="05"
                title="Load schedule"
                description="Detailed schedule of the loads included in the calculation."
              />

              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-slate-950 text-white">
                    <tr>
                      <th className="px-4 py-3">Building</th>
                      <th className="px-4 py-3">Zone</th>
                      <th className="px-4 py-3">Load</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Rating (W)</th>
                      <th className="px-4 py-3">Hours/day</th>
                      <th className="px-4 py-3">Demand</th>
                      <th className="px-4 py-3">Critical</th>
                      <th className="px-4 py-3">Phase</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loads.map((load: any) => (
                      <tr
                        key={load.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-4 py-4">{load.building}</td>
                        <td className="px-4 py-4">{load.zone}</td>
                        <td className="px-4 py-4 font-bold">{load.name}</td>
                        <td className="px-4 py-4">{load.category}</td>
                        <td className="px-4 py-4">{load.quantity}</td>
                        <td className="px-4 py-4">{load.watts}</td>
                        <td className="px-4 py-4">{load.hoursPerDay}</td>
                        <td className="px-4 py-4">{load.demandFactor}</td>
                        <td className="px-4 py-4">
                          {load.critical ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-4">{load.phase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="border-t border-slate-200 bg-amber-50 px-6 py-8 sm:px-10">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                Engineering note
              </p>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-amber-900">
                Equipment capacities shown in this report are preliminary
                planning recommendations. Final electrical design must verify
                cable ampacity, voltage drop, short-circuit withstand,
                protection coordination, earthing, harmonics, site conditions,
                applicable standards and statutory requirements.
              </p>
            </section>

          </div>
        </div>
      </div>
    );
  }
  if (!report) {
    return null;
  }

  const { results } = report;

  const assessmentDate = new Date(report.createdAt).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <section className="bg-[#07111f] px-6 py-10 text-white sm:px-10 sm:py-14">
            <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                  Samiz Energy Tools
                </p>

                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                  Energy Assessment Report
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                  A structured summary of the energy consumption calculated from the appliance profile.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5 sm:min-w-[220px]">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assessment date
                </p>

                <p className="mt-2 text-sm font-black">{assessmentDate}</p>

                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Report ID
                </p>

                <p className="mt-2 text-xs font-bold text-slate-300">
                  SAMIZ-{report.id}
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-slate-200 px-6 py-8 sm:px-10">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Property
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {report.propertyName}
                </h2>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Property type
                </p>

                <p className="mt-2 text-lg font-bold">{report.propertyType}</p>
              </div>
            </div>
          </section>

          <section className="px-6 py-8 sm:px-10">
            <SectionTitle
              eyebrow="01"
              title="Executive energy summary"
              description="Key indicators from the completed assessment."
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label="Daily energy"
                value={`${results.estimatedDailyEnergy.toFixed(2)} kWh`}
              />

              <SummaryCard
                label="Monthly estimate"
                value={`${results.monthlyEnergy.toFixed(2)} kWh`}
              />

              <SummaryCard
                label="Appliance load"
                value={`${results.applianceLoad.toFixed(0)} W`}
              />

              <SummaryCard
                label="Weekly energy"
                value={`${results.weeklyEnergy.toFixed(2)} kWh`}
              />
            </div>
          </section>

          <section className="border-t border-slate-200 px-6 py-8 sm:px-10">
            <SectionTitle
              eyebrow="02"
              title="Consumption analysis"
              description="Basic energy consumption calculated from the appliance profile."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <AnalysisCard
                title="Estimated appliance energy"
                value={`${results.applianceEnergy.toFixed(2)} kWh/day`}
                text="Calculated from the listed appliances, quantities, rated power and operating hours."
              />

              <AnalysisCard
                title="Daily energy estimate"
                value={`${results.estimatedDailyEnergy.toFixed(2)} kWh/day`}
                text="Estimated from the appliance profile entered in the free assessment."
              />
            </div>

          </section>

          <section className="border-t border-slate-200 bg-slate-50 px-6 py-10 sm:px-10">
            <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                Premium Energy Assessment
              </p>

              <h2 className="mt-3 max-w-3xl text-2xl font-black text-slate-950 sm:text-3xl">
                Go beyond the basic energy estimate.
              </h2>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                The free assessment gives you a useful starting point. Premium adds the detailed engineering analysis required for deeper energy planning and decision-making.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  "Main grid and meter analysis",
                  "Critical-load and surge analysis",
                  "Solar and battery engineering",
                  "Inverter and backup sizing",
                  "Generator fleet and runtime analysis",
                  "Detailed engineering report and export",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {feature}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/energy-tools/calculator"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
                >
                  Explore Premium Assessment
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-black text-slate-800 transition hover:border-blue-300 hover:text-blue-700"
                >
                  Talk to Samiz Tech
                </Link>
              </div>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Final engineering design and equipment selection require professional verification and site-specific assessment.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-black">{title}</h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function AnalysisCard({
  title,
  value,
  text,
}: {
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-bold">{title}</p>

      <p className="mt-3 text-2xl font-black text-blue-700">{value}</p>

      <p className="mt-3 text-xs leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function PlanningCard({
  title,
  value,
  text,
}: {
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-3 text-3xl font-black">{value}</p>

      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function ReportRow({
  label,
  value,
  interpretation,
}: {
  label: string;
  value: string;
  interpretation: string;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-4 pr-4 font-bold">{label}</td>

      <td className="py-4 pr-4 font-black">{value}</td>

      <td className="py-4 text-slate-500">{interpretation}</td>
    </tr>
  );
}

function NextStep({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="font-black">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}
