"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSubscription } from "@/lib/subscription/provider";
import type { LoadAnalysisResults } from "@/lib/energy-tools/load-analysis/calculate";

type ProjectType =
  | "Estate"
  | "Hotel"
  | "Office"
  | "Hospital"
  | "School"
  | "Factory"
  | "Commercial Building"
  | "Mixed Use"
  | "Other";

type PhaseType = "L1" | "L2" | "L3" | "Three Phase" | "Single Phase";

type LoadCategory =
  | "Lighting"
  | "Socket Outlets"
  | "Air Conditioning"
  | "Refrigeration"
  | "Pumps"
  | "Lifts"
  | "Water Heaters"
  | "Kitchen"
  | "Motors"
  | "ICT / Servers"
  | "Security"
  | "Fire Systems"
  | "External Lighting"
  | "EV Charging"
  | "Industrial / Process"
  | "Other";

type LoadItem = {
  id: number;
  building: string;
  zone: string;
  name: string;
  category: LoadCategory;
  quantity: number;
  watts: number;
  hoursPerDay: number;
  demandFactor: number;
  powerFactor: number;
  critical: boolean;
  phase: PhaseType;
};

const projectTypes: ProjectType[] = [
  "Estate",
  "Hotel",
  "Office",
  "Hospital",
  "School",
  "Factory",
  "Commercial Building",
  "Mixed Use",
  "Other",
];

const categories: LoadCategory[] = [
  "Lighting",
  "Socket Outlets",
  "Air Conditioning",
  "Refrigeration",
  "Pumps",
  "Lifts",
  "Water Heaters",
  "Kitchen",
  "Motors",
  "ICT / Servers",
  "Security",
  "Fire Systems",
  "External Lighting",
  "EV Charging",
  "Industrial / Process",
  "Other",
];

const createLoad = (id: number): LoadItem => ({
  id,
  building: "Main Building",
  zone: "General",
  name: "",
  category: "Lighting",
  quantity: 1,
  watts: 100,
  hoursPerDay: 8,
  demandFactor: 80,
  powerFactor: 0.95,
  critical: false,
  phase: "Three Phase",
});

export default function LoadAnalysisPage() {
  const router = useRouter();
  const { state, hydrated } = useSubscription();

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("Estate");
  const [buildingCount, setBuildingCount] = useState("1");
  const [unitCount, setUnitCount] = useState("");
  const [phaseType, setPhaseType] = useState<PhaseType>("Three Phase");
  const [voltage, setVoltage] = useState("415");
  const [powerFactor, setPowerFactor] = useState("0.90");
  const [designMargin, setDesignMargin] = useState("20");
  const [futureExpansion, setFutureExpansion] = useState("20");
  const [diversityFactor, setDiversityFactor] = useState("100");

  const [loads, setLoads] = useState<LoadItem[]>([createLoad(1)]);
  const [analysisRun, setAnalysisRun] = useState(false);

  const [analysis, setAnalysis] = useState<LoadAnalysisResults | null>(null);
  const [calculationLoading, setCalculationLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  const runLoadAnalysis = () => {
    if (!hydrated) return;

    const hasActivePaidSubscription =
      (state.plan === "starter" ||
        state.plan === "pro" ||
        state.plan === "business") &&
      state.status === "active" &&
      (!state.subscriptionExpiresAt ||
        new Date(state.subscriptionExpiresAt).getTime() > Date.now());

    if (!hasActivePaidSubscription) {
      sessionStorage.setItem(
        "samiz_load_analysis_pending",
        JSON.stringify({
          projectName,
          projectType,
          buildingCount,
          unitCount,
          phaseType,
          voltage,
          powerFactor,
          designMargin,
          futureExpansion,
          diversityFactor,
          loads,
        }),
      );

      router.push(
        `/pricing?returnTo=${encodeURIComponent("/energy-tools/load-analysis?payment=success")}`,
      );
      return;
    }

    if (analysisRun) {
      document
        .getElementById("load-analysis-results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    setAnalysisRun(true);
  };
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") !== "success") return;

    const pending = sessionStorage.getItem("samiz_load_analysis_pending");
    if (!pending) return;

    try {
      const saved = JSON.parse(pending);

      if (saved.projectName !== undefined) setProjectName(saved.projectName);
      if (saved.projectType !== undefined) setProjectType(saved.projectType);
      if (saved.buildingCount !== undefined) setBuildingCount(saved.buildingCount);
      if (saved.unitCount !== undefined) setUnitCount(saved.unitCount);
      if (saved.phaseType !== undefined) setPhaseType(saved.phaseType);
      if (saved.voltage !== undefined) setVoltage(saved.voltage);
      if (saved.powerFactor !== undefined) setPowerFactor(saved.powerFactor);
      if (saved.designMargin !== undefined) setDesignMargin(saved.designMargin);
      if (saved.futureExpansion !== undefined) setFutureExpansion(saved.futureExpansion);
      if (saved.diversityFactor !== undefined) setDiversityFactor(saved.diversityFactor);
      if (saved.loads !== undefined) setLoads(saved.loads);

      const hasActivePaidSubscription =
        (state.plan === "starter" ||
          state.plan === "pro" ||
          state.plan === "business") &&
        state.status === "active" &&
        (!state.subscriptionExpiresAt ||
          new Date(state.subscriptionExpiresAt).getTime() > Date.now());

      if (hasActivePaidSubscription) {
        setAnalysisRun(true);
      }

      sessionStorage.removeItem("samiz_load_analysis_pending");

      window.history.replaceState(
        {},
        "",
        "/energy-tools/load-analysis",
      );
    } catch {
      sessionStorage.removeItem("samiz_load_analysis_pending");
    }
  }, [hydrated, state.plan, state.status, state.subscriptionExpiresAt]);

  useEffect(() => {
    if (!analysisRun || !analysis || typeof window === "undefined") return;

    const report = {
      reportId: `SAMIZ-LA-${Date.now()}`,
      reportType: "load-analysis",
      createdAt: new Date().toISOString(),
      project: {
        projectName,
        projectType,
        buildingCount,
        unitCount,
      },
      designBasis: {
        phaseType,
        voltage,
        powerFactor,
        designMargin,
        futureExpansion,
        diversityFactor,
      },
      loads,
      analysis,
    };

    localStorage.setItem(
      "samiz_load_analysis_report",
      JSON.stringify(report),
    );
  }, [analysisRun, analysis]);


  const addLoad = () => {
    setLoads((current) => [
      ...current,
      createLoad(
        current.length
          ? Math.max(...current.map((load) => load.id)) + 1
          : 1,
      ),
    ]);
  };

  const removeLoad = (id: number) => {
    setLoads((current) =>
      current.length > 1
        ? current.filter((load) => load.id !== id)
        : current,
    );
  };

  const updateLoad = (
    id: number,
    field: keyof LoadItem,
    value: string | number | boolean,
  ) => {
    setLoads((current) =>
      current.map((load) =>
        load.id === id
          ? {
              ...load,
              [field]: value,
            }
          : load,
      ),
    );
  };

  useEffect(() => {
    if (!analysisRun) return;

    const controller = new AbortController();

    const calculate = async () => {
      setCalculationLoading(true);
      setCalculationError(null);

      try {
        const response = await fetch(
          "/api/energy-tools/load-analysis/calculate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              loads,
              powerFactor,
              designMargin,
              futureExpansion,
              diversityFactor,
              voltage,
              phaseType,
            }),
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to calculate the load analysis.",
          );
        }

        setAnalysis(data.results);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setCalculationError(
          error instanceof Error
            ? error.message
            : "Unable to calculate the load analysis.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCalculationLoading(false);
        }
      }
    };

    calculate();

    return () => {
      controller.abort();
    };
  }, [
    analysisRun,
    loads,
    powerFactor,
    designMargin,
    futureExpansion,
    diversityFactor,
    voltage,
    phaseType,
  ]);
  const formatNumber = (value: number, decimals = 2) =>
    value.toLocaleString("en-NG", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="border-b border-slate-200 bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-300">
            Samiz Tech Energy Tools
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Comprehensive Load Analysis
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Detailed electrical demand and capacity planning for estates,
            commercial projects, hotels, hospitals, schools and industrial
            facilities.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              1. Project and electrical design basis
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className="lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold">
                  Project name
                </span>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. Magboro Residential Estate"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Project type
                </span>
                <select
                  value={projectType}
                  onChange={(event) =>
                    setProjectType(event.target.value as ProjectType)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
                >
                  {projectTypes.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Buildings / blocks
                </span>
                <input
                  type="number"
                  min="1"
                  value={buildingCount}
                  onChange={(event) => setBuildingCount(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Units / rooms / shops
                </span>
                <input
                  type="number"
                  min="0"
                  value={unitCount}
                  onChange={(event) => setUnitCount(event.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Supply configuration
                </span>
                <select
                  value={phaseType}
                  onChange={(event) =>
                    setPhaseType(event.target.value as PhaseType)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-sky-500"
                >
                  <option>Three Phase</option>
                  <option>Single Phase</option>
                </select>
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Supply voltage (V)
                </span>
                <input
                  type="number"
                  min="1"
                  value={voltage}
                  onChange={(event) => setVoltage(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  System power factor
                </span>
                <input
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.01"
                  value={powerFactor}
                  onChange={(event) => setPowerFactor(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Design margin (%)
                </span>
                <input
                  type="number"
                  min="0"
                  value={designMargin}
                  onChange={(event) => setDesignMargin(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Future expansion (%)
                </span>
                <input
                  type="number"
                  min="0"
                  value={futureExpansion}
                  onChange={(event) =>
                    setFutureExpansion(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
              </label>
 
              <label>
                <span className="mb-2 block text-sm font-semibold">
                  Project diversity factor (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={diversityFactor}
                  onChange={(event) =>
                    setDiversityFactor(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-sky-500"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Applied at project aggregation level.
                </span>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  2. Detailed load schedule
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter the electrical loads across buildings, zones and
                  equipment categories.
                </p>
              </div>

              <button
                type="button"
                onClick={addLoad}
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                + Add load
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1500px] w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-4">Building</th>
                    <th className="px-4 py-4">Zone</th>
                    <th className="px-4 py-4">Load</th>
                    <th className="px-4 py-4">Category</th>
                    <th className="px-4 py-4">Qty</th>
                    <th className="px-4 py-4">W / unit</th>
                    <th className="px-4 py-4">Hours/day</th>
                    <th className="px-4 py-4">Demand %</th>
                    <th className="px-4 py-4">PF</th>
                    <th className="px-4 py-4">Critical</th>
                    <th className="px-4 py-4">Phase</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loads.map((load) => (
                    <tr key={load.id}>
                      <td className="px-4 py-3">
                        <input
                          value={load.building}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "building",
                              event.target.value,
                            )
                          }
                          className="w-36 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={load.zone}
                          onChange={(event) =>
                            updateLoad(load.id, "zone", event.target.value)
                          }
                          className="w-32 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={load.name}
                          onChange={(event) =>
                            updateLoad(load.id, "name", event.target.value)
                          }
                          placeholder="e.g. AC Unit"
                          className="w-40 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={load.category}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "category",
                              event.target.value as LoadCategory,
                            )
                          }
                          className="w-44 rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          {categories.map((category) => (
                            <option key={category}>{category}</option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={load.quantity}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "quantity",
                              Number(event.target.value),
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={load.watts}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "watts",
                              Number(event.target.value),
                            )
                          }
                          className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={load.hoursPerDay}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "hoursPerDay",
                              Number(event.target.value),
                            )
                          }
                          className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={load.demandFactor}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "demandFactor",
                              Number(event.target.value),
                            )
                          }
                          className="w-24 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min="0.1"
                          max="1"
                          step="0.01"
                          value={load.powerFactor}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "powerFactor",
                              Number(event.target.value),
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-3 py-2"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={load.critical}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "critical",
                              event.target.checked,
                            )
                          }
                          className="h-5 w-5"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={load.phase}
                          onChange={(event) =>
                            updateLoad(
                              load.id,
                              "phase",
                              event.target.value as PhaseType,
                            )
                          }
                          className="w-32 rounded-lg border border-slate-300 bg-white px-3 py-2"
                        >
                          <option>L1</option>
                          <option>L2</option>
                          <option>L3</option>
                          <option>Three Phase</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeLoad(load.id)}
                          disabled={loads.length <= 1}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {analysisRun && analysis && (
            <div className="space-y-6">

          <section id="load-analysis-results" className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-300">
              3. Executive engineering summary
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Preliminary electrical demand assessment
            </h2>

            <p className="mt-3 max-w-4xl leading-7 text-slate-300">
              Based on the current load schedule and selected design
              assumptions, the preliminary project demand and infrastructure
              requirements are shown below.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Connected load", `${formatNumber(analysis.connectedKw)} kW`],
                [
                  "Diversified demand",
                  `${formatNumber(analysis.diversifiedKw)} kW`,
                ],
                [
                  "Design demand",
                  `${formatNumber(analysis.designDemandKw)} kW`,
                ],
                [
                  "Design apparent power",
                  `${formatNumber(analysis.apparentPowerKva)} kVA`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-2 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-600">
                  Phase loading & balance
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  Single-phase load distribution
                </h2>
                <p className="mt-2 max-w-3xl leading-7 text-slate-600">
                  Diversified single-phase demand is shown separately for L1,
                  L2 and L3. Three-phase loads remain separate and are included
                  in the overall project demand.
                </p>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  analysis.phaseImbalancePercentage > 10
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {analysis.phaseImbalancePercentage > 10
                  ? "Review phase allocation"
                  : "Phase balance within screening limit"}
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="px-4 py-3 font-semibold">Metric</th>
                    <th className="px-4 py-3 font-semibold">L1</th>
                    <th className="px-4 py-3 font-semibold">L2</th>
                    <th className="px-4 py-3 font-semibold">L3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      Diversified demand
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL1Kw)} kW
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL2Kw)} kW
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL3Kw)} kW
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      Demand
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL1Kva)} kVA
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL2Kva)} kVA
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL3Kva)} kVA
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      Estimated phase current
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL1Current)} A
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL2Current)} A
                    </td>
                    <td className="px-4 py-3">
                      {formatNumber(analysis.phaseL3Current)} A
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Average phase demand",
                  `${formatNumber(analysis.averagePhaseKw)} kW`,
                ],
                [
                  "Maximum phase",
                  `${formatNumber(analysis.maximumPhaseKw)} kW`,
                ],
                [
                  "Minimum phase",
                  `${formatNumber(analysis.minimumPhaseKw)} kW`,
                ],
                [
                  "Phase imbalance",
                  `${formatNumber(analysis.phaseImbalancePercentage, 1)}%`,
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-xl font-bold text-slate-950">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Three-phase load
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Kept separate from the L1/L2/L3 single-phase balance
                    assessment.
                  </p>
                </div>
                <p className="text-xl font-bold text-slate-950">
                  {formatNumber(
                    analysis.threePhaseDemandedWatts / 1000,
                  )}{" "}
                  kW /{" "}
                  {formatNumber(analysis.threePhaseDemandedKva)} kVA
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              Phase imbalance is a preliminary screening indicator based on
              diversified single-phase demand. Detailed phase balancing,
              feeder sizing, protection coordination and voltage-drop studies
              should be completed during detailed electrical design.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              4. Demand and capacity assessment
            </h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <tbody className="divide-y divide-slate-100">
                  {[
                    ["Connected load", `${formatNumber(analysis.connectedKw)} kW`],
                    [
                      "Diversified demand",
                      `${formatNumber(analysis.diversifiedKw)} kW`,
                    ],
                    [
                      "Calculated demand factor",
                      `${formatNumber(analysis.demandFactor * 100, 1)}%`,
                    ],
                    [
                      "Design margin",
                      `${designMargin}%`,
                    ],
                    [
                      "Design demand",
                      `${formatNumber(analysis.designDemandKw)} kW`,
                    ],
                    [
                      "System power factor",
                      `${Number(powerFactor || 0.9).toFixed(2)}`,
                    ],
                    [
                      "Calculated load-schedule PF",
                      `${analysis.calculatedLoadPf.toFixed(2)}`,
                    ],
                    [
                      "Design apparent power",
                      `${formatNumber(analysis.apparentPowerKva)} kVA`,
                    ],
                    [
                      "Design current",
                      `${formatNumber(analysis.current, 1)} A`,
                    ],
                    [
                      "Future capacity allowance",
                      `${futureExpansion}%`,
                    ],
                    [
                      "Future design capacity",
                      `${formatNumber(analysis.futureCapacityKva)} kVA`,
                    ],
                    [
                      "Future design current",
                      `${formatNumber(analysis.futureCurrent, 1)} A`,
                    ],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="px-4 py-4 font-medium text-slate-600">
                        {label}
                      </td>
                      <td className="px-4 py-4 text-right font-bold">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                "Transformer planning",
                `${formatNumber(
                  analysis.recommendedTransformerKva,
                  0,
                )} kVA`,
                "Preliminary transformer capacity including future expansion.",
              ],
              [
                "Generator planning",
                `${formatNumber(
                  analysis.recommendedGeneratorKva,
                  0,
                )} kVA`,
                "Preliminary generator reference using a 25% sizing allowance.",
              ],
              [
                "Inverter reference",
                `${formatNumber(
                  analysis.recommendedInverterKva,
                  0,
                )} kVA`,
                "Preliminary inverter reference for system planning.",
              ],
            ].map(([title, value, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold text-slate-500">
                  {title}
                </p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                5. Load category breakdown
              </h2>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3">Category</th>
                      <th className="pb-3 text-right">Connected</th>
                      <th className="pb-3 text-right">Demand</th>
                      <th className="pb-3 text-right">Share</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {analysis.categoryResults.map((item) => (
                      <tr key={item.category}>
                        <td className="py-3 font-medium">
                          {item.category}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(item.connectedKw)} kW
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {formatNumber(item.diversifiedKw)} kW
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(item.percentage, 1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">
                6. Building / zone breakdown
              </h2>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-3">Building</th>
                      <th className="pb-3 text-right">Connected</th>
                      <th className="pb-3 text-right">Demand</th>
                      <th className="pb-3 text-right">Share</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {analysis.buildingResults.map((item) => (
                      <tr key={item.building}>
                        <td className="py-3 font-medium">
                          {item.building}
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(item.connectedKw)} kW
                        </td>
                        <td className="py-3 text-right font-semibold">
                          {formatNumber(item.diversifiedKw)} kW
                        </td>
                        <td className="py-3 text-right">
                          {formatNumber(item.percentage, 1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">
              7. Critical and non-critical load
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Critical load</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(analysis.criticalKw)} kW
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">Non-critical load</p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(analysis.nonCriticalKw)} kW
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Critical share of demand
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {formatNumber(
                    analysis.designDemandKw > 0
                      ? (analysis.criticalKw /
                          analysis.designDemandKw) *
                          100
                      : 0,
                    1,
                  )}
                  %
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-2xl font-bold">
              8. Energy consumption projection
            </h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Daily</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(analysis.dailyEnergyKwh)} kWh
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Monthly</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(analysis.monthlyEnergyKwh)} kWh
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Annual</p>
                <p className="mt-2 text-2xl font-bold">
                  {formatNumber(analysis.annualEnergyKwh)} kWh
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-bold text-amber-950">
              9. Engineering checks
            </h2>

            {analysis.warnings.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-amber-900">
                No basic calculation warnings were detected from the current
                inputs.
              </p>
            ) : (
              <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
                {analysis.warnings.map((warning) => (
                  <li key={warning}>â€¢ {warning}</li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold">
              10. Engineering assumptions and limitations
            </h2>

            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>
                â€¢ Demand and diversity factors are user-defined engineering
                assumptions and should reflect the actual project operating
                characteristics.
              </li>
              <li>
                â€¢ Transformer, generator and inverter values are preliminary
                planning recommendations, not final equipment selections.
              </li>
              <li>
                â€¢ Final electrical design should verify cable ampacity,
                voltage drop, short-circuit withstand, protection coordination,
                earthing, harmonics and applicable standards.
              </li>
              <li>
                â€¢ The analysis does not replace drawings, site measurements,
                utility requirements or statutory approvals.
              </li>
            </ul>
          </section>

            </div>
          )}

          <section className="rounded-2xl bg-slate-950 p-7 text-white">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-sky-300">
              Final analysis
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              Run Load Analysis
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-300">
              When the project schedule is complete, run the full engineering
              analysis to generate the final calculation results and
              professional report.
            </p>

            <button
              type="button"
              onClick={() => {
                if (analysisRun) {
                  router.push("/energy-tools/reports?type=load-analysis");
                  return;
                }

                runLoadAnalysis();
              }}
              disabled={!hydrated}
              className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {analysisRun ? "View Analysis Results" : "Run Load Analysis"}
            </button>
          </section>
        </div>
      </section>
    </main>
  );
}







