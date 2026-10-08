"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SolarResults } from "@/lib/energy-tools/solar/calculate";
import { useSubscription } from "@/lib/subscription/provider";


type Appliance = {
  id: number;
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
  critical: boolean;
};

const APPLIANCE_LIBRARY = [
  { name: "LED Light", watts: 10 },
  { name: "Ceiling Fan", watts: 75 },
  { name: "Television", watts: 120 },
  { name: "Refrigerator", watts: 150 },
  { name: "Freezer", watts: 180 },
  { name: "Air Conditioner", watts: 1200 },
  { name: "Water Pump", watts: 750 },
  { name: "Laptop", watts: 65 },
  { name: "Desktop Computer", watts: 200 },
  { name: "Decoder", watts: 25 },
  { name: "Wi-Fi Router", watts: 15 },
  { name: "Microwave", watts: 1200 },
  { name: "Electric Iron", watts: 1000 },
  { name: "Washing Machine", watts: 500 },
  { name: "Water Heater", watts: 3000 },
  { name: "CCTV System", watts: 60 },
];

const createAppliance = (
  name: string,
  watts: number,
  quantity = 1,
  hoursPerDay = 5,
  critical = true,
): Appliance => ({
  id: Date.now() + Math.random(),
  name,
  watts,
  quantity,
  hoursPerDay,
  critical,
});

export default function SolarPage() {
  const { state, hydrated, consume } = useSubscription();
  const router = useRouter();

  const [appliances, setAppliances] = useState<Appliance[]>([
    createAppliance("LED Light", 10, 6, 6, true),
    createAppliance("Ceiling Fan", 75, 3, 8, true),
    createAppliance("Television", 120, 1, 5, false),
    createAppliance("Refrigerator", 150, 1, 24, true),
    createAppliance("Wi-Fi Router", 15, 1, 24, true),
  ]);

  const [peakSunHours, setPeakSunHours] = useState("4.5");
  const [panelWattage, setPanelWattage] = useState("550");
  const [batteryBackupHours, setBatteryBackupHours] = useState("6");
  const [solarOffset, setSolarOffset] = useState("100");
  const [analysisRun, setAnalysisRun] = useState(false);

  const [results, setResults] =
    useState<SolarResults | null>(null);

  const [calculationLoading, setCalculationLoading] =
    useState(false);

  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;

    const params = new URLSearchParams(window.location.search);

    if (params.get("payment") !== "success") {
      return;
    }

    const raw = sessionStorage.getItem(
      "samiz_solar_pending_calculation",
    );

    if (!raw) {
      return;
    }

    try {
      const saved = JSON.parse(raw) as {
        appliances?: Appliance[];
        peakSunHours?: string;
        panelWattage?: string;
        batteryBackupHours?: string;
        solarOffset?: string;
      };

      if (Array.isArray(saved.appliances)) {
        setAppliances(saved.appliances);
      }

      if (typeof saved.peakSunHours === "string") {
        setPeakSunHours(saved.peakSunHours);
      }

      if (typeof saved.panelWattage === "string") {
        setPanelWattage(saved.panelWattage);
      }

      if (typeof saved.batteryBackupHours === "string") {
        setBatteryBackupHours(saved.batteryBackupHours);
      }

      if (typeof saved.solarOffset === "string") {
        setSolarOffset(saved.solarOffset);
      }

      const hasActivePaidSubscription =
        (state.plan === "starter" ||
          state.plan === "pro" ||
          state.plan === "business") &&
        state.status === "active" &&
        (!state.subscriptionExpiresAt ||
          new Date(state.subscriptionExpiresAt).getTime() >
            Date.now());

      if (hasActivePaidSubscription) {
        setAnalysisRun(true);
        void calculateSolarAnalysis({
          appliances: saved.appliances ?? appliances,
          peakSunHours: saved.peakSunHours ?? peakSunHours,
          panelWattage: saved.panelWattage ?? panelWattage,
          batteryBackupHours:
            saved.batteryBackupHours ?? batteryBackupHours,
          solarOffset: saved.solarOffset ?? solarOffset,
        });
      }
    } catch {
      console.error("Unable to restore pending Solar calculation.");
    } finally {
      sessionStorage.removeItem(
        "samiz_solar_pending_calculation",
      );
      window.history.replaceState(
        {},
        "",
        "/energy-tools/solar",
      );
    }
  }, [hydrated, state]);

  const addAppliance = (name: string, watts: number) => {
    setAppliances((current) => [
      ...current,
      createAppliance(name, watts),
    ]);
  };

  const removeAppliance = (id: number) => {
    setAppliances((current) =>
      current.filter((item) => item.id !== id),
    );
  };

  const updateAppliance = (
    id: number,
    field: keyof Appliance,
    value: string | boolean,
  ) => {
    setAppliances((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        if (field === "critical") {
          return {
            ...item,
            critical: Boolean(value),
          };
        }

        if (field === "name") {
          const selectedAppliance = APPLIANCE_LIBRARY.find(
            (libraryItem) =>
              libraryItem.name.toLowerCase() ===
              String(value).trim().toLowerCase(),
          );

          return {
            ...item,
            name: String(value),
            ...(selectedAppliance
              ? { watts: selectedAppliance.watts }
              : {}),
          };
        }

        const numericValue = Math.max(
          0,
          Number(value) || 0,
        );

        return {
          ...item,
          [field]: numericValue,
        };
      }),
    );
  };

  const runSolarAnalysis = () => {
    if (!hydrated) return;

    const hasActivePaidSubscription =
      (state.plan === "starter" ||
        state.plan === "pro" ||
        state.plan === "business") &&
      state.status === "active" &&
      (!state.subscriptionExpiresAt ||
        new Date(state.subscriptionExpiresAt).getTime() >
          Date.now());

    if (hasActivePaidSubscription) {
      setAnalysisRun(true);
      void calculateSolarAnalysis();
      return;
    }

    sessionStorage.setItem(
      "samiz_solar_pending_calculation",
      JSON.stringify({
        appliances,
        peakSunHours,
        panelWattage,
        batteryBackupHours,
        solarOffset,
      }),
    );

    router.push(
      "/pricing?returnTo=/energy-tools/solar?payment=success",
    );
  };

  const generateSolarReport = () => {
    if (!analysisRun) return;

    sessionStorage.setItem(
      "samiz_solar_report",
      JSON.stringify({
        createdAt: new Date().toISOString(),
        appliances,
        peakSunHours,
        panelWattage,
        batteryBackupHours,
        solarOffset,
        results,
      }),
    );

    router.push("/energy-tools/solar/report");
  };

  const calculateSolarAnalysis = async (
    input = {
      appliances,
      peakSunHours,
      panelWattage,
      batteryBackupHours,
      solarOffset,
    },
  ) => {
    setCalculationLoading(true);
    setCalculationError(null);

    try {
      const response = await fetch(
        "/api/energy-tools/solar/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            ...input,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to calculate the solar assessment.",
        );
      }

      setResults(data.results as SolarResults);
    } catch (error) {
      console.error(
        "Solar assessment calculation failed:",
        error,
      );

      setResults(null);

      setCalculationError(
        error instanceof Error
          ? error.message
          : "Unable to calculate the solar assessment.",
      );
    } finally {
      setCalculationLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">

      {/* HERO */}
      <section className="bg-[#07111f]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
            Samiz Solar Planning Tool
          </p>

          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Find out how much solar your home or business may need.
          </h1>

          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 lg:text-lg">
            You don&apos;t need to know your monthly electricity
            consumption. Tell us what appliances you use,
            and Samiz will estimate your energy demand,
            solar panels, inverter and battery requirement.
          </p>

          <div className="mt-7 grid max-w-4xl gap-3 sm:grid-cols-3">
            <HeroPoint
              number="01"
              text="Add your appliances"
            />
            <HeroPoint
              number="02"
              text="Tell us how long you use them"
            />
            <HeroPoint
              number="03"
              text="Get your solar recommendation"
            />
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          {/* APPLIANCES */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Step 1
              </p>

              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                What do you want to power?
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Add the appliances you normally use. You
                don&apos;t need to know their exact power rating;
                Samiz provides starting values that you can
                adjust.
              </p>
            </div>

            {/* QUICK ADD */}
            <div className="mt-6">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                Quick add appliances
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {APPLIANCE_LIBRARY.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() =>
                      addAppliance(
                        item.name,
                        item.watts,
                      )
                    }
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>

            <datalist id="solar-appliance-options">
              {APPLIANCE_LIBRARY.map((item) => (
                <option
                  key={item.name}
                  value={item.name}
                />
              ))}
            </datalist>

            {/* APPLIANCE LIST */}
            <div className="mt-7 space-y-4">
              {appliances.map((appliance, index) => (
                <div
                  key={appliance.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                        Appliance {index + 1}
                      </p>

                      <p className="mt-1 text-base font-black text-slate-950">
                        {appliance.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        removeAppliance(
                          appliance.id,
                        )
                      }
                      className="rounded-lg px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-slate-500">
                        Appliance
                      </label>

                      <input
                        list="solar-appliance-options"
                        value={appliance.name}
                        onChange={(event) =>
                          updateAppliance(
                            appliance.id,
                            "name",
                            event.target.value,
                          )
                        }
                        placeholder="Select or type appliance"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />

                      <p className="mt-1 text-[11px] text-slate-500">
                        Select from the list or type your own appliance
                      </p>
                    </div>

                    <InputField
                      label="Power"
                      value={String(
                        appliance.watts,
                      )}
                      onChange={(value) =>
                        updateAppliance(
                          appliance.id,
                          "watts",
                          value,
                        )
                      }
                      suffix="W"
                      type="number"
                    />

                    <InputField
                      label="Quantity"
                      value={String(
                        appliance.quantity,
                      )}
                      onChange={(value) =>
                        updateAppliance(
                          appliance.id,
                          "quantity",
                          value,
                        )
                      }
                      type="number"
                      min="1"
                    />

                    <InputField
                      label="Hours per day"
                      value={String(
                        appliance.hoursPerDay,
                      )}
                      onChange={(value) =>
                        updateAppliance(
                          appliance.id,
                          "hoursPerDay",
                          value,
                        )
                      }
                      suffix="hrs"
                      type="number"
                      min="0"
                      max="24"
                      step="0.5"
                    />
                  </div>

                  <label className="mt-4 flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={appliance.critical}
                      onChange={(event) =>
                        updateAppliance(
                          appliance.id,
                          "critical",
                          event.target.checked,
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                    />

                    <span className="text-sm font-bold text-slate-700">
                      Keep this appliance on during
                      power backup
                    </span>
                  </label>

                  <div className="mt-4 rounded-xl bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-bold text-slate-500">
                        Estimated daily energy
                      </span>

                      <span className="text-sm font-black text-slate-900">
                        {(
                          (appliance.watts *
                            appliance.quantity *
                            appliance.hoursPerDay) /
                          1000
                        ).toFixed(2)}{" "}
                        kWh
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                addAppliance(
                  "New Appliance",
                  100,
                )
              }
              className="mt-5 w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm font-black text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
            >
              + Add another appliance
            </button>

            {/* SETTINGS */}
            <div className="mt-8 border-t border-slate-200 pt-8">
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Step 2
              </p>

              <h2 className="mt-2 text-xl font-black sm:text-2xl">
                Solar and backup preferences
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <InputField
                  label="Peak sun hours"
                  value={peakSunHours}
                  onChange={setPeakSunHours}
                  suffix="hrs/day"
                  type="number"
                  min="1"
                  max="8"
                  step="0.1"
                />

                <InputField
                  label="Solar target"
                  value={solarOffset}
                  onChange={setSolarOffset}
                  suffix="%"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                />

                <InputField
                  label="Panel size"
                  value={panelWattage}
                  onChange={setPanelWattage}
                  suffix="W"
                  type="number"
                  min="100"
                  step="10"
                />
              </div>

              <div className="mt-4 max-w-sm">
                <InputField
                  label="Desired battery backup"
                  value={batteryBackupHours}
                  onChange={setBatteryBackupHours}
                  suffix="hours"
                  type="number"
                  min="1"
                  max="48"
                  step="1"
                />
              </div>

              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-black uppercase tracking-wider text-blue-700">
                  We do the calculations
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Samiz estimates your energy consumption
                  from the appliances you entered. You do
                  not need to know your monthly kWh before
                  using this tool.
                </p>
              </div>
          </div>

          {/* RESULTS */}
          <aside className="min-w-0 rounded-2xl bg-[#07111f] p-4 text-white shadow-sm sm:p-6 lg:sticky lg:top-6 lg:p-8">
            <p className="text-xs font-black uppercase tracking-wider text-blue-400">
              Step 3
            </p>

            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              Your estimated energy requirement
            </h2>

            {analysisRun && results && (
              <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DarkMetric
                label="Daily consumption"
                value={`${results.dailyEnergy.toFixed(1)} kWh`}
              />

              <DarkMetric
                label="Monthly consumption"
                value={`${results.monthlyEnergy.toFixed(0)} kWh`}
              />

              <DarkMetric
                label="Estimated peak load"
                value={`${results.peakLoad.toFixed(1)} kW`}
              />

              <DarkMetric
                label="Critical backup load"
                value={`${(results.criticalLoad / 1000).toFixed(1)} kW`}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Recommended solar system
              </p>

              <p className="mt-2 text-4xl font-black sm:text-5xl">
                {results.installedSolar.toFixed(2)} kWp
              </p>

              <p className="mt-2 text-sm text-slate-300">
                Based on approximately{" "}
                <strong className="text-white">
                  {results.panelCount} x {results.panel.toFixed(0)} W solar panels.
                </strong>{" "}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DarkMetric
                label="Solar panels"
                value={`${results.panelCount} x ${results.panel.toFixed(0)} W`}
              />

              <DarkMetric
                label="Inverter"
                value={`${results.recommendedInverter} kVA`}
              />

              <DarkMetric
                label="Battery"
                value={`${results.recommendedBatteryKwh.toFixed(2)} kWh`}
              />

              <DarkMetric
                label="Target solar coverage"
                value={`${Math.min(
                  100,
                  results.solarCoverage,
                ).toFixed(0)}%`}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Expected backup
              </p>

              <p className="mt-2 text-3xl font-black">
                {results.estimatedBackupAtCriticalLoad.toFixed(
                  1,
                )} hours
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Estimated backup when only the appliances
                marked as critical are running. Actual
                backup depends on battery condition,
                inverter efficiency and real-world load.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
              <p className="text-xs font-black uppercase tracking-wider text-emerald-300">
                Estimated solar production
              </p>

              <p className="mt-2 text-2xl font-black">
                {results.estimatedDailyGeneration.toFixed(
                  1,
                )}{" "}
                kWh/day
              </p>

              <p className="mt-1 text-sm text-slate-300">
                Approximately{" "}
                {results.monthlyGeneration.toFixed(0)}{" "}
                kWh/month under the selected assumptions.
              </p>
            </div>
              </>
            )}

            <button
              type="button"
              onClick={
                analysisRun
                  ? generateSolarReport
                  : runSolarAnalysis
              }
              disabled={!hydrated}
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {!hydrated
                ? "Loading..."
                : analysisRun
                  ? "Generate Solar Report"
                  : "Calculate My Solar System"}
            </button>

            {!analysisRun && (
              <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                Your appliance information is used to
                estimate your energy demand and recommend
                a starting system.
              </p>
            )}
          </aside>
        </div>

        {/* EXPLANATION */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <InfoCard
            number="01"
            title="We estimate your electricity usage"
            text="Instead of asking you for monthly kWh, Samiz calculates energy demand from the appliances you actually use."
          />

          <InfoCard
            number="02"
            title="We calculate the solar panels"
            text="Your estimated energy demand, solar resource and selected panel wattage are used to determine a practical starting PV array."
          />

          <InfoCard
            number="03"
            title="We size the backup system"
            text="Critical loads and your desired backup duration are used to estimate a suitable inverter and battery starting point."
          />
        </div>

        </div>
      </section>
    </div>
  );
}

function HeroPoint({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <span className="text-xs font-black text-blue-400">
        {number}
      </span>

      <p className="mt-1 text-sm font-bold text-white">
        {text}
      </p>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type: "text" | "number";
  suffix?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-bold text-slate-600">
        {label}
      </span>

      <div className="flex min-w-0">
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 ${
            suffix ? "rounded-r-none" : ""
          }`}
        />

        {suffix && (
          <span className="flex shrink-0 items-center rounded-r-xl border border-l-0 border-slate-300 bg-slate-100 px-3 text-xs font-bold text-slate-500">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

function DarkMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-lg font-black text-white sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-black text-blue-700">
        {number}
      </div>

      <h3 className="mt-4 text-lg font-black">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

