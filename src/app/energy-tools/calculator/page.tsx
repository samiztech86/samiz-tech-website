"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CalculatorResults } from "@/lib/energy-tools/calculator/calculate";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useSubscription } from "@/lib/subscription/provider";
import { checkToolAccess } from "@/lib/subscription/access";
type Appliance = {
  id: number;
  name: string;
  quantity: number;
  watts: number;
  hoursPerDay: number;
  critical: boolean;
  surgeWatts: number;
};


type MeterIdentifierType =
  | "Meter ID"
  | "IEC / Serial"
  | "Account Number"
  | "None";

type Meter = {
  identifierType: MeterIdentifierType;
  identifier: string;
  previousReading: number;
  currentReading: number;
  days: number;
};

type MeterHistoryEntry = {
  id: number;
  date: string;
  meterType: "Main Grid" | "Common Area";
  areaName?: string;
  meterIdentifier: string;
  previousReading: number;
  currentReading: number;
  unitsUsed: number;
  days: number;
  averageDailyUsage: number;
};

type Area = {
  id: number;
  name: string;
  common: boolean;
  appliances: Appliance[];
  meter?: Meter;
};

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

const starterAppliances = [
  // Lighting
  "Light / LED Bulb",
  "LED Panel Light",
  "LED Downlight",
  "LED Floodlight",
  "LED Tube Light",
  "Fluorescent Tube Light",
  "Halogen Light",
  "Incandescent Bulb",
  "Emergency Light",
  "Street Light",
  "Security Light",
  "Outdoor Lighting",
  "Garden Lighting",
  "Parking Lot Lighting",
  "Signage Lighting",

  // Fans and ventilation
  "Ceiling Fan",
  "Standing Fan",
  "Table Fan",
  "Wall Fan",
  "Exhaust Fan",
  "Industrial Fan",
  "Ventilation Fan",
  "Extractor Hood",
  "Air Curtain",

  // Entertainment and home electronics
  "Television",
  "Smart TV",
  "Decoder / Set-Top Box",
  "Satellite Dish",
  "Sound System",
  "Home Theatre",
  "Gaming Console",
  "DVD / Blu-ray Player",
  "Radio",
  "Bluetooth Speaker",
  "Projector",
  "Streaming Device",

  // Computing and office
  "Computer / Desktop",
  "Laptop",
  "All-in-One Computer",
  "Monitor",
  "Printer",
  "Laser Printer",
  "Photocopier",
  "Scanner",
  "Plotter",
  "Fax Machine",
  "Server / Network Equipment",
  "Network Switch",
  "Wi-Fi Router",
  "Modem",
  "UPS",
  "Desktop UPS",
  "Phone Charger",
  "Power Bank Charger",
  "Tablet Charger",
  "POS Terminal",
  "Barcode Scanner",
  "Receipt Printer",
  "CCTV Monitor",

  // Cooling
  "Air Conditioner",
  "Split Air Conditioner",
  "Window Air Conditioner",
  "Portable Air Conditioner",
  "Standing Air Conditioner",
  "Industrial Air Conditioner",
  "Refrigerator",
  "Freezer",
  "Chest Freezer",
  "Display Freezer",
  "Commercial Refrigerator",
  "Cold Room",
  "Cold Room Compressor",
  "Ice Maker",
  "Water Cooler",

  // Kitchen and cooking
  "Microwave",
  "Electric Oven",
  "Gas Cooker Ignition",
  "Electric Cooker",
  "Induction Cooker",
  "Hot Plate",
  "Electric Kettle",
  "Toaster",
  "Sandwich Maker",
  "Blender",
  "Food Processor",
  "Air Fryer",
  "Rice Cooker",
  "Coffee Maker",
  "Coffee Machine",
  "Electric Grill",
  "Deep Fryer",
  "Food Warmer",
  "Bain Marie",
  "Dishwasher",
  "Commercial Dishwasher",
  "Warming Cabinet",
  "Electric Steamer",
  "Juicer",

  // Laundry and household
  "Washing Machine",
  "Commercial Washing Machine",
  "Dryer",
  "Clothes Dryer",
  "Iron",
  "Pressing Iron",
  "Steam Iron",
  "Industrial Iron",
  "Vacuum Cleaner",
  "Industrial Vacuum Cleaner",
  "Water Dispenser",
  "Water Heater",
  "Electric Shower",
  "Hair Dryer",
  "Hair Clipper",
  "Electric Shaver",

  // Water and pumping
  "Water Pump",
  "Borehole Pump",
  "Booster Pump",
  "Pressure Pump",
  "Submersible Pump",
  "Surface Pump",
  "Pool Pump",
  "Pool Heater",
  "Sewage / Drainage Pump",
  "Sump Pump",
  "Transfer Pump",
  "Irrigation Pump",
  "Fire Pump",
  "Hydro Booster System",

  // Security and access control
  "CCTV Camera",
  "CCTV DVR / NVR",
  "Security Alarm",
  "Electric Gate",
  "Gate Motor",
  "Automatic Gate",
  "Electric Fence",
  "Access Control System",
  "Biometric Access Control",
  "Card Reader",
  "Intercom System",
  "Video Intercom",
  "Door Access System",
  "Security Scanner",

  // ICT and communications
  "Server Rack",
  "Data Center Equipment",
  "Network Rack",
  "Network Equipment",
  "Wi-Fi Access Point",
  "Radio Communication Equipment",
  "PABX System",
  "Telephone System",
  "Public Address System",

  // Medical / healthcare
  "Medical Refrigerator",
  "Medical Freezer",
  "Oxygen Concentrator",
  "Medical Ventilator",
  "Patient Monitor",
  "ECG Machine",
  "Ultrasound Machine",
  "X-Ray Machine",
  "Laboratory Equipment",
  "Autoclave",
  "Medical Suction Pump",
  "Dental Chair",
  "Operating Theatre Equipment",

  // Hotel / hospitality
  "Hotel Room TV",
  "Hotel Mini Fridge",
  "Hotel Hair Dryer",
  "Hotel Kettle",
  "Hotel Safe",
  "Commercial Ice Maker",
  "Commercial Oven",

  "Commercial Freezer",
  "Laundry Equipment",
  "Hotel Water Heater",
  "Boiler",
  "Steam Generator",

  // School / education
  "Interactive Display",
  "Smart Board",
  "Classroom Projector",

  "Computer Lab PC",
  "Computer Lab Monitor",
  "School PA System",

  // Industrial and workshop
  "Electric Motor",
  "Industrial Motor",
  "Air Compressor",
  "Compressor",
  "Welding Machine",
  "Arc Welder",
  "MIG Welder",
  "Plasma Cutter",
  "Drilling Machine",
  "Bench Grinder",
  "Angle Grinder",
  "Cutting Machine",
  "Lathe Machine",
  "Milling Machine",
  "CNC Machine",
  "Hydraulic Pump",
  "Industrial Heater",
  "Industrial Oven",
  "Conveyor Motor",
  "Packaging Machine",
  "Production Machine",
  "Machine Tool",
  "Workshop Equipment",

  // Agriculture
  "Agricultural Pump",
  "Irrigation System",
  "Farm Water Pump",
  "Poultry Ventilation Fan",
  "Poultry Feeder",
  "Poultry Drinker System",
  "Incubator",
  "Milking Machine",
  "Feed Mill",
  "Grain Dryer",
  "Grain Mill",
  "Cold Storage Equipment",

  // Building / facility systems
  "Elevator",
  "Escalator",
  "Automatic Door",
  "Turnstile",
  "Building Management System",
  "Fire Alarm System",
  "Fire Detection System",
  "Smoke Extraction Fan",
  "Smoke Detector System",
  "Emergency Lighting System",
  "Street Lighting System",
  "Parking Barrier",
  "Parking System",
  "Car Park Lighting",

  // Power and electrical equipment
  "UPS System",
  "Inverter",
  "Solar Inverter",
  "Battery Charger",
  "Battery Bank",
  "Solar PV System",
  "Automatic Changeover",
  "Manual Changeover",
  "Distribution Board",
  "Sub Distribution Board",
  "Electrical Control Panel",
  "Motor Control Panel",
  "Transformer Auxiliary Load",
  "Power Factor Correction System",

  // Other

  "Other Appliance",
];

const defaultSurgeFactor = (name: string) => {
  const normalized = name.toLowerCase();
  if (
    normalized.includes("refrigerator") ||
    normalized.includes("freezer") ||
    normalized.includes("pump") ||
    normalized.includes("air conditioner") ||
    normalized.includes("compressor") ||
    normalized.includes("water heater")
  ) {
    return 3;
  }
  if (normalized.includes("washing") || normalized.includes("microwave") || normalized.includes("iron")) {
    return 1.5;
  }
  return 1;
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

export default function CalculatorPage() {
  const { state: subscriptionState, hydrated: subscriptionHydrated } = useSubscription();
  const router = useRouter();
  const [propertyName, setPropertyName] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [solarPanelWatts, setSolarPanelWatts] = useState(550);
  const [peakSunHours, setPeakSunHours] = useState(4.5);
  const [pvEfficiency, setPvEfficiency] = useState(0.8);
  const [backupDuration, setBackupDuration] = useState(6);
  const [powerFactor, setPowerFactor] = useState(0.8);
  const [inverterMargin, setInverterMargin] = useState(0.2);
  const [batteryEfficiency, setBatteryEfficiency] = useState(0.9);
  const [batteryDoD, setBatteryDoD] = useState(0.8);
  const [batteryUnitKwh, setBatteryUnitKwh] = useState(5.12);
  const [batteryChemistry, setBatteryChemistry] = useState<
    "LiFePO4" | "Lead-acid"
  >("LiFePO4");
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
  const [gridMeter, setGridMeter] = useState<Meter>({
    identifierType: "None",
    identifier: "",
    previousReading: 0,
    currentReading: 0,
    days: 30,
  });
  const [meterHistory, setMeterHistory] = useState<MeterHistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const saved = localStorage.getItem("samiz_energy_meter_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });



  const [areas, setAreas] = useState<Area[]>([
    {
      id: 1,
      name: "Living Room",
      common: false,
      appliances: [
        {
          id: 1,
          name: "Television",
          quantity: 1,
          watts: 120,
          hoursPerDay: 5,
          critical: true,
          surgeWatts: 120,
        },
        {
          id: 2,
          name: "Fan",
          quantity: 1,
          watts: 80,
          hoursPerDay: 8,
          critical: true,
          surgeWatts: 80,
        },
        {
          id: 3,
          name: "Light",
          quantity: 4,
          watts: 12,
          hoursPerDay: 6,
          critical: true,
          surgeWatts: 12,
        },
      ],
    },
  ]);

  const createMeter = (): Meter => ({
    identifierType: "None",
    identifier: "",
    previousReading: 0,
    currentReading: 0,
    days: 30,
  });

  const addArea = (common = false) => {
    setAreas((current) => [
      ...current,
      {
        id: current.length
          ? Math.max(...current.map((area) => area.id)) + 1
          : 1,
        name: common ? "New Common Area" : "New Area",
        common,
        appliances: [],
        ...(common ? { meter: createMeter() } : {}),
      },
    ]);
  };

  const removeArea = (areaId: number) => {
    setAreas((current) => current.filter((area) => area.id !== areaId));
  };

  const updateAreaName = (areaId: number, name: string) => {
    setAreas((current) =>
      current.map((area) => (area.id === areaId ? { ...area, name } : area)),
    );
  };

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

  const saveGeneratorReading = (generatorId: number) => {
    const generator = generators.find((item) => item.id === generatorId);
    if (!generator) return;
    const openingRuntime = Math.max(0, Number(generator.openingRuntime));
    const closingRuntime = Math.max(0, Number(generator.closingRuntime));
    if (closingRuntime < openingRuntime) {
      alert("Closing runtime cannot be lower than the opening runtime.");
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
      generatorName: generator.name || "Unnamed Generator",
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
          ? { ...item, openingRuntime: closingRuntime, closingRuntime }
          : item,
      ),
    );
    alert(
      `${generator.name || "Generator"} reading saved successfully. The closing reading is now set as the new opening reading.`,
    );
  };

  const deleteGeneratorHistoryEntry = (entryId: number) => {
    if (
      !confirm("Are you sure you want to delete this saved generator reading?")
    )
      return;
    setGeneratorHistory((current) => {
      const updated = current.filter((entry) => entry.id !== entryId);
      localStorage.setItem(
        "samiz_energy_generator_history",
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const updateGenerator = (
    generatorId: number,
    field: keyof Generator,
    value: string | number,
  ) => {
    setGenerators((current) =>
      current.map((generator) => {
        if (generator.id !== generatorId) return generator;
        if (field === "name" || field === "fuelType")
          return { ...generator, [field]: value };
        return { ...generator, [field]: Math.max(0, Number(value)) };
      }),
    );
  };

  const updateGridMeter = (field: keyof Meter, value: string | number) => {
    setGridMeter((current) => ({
      ...current,
      [field]:
        field === "previousReading" ||
        field === "currentReading" ||
        field === "days"
          ? Math.max(0, Number(value))
          : value,
    }));
  };

  const saveMeterReading = () => {
    const previousReading = Math.max(0, Number(gridMeter.previousReading));
    const currentReading = Math.max(0, Number(gridMeter.currentReading));
    const days = Math.max(1, Number(gridMeter.days));
    if (currentReading < previousReading) {
      alert("Current meter reading cannot be lower than the previous reading.");
      return;
    }
    if (currentReading === previousReading) {
      alert(
        "The current and previous readings are the same. Enter a new meter reading.",
      );
      return;
    }
    const unitsUsed = currentReading - previousReading;
    const averageDailyUsage = unitsUsed / days;
    const entry: MeterHistoryEntry = {
      id: 1,
      date: new Date().toISOString(),
      meterType: "Main Grid",
      meterIdentifier: gridMeter.identifier || "Main Grid Meter",
      previousReading,
      currentReading,
      unitsUsed,
      days,
      averageDailyUsage,
    };
    setMeterHistory((current) => {
      const updated = [entry, ...current];
      localStorage.setItem(
        "samiz_energy_meter_history",
        JSON.stringify(updated),
      );
      return updated;
    });
    alert("Main grid meter reading saved successfully.");
  };

  const saveAreaMeterReading = (areaId: number) => {
    const area = areas.find((a) => a.id === areaId);
    if (!area || !area.meter) return;
    const previousReading = Math.max(0, Number(area.meter.previousReading));
    const currentReading = Math.max(0, Number(area.meter.currentReading));
    const days = Math.max(1, Number(area.meter.days));
    if (currentReading < previousReading) {
      alert("Current meter reading cannot be lower than the previous reading.");
      return;
    }
    if (currentReading === previousReading) {
      alert(
        "The current and previous readings are the same. Enter a new meter reading.",
      );
      return;
    }
    const unitsUsed = currentReading - previousReading;
    const averageDailyUsage = unitsUsed / days;
    const entry: MeterHistoryEntry = {
      id: 1,
      date: new Date().toISOString(),
      meterType: "Common Area",
      areaName: area.name,
      meterIdentifier: area.meter.identifier || "Sub-meter",
      previousReading,
      currentReading,
      unitsUsed,
      days,
      averageDailyUsage,
    };
    setMeterHistory((current) => {
      const updated = [entry, ...current];
      localStorage.setItem(
        "samiz_energy_meter_history",
        JSON.stringify(updated),
      );
      return updated;
    });
    alert(`Meter reading for ${area.name} saved successfully.`);
  };

  const deleteMeterHistoryEntry = (entryId: number) => {
    if (!confirm("Are you sure you want to delete this saved reading?")) return;
    setMeterHistory((current) => {
      const updated = current.filter((entry) => entry.id !== entryId);
      localStorage.setItem(
        "samiz_energy_meter_history",
        JSON.stringify(updated),
      );
      return updated;
    });
  };

  const updateAreaMeter = (
    areaId: number,
    field: keyof Meter,
    value: string | number,
  ) => {
    setAreas((current) =>
      current.map((area) => {
        if (area.id !== areaId || !area.meter) return area;
        return {
          ...area,
          meter: {
            ...area.meter,
            [field]:
              field === "previousReading" ||
              field === "currentReading" ||
              field === "days"
                ? Math.max(0, Number(value))
                : value,
          },
        };
      }),
    );
  };

  const addAppliance = (areaId: number) => {
    setAreas((current) =>
      current.map((area) =>
        area.id === areaId
          ? {
              ...area,
              appliances: [
                ...area.appliances,
                {
                  id: area.appliances.length
                    ? Math.max(
                        ...area.appliances.map((appliance) => appliance.id),
                      ) + 1
                    : 1,
                  name: "Light / LED Bulb",
                  quantity: 1,
                  watts: 100,
                  hoursPerDay: 1,
                  critical: true,
                  surgeWatts: 100,
                },
              ],
            }
          : area,
      ),
    );
  };

  const removeAppliance = (areaId: number, applianceId: number) => {
    setAreas((current) =>
      current.map((area) =>
        area.id === areaId
          ? {
              ...area,
              appliances: area.appliances.filter(
                (appliance) => appliance.id !== applianceId,
              ),
            }
          : area,
      ),
    );
  };

  const updateAppliance = (
    areaId: number,
    applianceId: number,
    field: keyof Appliance,
    value: string | number | boolean,
  ) => {
    setAreas((current) =>
      current.map((area) =>
        area.id === areaId
          ? {
              ...area,
              appliances: area.appliances.map((appliance) => {
                if (appliance.id !== applianceId) return appliance;
                if (field === "name") {
                  const newName = String(value);
                  const factor = defaultSurgeFactor(newName);
                  return {
                    ...appliance,
                    name: newName,
                    surgeWatts: Math.max(
                      appliance.watts,
                      appliance.watts * factor,
                    ),
                  };
                }
                if (field === "watts") {
                  const newWatts = Math.max(0, Number(value));
                  const factor = defaultSurgeFactor(appliance.name);
                  return {
                    ...appliance,
                    watts: newWatts,
                    surgeWatts: Math.max(newWatts, newWatts * factor),
                  };
                }
                if (field === "critical") {
                  return { ...appliance, critical: Boolean(value) };
                }
                if (field === "hoursPerDay") {
                  return { ...appliance, hoursPerDay: Math.min(24, Math.max(0, Number(value))) };
                }
                return { ...appliance, [field]: Math.max(0, Number(value)) };
              }),
            }
          : area,
      ),
    );
  };


  const [results, setResults] =
    useState<CalculatorResults | null>(null);

  const [calculationLoading, setCalculationLoading] =
    useState(false);

  const [calculationError, setCalculationError] =
    useState<string | null>(null);

  const [showOverallCalculation, setShowOverallCalculation] =
    useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("samiz_energy_report_flow") === "1") {
      setShowOverallCalculation(true);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("samiz_energy_report_flow") !== "1") {
      return;
    }

    try {
      const saved = localStorage.getItem("samiz_energy_assessment");
      if (!saved) return;

      const report = JSON.parse(saved);

      if (report.propertyName) setPropertyName(report.propertyName);
      if (report.propertyType) setPropertyType(report.propertyType);
      if (Array.isArray(report.areas)) setAreas(report.areas);
      if (Array.isArray(report.generators)) setGenerators(report.generators);
      if (Array.isArray(report.generatorHistory)) {
        setGeneratorHistory(report.generatorHistory);
      }
      if (report.gridMeter) setGridMeter(report.gridMeter);
      if (Array.isArray(report.meterHistory)) {
        setMeterHistory(report.meterHistory);
      }

      if (report.designInputs) {
        setSolarPanelWatts(report.designInputs.solarPanelWatts);
        setPeakSunHours(report.designInputs.peakSunHours);
        setPvEfficiency(report.designInputs.pvEfficiency);
        setBackupDuration(report.designInputs.backupDuration);
        setPowerFactor(report.designInputs.powerFactor);
        setInverterMargin(report.designInputs.inverterMargin);
        setBatteryEfficiency(report.designInputs.batteryEfficiency);
        setBatteryDoD(report.designInputs.batteryDoD);
        setBatteryUnitKwh(report.designInputs.batteryUnitKwh);
        setBatteryChemistry(report.designInputs.batteryChemistry);
      }

      if (report.results) setResults(report.results);
    } catch (error) {
      console.error("Unable to restore saved energy assessment:", error);
    }
  }, []);

  const calculateAssessment = async (): Promise<CalculatorResults | null> => {
    setCalculationLoading(true);
    setCalculationError(null);

    try {
      const response = await fetch(
        "/api/energy-tools/calculator/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({
            areas,
            gridMeter,
            generators,
            solarPanelWatts,
            peakSunHours,
            pvEfficiency,
            backupDuration,
            powerFactor,
            inverterMargin,
            batteryEfficiency,
            batteryDoD,
            batteryUnitKwh,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to calculate the energy assessment.",
        );
      }

      const calculatedResults =
        data.results as CalculatorResults;

      setResults(calculatedResults);

      return calculatedResults;
    } catch (error) {
      console.error(
        "Energy assessment calculation failed:",
        error,
      );

      setResults(null);

      setCalculationError(
        error instanceof Error
          ? error.message
          : "Unable to calculate the energy assessment.",
      );

      return null;
    } finally {
      setCalculationLoading(false);
    }
  };

  useEffect(() => {
    if (!showOverallCalculation || !subscriptionHydrated) {
      return;
    }

    const access = checkToolAccess({
      plan: subscriptionState.plan,
      coins: subscriptionState.coins,
      tool: "calculator",
    });

    if (!access.allowed) {
      return;
    }

    void calculateAssessment();
  }, [
    showOverallCalculation,
    subscriptionHydrated,
    subscriptionState.plan,
    subscriptionState.coins,
    areas,
    gridMeter,
    generators,
    solarPanelWatts,
    peakSunHours,
    pvEfficiency,
    backupDuration,
    powerFactor,
    inverterMargin,
    batteryEfficiency,
    batteryDoD,
    batteryUnitKwh,
  ]);

  const prepareEnergyReport = () => {
    sessionStorage.setItem(
      "samiz_energy_report_flow",
      "1",
    );

    setShowOverallCalculation(true);
  };
  const generateEnergyReport = async () => {
    let currentResults = results;

    if (!currentResults) {
      currentResults = await calculateAssessment();
    }

    if (!currentResults) {
      setCalculationError(
        "Please calculate the energy assessment before generating the report.",
      );
      return;
    }

    const report = {
      id: 1,
      createdAt: new Date().toISOString(),
      propertyName: propertyName.trim() || "Unnamed Property",
      propertyType,
      generators,
      generatorHistory,
      areas,
      gridMeter,
      meterHistory,
      designInputs: {
        solarPanelWatts,
        peakSunHours,
        pvEfficiency,
        backupDuration,
        powerFactor,
        inverterMargin,
        batteryEfficiency,
        batteryDoD,
        batteryUnitKwh,
        batteryChemistry,
      },
      results: currentResults,
    };

    localStorage.setItem(
      "samiz_energy_assessment",
      JSON.stringify(report),
    );

    const existingHistory = JSON.parse(
      localStorage.getItem("samiz_energy_history") || "[]",
    );

    const updatedHistory = [report, ...existingHistory];

    localStorage.setItem(
      "samiz_energy_history",
      JSON.stringify(updatedHistory),
    );

    router.push("/energy-tools/reports");
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50 text-slate-950">
      {/* HERO BANNER */}
      <section className="bg-[#07111f]">
        <div className="mx-auto w-full max-w-7xl px-3 py-8 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400 sm:text-xs">
            Energy Assessment
          </p>
          <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-white sm:mt-4 sm:text-4xl lg:text-6xl">
            Build your property&apos;s energy profile.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
            Enter your property structure, appliance loads, common-area meter
            readings and main grid energy data to build a practical energy
            profile.
          </p>

          <div className="mt-6">
          </div>
        </div>
      </section>

      {/* MAIN CALCULATOR CONTENT */}
      <div className="mx-auto w-full max-w-7xl px-3 py-6 sm:px-6 sm:py-10 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:px-8">
        <div className="space-y-5 sm:space-y-8">
          {/* 01: PROPERTY */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              01
            </p>
            <h2 className="mt-2 text-lg font-black sm:text-2xl">
              Property details
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Tell us what you are assessing.
            </p>
            <div className="mt-5 grid gap-4 sm:mt-7 sm:grid-cols-2 sm:gap-5">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Property name
                </span>
                <input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  placeholder="e.g. My Family House"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:px-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">
                  Property type
                </span>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 sm:px-4"
                >
                  <option>Residential</option>
                  <option>Apartment</option>
                  <option>Estate</option>
                  <option>Office</option>
                  <option>School</option>
                  <option>Hospital</option>
                  <option>Hotel</option>
                  <option>Commercial</option>
                  <option>Industrial</option>
                  <option>Other</option>
                </select>
              </label>
            </div>
          </section>

          {/* 02: AREAS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
                  02
                </p>
                <h2 className="mt-2 text-lg font-black sm:text-2xl">
                  Property areas
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  Normal areas use appliance estimates. Common areas use their
                  actual meter readings.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
<button
                  type="button"
                  onClick={() => addArea(false)}
                  className="rounded-lg border border-slate-300 px-3 py-2.5 text-xs font-bold hover:border-blue-500 hover:text-blue-600 sm:px-4 sm:text-sm"
                >
                  + Add Area
                </button>
                <button
                  type="button"
                  onClick={() => addArea(true)}
                  className="rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  + Add Common Area
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-4 sm:mt-8 sm:space-y-6">
              {areas.map((area) => (
                <div
                  key={area.id}
                  className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm sm:p-6 [&+div]:mt-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-2 sm:gap-3">
                      <input
                        value={area.name}
                        onChange={(e) => updateAreaName(area.id, e.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 sm:text-base"
                      />
                      {area.common && (
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 sm:px-3">
                          Metered
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeArea(area.id)}
                      className="self-start text-xs font-bold text-red-500 hover:text-red-700 sm:self-auto"
                    >
                      Remove area
                    </button>
                  </div>
                  {false ? (
                    <CommonAreaMeter
                      area={area}
                      onUpdate={updateAreaMeter}
                      onSaveReading={saveAreaMeterReading}
                    />
                  ) : (
                    <>
                      {/* Mobile: card-based appliance list */}
                      <div className="mt-4 space-y-3 sm:hidden">
                        {area.appliances.map((appliance) => {

                          return (
                            <div
                              key={appliance.id}
                              className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <select
                                  value={appliance.name}
                                  onChange={(e) =>
                                    updateAppliance(
                                      area.id,
                                      appliance.id,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-blue-500"
                                >
                                  {starterAppliances.map((applianceOption) => (
                                    <option
                                      key={applianceOption}
                                      value={applianceOption}
                                    >
                                      {applianceOption}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeAppliance(area.id, appliance.id)
                                  }
                                  className="shrink-0 text-xs font-bold text-red-500 hover:text-red-700"
                                >
                                  ?
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <label className="block">
                                  <span className="text-[10px] font-bold text-slate-500">Qty</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={appliance.quantity}
                                    onChange={(e) =>
                                      updateAppliance(
                                        area.id,
                                        appliance.id,
                                        "quantity",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] font-bold text-slate-500">Watts</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={appliance.watts}
                                    onChange={(e) =>
                                      updateAppliance(
                                        area.id,
                                        appliance.id,
                                        "watts",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] font-bold text-slate-500">Hrs/day</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={appliance.hoursPerDay}
                                    onChange={(e) =>
                                      updateAppliance(
                                        area.id,
                                        appliance.id,
                                        "hoursPerDay",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                  />
                                </label>
                                <label className="block">
                                  <span className="text-[10px] font-bold text-slate-500">Surge W</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={appliance.surgeWatts}
                                    onChange={(e) =>
                                      updateAppliance(
                                        area.id,
                                        appliance.id,
                                        "surgeWatts",
                                        e.target.value,
                                      )
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm"
                                  />
                                </label>
                              </div>
                              <div className="mt-3 flex items-center justify-between">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={appliance.critical}
                                    onChange={(e) =>
                                      updateAppliance(
                                        area.id,
                                        appliance.id,
                                        "critical",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-xs font-bold text-slate-600">Critical</span>
                                </label>

                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop: table-based appliance list */}
                      <div className="mt-5 hidden sm:block">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[700px] text-left">
                            <thead>
                              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                                <th className="whitespace-nowrap pb-3 pr-3">
                                  Appliance
                                </th>
                                <th className="whitespace-nowrap pb-3 pr-3">
                                  Qty
                                </th>
                                <th className="whitespace-nowrap pb-3 pr-3">
                                  Watts
                                </th>
                                <th className="whitespace-nowrap pb-3 pr-3">
                                  Hours/day
                                </th>
                                <th className="whitespace-nowrap pb-3 pr-3 text-center">
                                  Critical
                                </th>
                                <th className="whitespace-nowrap pb-3 pr-3">
                                  Surge W
                                </th>

                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {area.appliances.map((appliance) => {

                                return (
                                  <tr
                                    key={appliance.id}
                                    className="border-b border-slate-200 last:border-0"
                                  >
                                    <td className="py-3 pr-3">
                                      <input
                                        value={appliance.name}
                                        list="appliance-options"
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "name",
                                            e.target.value,
                                          )
                                        }
                                        className="w-full min-w-[120px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                                      />
                                    </td>
                                    <td className="py-3 pr-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={appliance.quantity}
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "quantity",
                                            e.target.value,
                                          )
                                        }
                                        className="w-20 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      />
                                    </td>
                                    <td className="py-3 pr-3">
                                      <input
                                        type="number"
                                        min="0"
                                        value={appliance.watts}
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "watts",
                                            e.target.value,
                                          )
                                        }
                                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      />
                                    </td>
                                    <td className="py-3 pr-3">
                                      <input
                                        type="number"
                                        min="0"
                                        max="24"
                                        step="0.5"
                                        value={appliance.hoursPerDay}
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "hoursPerDay",
                                            e.target.value,
                                          )
                                        }
                                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      />
                                    </td>
                                    <td className="py-3 pr-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={appliance.critical}
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "critical",
                                            e.target.checked,
                                          )
                                        }
                                        className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="py-3 pr-3">
                                      <input
                                        type="number"
                                        min="0"
                                        step="10"
                                        value={appliance.surgeWatts}
                                        onChange={(e) =>
                                          updateAppliance(
                                            area.id,
                                            appliance.id,
                                            "surgeWatts",
                                            e.target.value,
                                          )
                                        }
                                        className="w-24 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                                      />
                                    </td>

                                    <td className="py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeAppliance(area.id, appliance.id)
                                        }
                                        className="text-xs font-bold text-red-500 hover:text-red-700"
                                      >
                                        Remove
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addAppliance(area.id)}
                        className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-900"
                      >
                        + Add appliance
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            <datalist id="appliance-options">
              {starterAppliances.map((appliance) => (
                <option key={appliance} value={appliance} />
              ))}
            </datalist>
          </section>

        </div>

          {!showOverallCalculation ? (
            <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:self-start">
              <div className="rounded-2xl bg-[#07111f] p-4 text-white shadow-xl sm:p-6 lg:p-7">
                <h2 className="text-base font-black sm:text-xl lg:text-2xl">
                  {propertyName || "Your Energy Profile"}
                </h2>

                <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                  {propertyType}
                </p>

                <p className="mt-5 text-sm leading-6 text-slate-300">
                  Your energy assessment has been prepared. Generate the Energy
                  Report to unlock the overall calculation and detailed results.
                </p>

                <button
                  type="button"
                  onClick={prepareEnergyReport}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-500 sm:py-4"
                >
                  Generate Energy Report
                </button>
              </div>
            </aside>
          ) : (
            <SubscriptionGate tool="calculator">
              <aside className="mt-6 lg:sticky lg:top-6 lg:mt-0 lg:self-start">
                <div className="rounded-2xl bg-[#07111f] p-4 text-white shadow-xl sm:p-6 lg:p-7">
                  <h2 className="mt-2 truncate text-base font-black sm:text-xl lg:text-2xl">
                    {propertyName || "Your Energy Profile"}
                  </h2>

                  <p className="mt-1 truncate text-xs text-slate-400 sm:text-sm">
                    {propertyType}
                  </p>

                  {results && (
                    <div className="mt-4 space-y-2 sm:mt-7 sm:space-y-3">
                      <div className="rounded-xl bg-slate-900/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                          Connected load
                        </p>
                        <p className="mt-1 text-lg font-black sm:text-2xl">
                          {results.applianceLoad.toFixed(0)} W
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                          Daily energy
                        </p>
                        <p className="mt-1 text-lg font-black sm:text-2xl">
                          {results.applianceEnergy.toFixed(2)} kWh/day
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                          Weekly energy
                        </p>
                        <p className="mt-1 text-lg font-black sm:text-2xl">
                          {results.weeklyEnergy.toFixed(2)} kWh
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-900/70 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
                          Monthly energy
                        </p>
                        <p className="mt-1 text-lg font-black sm:text-2xl">
                          {results.monthlyEnergy.toFixed(2)} kWh
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={generateEnergyReport}
                    className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-500 sm:mt-6 sm:py-4"
                  >
                    Generate Energy Report
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-4 text-slate-500 sm:mt-4 sm:text-[11px] sm:leading-5">
                    Your overall energy calculation is now available.
                  </p>
                </div>
              </aside>
            </SubscriptionGate>
          )}
      </div>
    </div>
  );
}

/* HELPER COMPONENTS */
function CommonAreaMeter({
  area,
  onUpdate,
  onSaveReading,
}: {
  area: Area;
  onUpdate: (
    areaId: number,
    field: keyof Meter,
    value: string | number,
  ) => void;
  onSaveReading: (areaId: number) => void;
}) {
  if (!area.meter) return null;
  const consumption = Math.max(
    0,
    area.meter.currentReading - area.meter.previousReading,
  );
  const dailyConsumption = consumption / Math.max(1, area.meter.days);
  return (
    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 sm:mt-6 sm:p-5">
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700 sm:text-xs">
          Common-area meter
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">
          Enter meter info for this location. Identifier is optional.
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-2 sm:gap-4">
        <label className="block">
          <span className="text-[10px] font-bold text-slate-700 sm:text-xs">
            Identification type
          </span>
          <select
            value={area.meter.identifierType}
            onChange={(e) =>
              onUpdate(area.id, "identifierType", e.target.value)
            }
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm sm:mt-2"
          >
            <option>None</option>
            <option>Meter ID</option>
            <option>IEC / Serial</option>
            <option>Account Number</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold text-slate-700 sm:text-xs">
            ID / Serial / Account
          </span>
          <input
            value={area.meter.identifier}
            onChange={(e) => onUpdate(area.id, "identifier", e.target.value)}
            placeholder="Optional"
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm sm:mt-2"
          />
        </label>
      </div>
      <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-4">
        <MeterInput
          label="Previous"
          value={area.meter.previousReading}
          unit="kWh"
          onChange={(v) => onUpdate(area.id, "previousReading", v)}
        />
        <MeterInput
          label="Current"
          value={area.meter.currentReading}
          unit="kWh"
          onChange={(v) => onUpdate(area.id, "currentReading", v)}
        />
        <MeterInput
          label="Period"
          value={area.meter.days}
          unit="days"
          onChange={(v) => onUpdate(area.id, "days", v)}
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex gap-3 sm:gap-4">
          <div className="rounded-lg bg-white p-3 sm:p-4">
            <p className="text-[10px] text-slate-500 sm:text-xs">Consumption</p>
            <p className="mt-1 font-mono text-sm font-black sm:text-xl">
              {consumption.toFixed(2)} kWh
            </p>
          </div>
          <div className="rounded-lg bg-white p-3 sm:p-4">
            <p className="text-[10px] text-slate-500 sm:text-xs">Daily avg</p>
            <p className="mt-1 font-mono text-sm font-black sm:text-xl">
              {dailyConsumption.toFixed(2)}/day
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSaveReading(area.id)}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 sm:w-auto"
        >
          Save Reading
        </button>
      </div>
    </div>
  );
}

function MeterIdentification({
  meter,
  onUpdate,
}: {
  meter: Meter;
  onUpdate: (field: keyof Meter, value: string | number) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">
      <label className="block">
        <span className="text-xs font-bold text-slate-700 sm:text-sm">
          Identification type
        </span>
        <select
          value={meter.identifierType}
          onChange={(e) => onUpdate("identifierType", e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm sm:mt-2 sm:px-4 sm:py-3"
        >
          <option>None</option>
          <option>Meter ID</option>
          <option>IEC / Serial</option>
          <option>Account Number</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs font-bold text-slate-700 sm:text-sm">
          ID / Serial / Account
        </span>
        <input
          value={meter.identifier}
          onChange={(e) => onUpdate("identifier", e.target.value)}
          placeholder="Optional"
          className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm sm:mt-2 sm:px-4 sm:py-3"
        />
      </label>
    </div>
  );
}

function MeterReadings({
  meter,
  onUpdate,
}: {
  meter: Meter;
  onUpdate: (field: keyof Meter, value: string | number) => void;
}) {
  return (
    <div className="mt-3 grid gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-5">
      <MeterInput
        label="Previous reading"
        value={meter.previousReading}
        unit="kWh"
        onChange={(v) => onUpdate("previousReading", v)}
      />
      <MeterInput
        label="Current reading"
        value={meter.currentReading}
        unit="kWh"
        onChange={(v) => onUpdate("currentReading", v)}
      />
      <MeterInput
        label="Measurement period"
        value={meter.days}
        unit="days"
        onChange={(v) => onUpdate("days", v)}
      />
    </div>
  );
}

function MeterInput({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold text-slate-700 sm:text-xs">
        {label}
      </span>
      <div className="mt-1.5 flex sm:mt-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 rounded-l-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        />
        <span className="flex shrink-0 items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-100 px-2 text-[10px] font-bold text-slate-500 sm:px-3 sm:text-xs">
          {unit}
        </span>
      </div>
    </label>
  );
}

function Metric({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 sm:p-4 ${
        highlight
          ? "border-blue-500/40 bg-blue-500/10"
          : "border-slate-700 bg-slate-900/60"
      }`}
    >
      <p className="text-[10px] text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-0.5 text-sm font-black sm:mt-1 sm:text-xl">{value}</p>
    </div>
  );
}

function PlanningMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] text-slate-400 sm:text-sm">{label}</span>
      <span className="shrink-0 text-[11px] font-black text-white sm:text-sm">{value}</span>
    </div>
  );
}



















