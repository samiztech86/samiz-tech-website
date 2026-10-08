export type LoadPhaseType =
  | "L1"
  | "L2"
  | "L3"
  | "Three Phase"
  | "Single Phase";

export type LoadCategory =
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

export type LoadItemInput = {
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
  phase: LoadPhaseType;
};

export type LoadAnalysisInputs = {
  loads: LoadItemInput[];
  powerFactor: number | string;
  designMargin: number | string;
  futureExpansion: number | string;
  diversityFactor: number | string;
  voltage: number | string;
  phaseType: LoadPhaseType;
};

export function calculateLoadAnalysis(
  input: LoadAnalysisInputs,
) {
  const {
    loads,
    powerFactor,
    designMargin,
    futureExpansion,
    diversityFactor,
    voltage,
    phaseType,
  } = input;

  const systemPf = Math.max(
    0.1,
    Math.min(1, Number(powerFactor) || 0.9),
  );

  const margin = Math.max(
    0,
    Number(designMargin) || 0,
  );

  const expansion = Math.max(
    0,
    Number(futureExpansion) || 0,
  );

  const supplyVoltage = Math.max(
    1,
    Number(voltage) || 415,
  );

  let connectedWatts = 0;
  let demandedWatts = 0;
  let demandedKva = 0;
  let phaseL1DemandedWatts = 0;
  let phaseL2DemandedWatts = 0;
  let phaseL3DemandedWatts = 0;
  let phaseL1DemandedKva = 0;
  let phaseL2DemandedKva = 0;
  let phaseL3DemandedKva = 0;
  let threePhaseDemandedWatts = 0;
  let threePhaseDemandedKva = 0;
  let criticalDemandedWatts = 0;
  let nonCriticalDemandedWatts = 0;
  let dailyEnergyWh = 0;

  const categoryMap = new Map<
    string,
    { connectedWatts: number; demandedWatts: number }
  >();

  const buildingMap = new Map<
    string,
    { connectedWatts: number; demandedWatts: number }
  >();

  for (const load of loads) {
    const quantity = Math.max(
      0,
      Number(load.quantity) || 0,
    );

    const watts = Math.max(
      0,
      Number(load.watts) || 0,
    );

    const hours = Math.max(
      0,
      Math.min(24, Number(load.hoursPerDay) || 0),
    );

    const demandFactor = Math.max(
      0,
      Math.min(100, Number(load.demandFactor) || 0),
    );

    const loadPf = Math.max(
      0.1,
      Math.min(1, Number(load.powerFactor) || 0.9),
    );

    const connected = quantity * watts;
    const demanded =
      connected * (demandFactor / 100);

    const demandedLoadKva =
      demanded / 1000 / loadPf;

    connectedWatts += connected;
    demandedWatts += demanded;
    demandedKva += demandedLoadKva;

    if (load.phase === "L1") {
      phaseL1DemandedWatts += demanded;
      phaseL1DemandedKva += demandedLoadKva;
    } else if (load.phase === "L2") {
      phaseL2DemandedWatts += demanded;
      phaseL2DemandedKva += demandedLoadKva;
    } else if (load.phase === "L3") {
      phaseL3DemandedWatts += demanded;
      phaseL3DemandedKva += demandedLoadKva;
    } else if (load.phase === "Three Phase") {
      threePhaseDemandedWatts += demanded;
      threePhaseDemandedKva += demandedLoadKva;
    }

    dailyEnergyWh += demanded * hours;

    if (load.critical) {
      criticalDemandedWatts += demanded;
    } else {
      nonCriticalDemandedWatts += demanded;
    }

    const category = categoryMap.get(load.category) ?? {
      connectedWatts: 0,
      demandedWatts: 0,
    };

    category.connectedWatts += connected;
    category.demandedWatts += demanded;
    categoryMap.set(load.category, category);

    const building = buildingMap.get(load.building) ?? {
      connectedWatts: 0,
      demandedWatts: 0,
    };

    building.connectedWatts += connected;
    building.demandedWatts += demanded;
    buildingMap.set(load.building, building);
  }

  const projectDiversityFactor = Math.max(
    0,
    Math.min(100, Number(diversityFactor) || 0),
  );

  const connectedKw = connectedWatts / 1000;
  const demandedKw = demandedWatts / 1000;

  const diversifiedKw =
    demandedKw *
    (projectDiversityFactor / 100);

  const diversityRatio =
    projectDiversityFactor / 100;

  const criticalKw =
    (criticalDemandedWatts / 1000) *
    diversityRatio;

  const nonCriticalKw =
    (nonCriticalDemandedWatts / 1000) *
    diversityRatio;

  const dailyEnergyKwh =
    dailyEnergyWh / 1000;

  const monthlyEnergyKwh =
    dailyEnergyKwh * 30;

  const annualEnergyKwh =
    dailyEnergyKwh * 365;

  const demandFactor =
    connectedKw > 0
      ? diversifiedKw / connectedKw
      : 0;

  const calculatedLoadPf =
    demandedKva > 0
      ? demandedKw / demandedKva
      : systemPf;

  const designDemandKw =
    diversifiedKw *
    (1 + margin / 100);

  const apparentPowerKva =
    designDemandKw / systemPf;

  const futureCapacityKw =
    designDemandKw *
    (1 + expansion / 100);

  const futureCapacityKva =
    futureCapacityKw / systemPf;

  const current =
    phaseType === "Three Phase"
      ? (apparentPowerKva * 1000) /
        (Math.sqrt(3) * supplyVoltage)
      : (apparentPowerKva * 1000) /
        supplyVoltage;

  const futureCurrent =
    phaseType === "Three Phase"
      ? (futureCapacityKva * 1000) /
        (Math.sqrt(3) * supplyVoltage)
      : (futureCapacityKva * 1000) /
        supplyVoltage;

  const phaseL1Kw =
    (phaseL1DemandedWatts / 1000) *
    diversityRatio;

  const phaseL2Kw =
    (phaseL2DemandedWatts / 1000) *
    diversityRatio;

  const phaseL3Kw =
    (phaseL3DemandedWatts / 1000) *
    diversityRatio;

  const phaseL1Kva =
    phaseL1DemandedKva *
    diversityRatio;

  const phaseL2Kva =
    phaseL2DemandedKva *
    diversityRatio;

  const phaseL3Kva =
    phaseL3DemandedKva *
    diversityRatio;

  const lineToNeutralVoltage =
    phaseType === "Three Phase"
      ? supplyVoltage / Math.sqrt(3)
      : supplyVoltage;

  const phaseL1Current =
    lineToNeutralVoltage > 0
      ? (phaseL1Kva * 1000) /
        lineToNeutralVoltage
      : 0;

  const phaseL2Current =
    lineToNeutralVoltage > 0
      ? (phaseL2Kva * 1000) /
        lineToNeutralVoltage
      : 0;

  const phaseL3Current =
    lineToNeutralVoltage > 0
      ? (phaseL3Kva * 1000) /
        lineToNeutralVoltage
      : 0;

  const averagePhaseKw =
    (phaseL1Kw + phaseL2Kw + phaseL3Kw) / 3;

  const maximumPhaseKw = Math.max(
    phaseL1Kw,
    phaseL2Kw,
    phaseL3Kw,
  );

  const minimumPhaseKw = Math.min(
    phaseL1Kw,
    phaseL2Kw,
    phaseL3Kw,
  );

  const phaseImbalancePercentage =
    averagePhaseKw > 0
      ? (maximumPhaseKw / averagePhaseKw - 1) * 100
      : 0;

  const selectStandardCapacity = (
    requiredKva: number,
    standardSizes: number[],
  ) =>
    standardSizes.find(
      (size) => size >= requiredKva,
    ) ??
    standardSizes[standardSizes.length - 1];

  const transformerRequiredKva =
    futureCapacityKva;

  const generatorRequiredKva =
    apparentPowerKva * 1.25;

  const inverterRequiredKva =
    apparentPowerKva * 1.2;

  const recommendedTransformerKva =
    selectStandardCapacity(
      transformerRequiredKva,
      [
        25,
        50,
        100,
        160,
        200,
        250,
        315,
        500,
        630,
        800,
        1000,
      ],
    );

  const recommendedGeneratorKva =
    selectStandardCapacity(
      generatorRequiredKva,
      [
        5,
        7.5,
        10,
        15,
        20,
        25,
        30,
        40,
        50,
        60,
        80,
        100,
        125,
        150,
        200,
        250,
        300,
        400,
        500,
      ],
    );

  const recommendedInverterKva =
    selectStandardCapacity(
      inverterRequiredKva,
      [
        3,
        5,
        8,
        10,
        15,
        20,
        25,
        30,
        40,
        50,
        60,
        80,
        100,
        125,
        150,
        200,
        250,
        300,
        400,
        500,
      ],
    );

  const categoryResults =
    Array.from(categoryMap.entries())
      .map(([category, values]) => {
        const demandedKw =
          values.demandedWatts / 1000;

        const diversifiedCategoryKw =
          demandedKw * diversityRatio;

        return {
          category,
          connectedKw:
            values.connectedWatts / 1000,
          diversifiedKw:
            diversifiedCategoryKw,
          percentage:
            diversifiedKw > 0
              ? (diversifiedCategoryKw /
                  diversifiedKw) *
                100
              : 0,
        };
      })
      .sort(
        (a, b) =>
          b.diversifiedKw -
          a.diversifiedKw,
      );

  const buildingResults =
    Array.from(buildingMap.entries())
      .map(([building, values]) => {
        const demandedKw =
          values.demandedWatts / 1000;

        const diversifiedBuildingKw =
          demandedKw * diversityRatio;

        return {
          building,
          connectedKw:
            values.connectedWatts / 1000,
          diversifiedKw:
            diversifiedBuildingKw,
          percentage:
            diversifiedKw > 0
              ? (diversifiedBuildingKw /
                  diversifiedKw) *
                100
              : 0,
        };
      })
      .sort(
        (a, b) =>
          b.diversifiedKw -
          a.diversifiedKw,
      );

  const warnings: string[] = [];

  if (!connectedKw) {
    warnings.push(
      "No connected load has been entered.",
    );
  }

  if (demandFactor > 1) {
    warnings.push(
      "Calculated overall demand factor exceeds 100%. Review the load demand and project diversity assumptions.",
    );
  }

  if (systemPf < 0.85) {
    warnings.push(
      "System power factor is below 0.85. Power-factor correction should be assessed.",
    );
  }

  if (
    calculatedLoadPf < 0.85 &&
    demandedKva > 0
  ) {
    warnings.push(
      "Calculated load-schedule power factor is below 0.85. Review motor, HVAC and other inductive loads and assess power-factor correction.",
    );
  }

  if (phaseImbalancePercentage > 10) {
    warnings.push(
      "Phase loading imbalance exceeds 10%. Review the allocation of single-phase loads across L1, L2 and L3.",
    );
  }

  if (
    criticalKw > designDemandKw &&
    designDemandKw > 0
  ) {
    warnings.push(
      "Critical load exceeds the calculated design demand. Review the critical-load selections.",
    );
  }

  if (futureCapacityKva > 500) {
    warnings.push(
      "Future capacity exceeds 500 kVA. Detailed transformer, protection and distributionstudies should be considered.",
    );
  }

  if (current > 400) {
    warnings.push(
      "Design current exceeds 400 A. Detailed feeder, protection and voltage-drop design is recommended.",
    );
  }

  return {
    connectedKw,
    diversifiedKw,
    criticalKw,
    nonCriticalKw,
    dailyEnergyKwh,
    monthlyEnergyKwh,
    annualEnergyKwh,
    demandFactor,
    calculatedLoadPf,
    designDemandKw,
    apparentPowerKva,
    futureCapacityKw,
    futureCapacityKva,
    current,
    futureCurrent,
    phaseL1Kw,
    phaseL2Kw,
    phaseL3Kw,
    phaseL1Kva,
    phaseL2Kva,
    phaseL3Kva,
    phaseL1Current,
    phaseL2Current,
    phaseL3Current,
    averagePhaseKw,
    maximumPhaseKw,
    minimumPhaseKw,
    phaseImbalancePercentage,
    threePhaseDemandedWatts:
      threePhaseDemandedWatts *
      diversityRatio,
    threePhaseDemandedKva:
      threePhaseDemandedKva *
      diversityRatio,
    recommendedTransformerKva,
    recommendedGeneratorKva,
    recommendedInverterKva,
    categoryResults,
    buildingResults,
    warnings,
  };
}

export type LoadAnalysisResults = ReturnType<
  typeof calculateLoadAnalysis
>;
