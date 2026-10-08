export type CalculatorAppliance = {
  id: number;
  name: string;
  quantity: number;
  watts: number;
  hoursPerDay: number;
  critical: boolean;
  surgeWatts: number;
};

export type CalculatorMeter = {
  identifierType: "Meter ID" | "IEC / Serial" | "Account Number" | "None";
  identifier: string;
  previousReading: number;
  currentReading: number;
  days: number;
};

export type CalculatorArea = {
  id: number;
  name: string;
  common: boolean;
  appliances: CalculatorAppliance[];
  meter?: CalculatorMeter;
};

export type CalculatorGenerator = {
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

export type CalculatorInputs = {
  areas: CalculatorArea[];
  gridMeter: CalculatorMeter;
  generators: CalculatorGenerator[];
  solarPanelWatts: number;
  peakSunHours: number;
  pvEfficiency: number;
  backupDuration: number;
  powerFactor: number;
  inverterMargin: number;
  batteryEfficiency: number;
  batteryDoD: number;
  batteryUnitKwh: number;
};

export type CalculatorGeneratorResult =
  CalculatorGenerator & {
    runtimeUsed: number;
    fuelConsumed: number;
    fuelCost: number;
    runtimeSinceService: number;
    serviceRemaining: number;
    serviceDue: boolean;
  };

export type CalculatorResults = {
  applianceLoad: number;
  criticalLoad: number;
  applianceEnergy: number;
  criticalEnergy: number;
  estimatedSurgeLoad: number;
  commonAreaMeasuredEnergy: number;
  commonAreaDailyEnergy: number;
  gridEnergy: number;
  gridDailyEnergy: number;
  estimatedDailyEnergy: number;
  weeklyEnergy: number;
  monthlyEnergy: number;
  requiredPvKwp: number;
  panelCount: number;
  installedPvKwp: number;
  estimatedSolarProduction: number;
  backupEnergyKwh: number;
  requiredNominalBatteryKwh: number;
  batteryCount: number;
  installedBatteryKwh: number;
  inverterFromCriticalLoad: number;
  inverterFromSurge: number;
  requiredInverterKva: number;
  recommendedInverterKva: number;
  measuredSubMeterEnergy: number;
  measuredVsEstimatedDifference: number;
  generatorResults: CalculatorGeneratorResult[];
  totalGeneratorRuntime: number;
  totalGeneratorFuel: number;
  totalGeneratorCost: number;
  totalGeneratorCapacityKva: number;
};

export function calculateEnergyAssessment(
  input: CalculatorInputs,
): CalculatorResults {
  const {
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
  } = input;

  let applianceLoad = 0;
  let criticalLoad = 0;
  let applianceEnergy = 0;
  let criticalEnergy = 0;
  let estimatedSurgeLoad = 0;
  let commonAreaMeasuredEnergy = 0;
  let commonAreaDailyEnergy = 0;

  areas.forEach((area) => {
    if (area.common && area.meter) {
      const meterEnergy = Math.max(
        0,
        area.meter.currentReading - area.meter.previousReading,
      );
      const days = Math.max(1, area.meter.days);

      commonAreaMeasuredEnergy += meterEnergy;
      commonAreaDailyEnergy += meterEnergy / days;

      return;
    }

    area.appliances.forEach((appliance) => {
      const quantity = Math.max(0, appliance.quantity);
      const watts = Math.max(0, appliance.watts);
      const hours = Math.min(
        24,
        Math.max(0, appliance.hoursPerDay),
      );
      const surgeWatts = Math.max(
        watts,
        appliance.surgeWatts || watts,
      );

      const runningLoad = quantity * watts;
      const energy = (runningLoad * hours) / 1000;

      applianceLoad += runningLoad;
      applianceEnergy += energy;

      if (appliance.critical) {
        criticalLoad += runningLoad;
        criticalEnergy += energy;
        estimatedSurgeLoad += quantity * surgeWatts;
      }
    });
  });

  const gridEnergy = Math.max(
    0,
    gridMeter.currentReading - gridMeter.previousReading,
  );

  const gridDailyEnergy =
    gridEnergy / Math.max(1, gridMeter.days);

  const estimatedDailyEnergy =
    applianceEnergy + commonAreaDailyEnergy;

  const weeklyEnergy = estimatedDailyEnergy * 7;
  const monthlyEnergy = estimatedDailyEnergy * 30;

  const safePeakSunHours = Math.max(1, peakSunHours);
  const safePvEfficiency = Math.max(
    0.1,
    Math.min(1, pvEfficiency),
  );

  const requiredPvKwp =
    estimatedDailyEnergy /
    (safePeakSunHours * safePvEfficiency);

  const panelCount = Math.max(
    1,
    Math.ceil(
      (requiredPvKwp * 1000) /
        Math.max(1, solarPanelWatts),
    ),
  );

  const installedPvKwp =
    (panelCount * solarPanelWatts) / 1000;

  const estimatedSolarProduction =
    installedPvKwp *
    safePeakSunHours *
    safePvEfficiency;

  const safePowerFactor = Math.max(
    0.5,
    Math.min(1, powerFactor),
  );

  const safeInverterMargin = Math.max(
    0,
    inverterMargin,
  );

  const inverterFromCriticalLoad =
    (criticalLoad / 1000 / safePowerFactor) *
    (1 + safeInverterMargin);

  const inverterFromSurge =
    (estimatedSurgeLoad / 1000 / safePowerFactor) *
    (1 + safeInverterMargin);

  const requiredInverterKva = Math.max(
    inverterFromCriticalLoad,
    inverterFromSurge,
  );

  const inverterSizes = [
    1,
    1.5,
    2,
    3,
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
    75,
    100,
  ];

  const recommendedInverterKva =
    inverterSizes.find(
      (size) => size >= requiredInverterKva,
    ) ?? Math.ceil(requiredInverterKva);

  const safeBackupDuration = Math.max(
    0,
    backupDuration,
  );

  const safeBatteryEfficiency = Math.max(
    0.5,
    Math.min(1, batteryEfficiency),
  );

  const safeBatteryDoD = Math.max(
    0.3,
    Math.min(1, batteryDoD),
  );

  const backupEnergyKwh =
    (criticalLoad * safeBackupDuration) / 1000;

  const requiredNominalBatteryKwh =
    backupEnergyKwh /
    (safeBatteryEfficiency * safeBatteryDoD);

  const batteryUnitCapacity = Math.max(
    0.1,
    batteryUnitKwh,
  );

  const batteryCount = Math.max(
    1,
    Math.ceil(
      requiredNominalBatteryKwh /
        batteryUnitCapacity,
    ),
  );

  const installedBatteryKwh =
    batteryCount * batteryUnitCapacity;

  const generatorResults = generators.map(
    (generator) => {
      const runtimeUsed = Math.max(
        0,
        generator.closingRuntime -
          generator.openingRuntime,
      );

      const fuelConsumed =
        runtimeUsed *
        Math.max(
          0,
          generator.fuelConsumptionPerHour,
        );

      const fuelCost =
        fuelConsumed *
        Math.max(0, generator.fuelPrice);

      const runtimeSinceService = Math.max(
        0,
        generator.closingRuntime -
          generator.lastServiceRuntime,
      );

      const serviceRemaining = Math.max(
        0,
        generator.serviceInterval -
          runtimeSinceService,
      );

      const serviceDue =
        serviceRemaining <= 0;

      return {
        ...generator,
        runtimeUsed,
        fuelConsumed,
        fuelCost,
        runtimeSinceService,
        serviceRemaining,
        serviceDue,
      };
    },
  );

  const totalGeneratorRuntime =
    generatorResults.reduce(
      (total, generator) =>
        total + generator.runtimeUsed,
      0,
    );

  const totalGeneratorFuel =
    generatorResults.reduce(
      (total, generator) =>
        total + generator.fuelConsumed,
      0,
    );

  const totalGeneratorCost =
    generatorResults.reduce(
      (total, generator) =>
        total + generator.fuelCost,
      0,
    );

  const totalGeneratorCapacityKva =
    generatorResults.reduce(
      (total, generator) =>
        total +
        Math.max(0, generator.capacityKva),
      0,
    );

  const measuredSubMeterEnergy =
    commonAreaMeasuredEnergy;

  const measuredVsEstimatedDifference =
    gridDailyEnergy - estimatedDailyEnergy;

  return {
    applianceLoad,
    criticalLoad,
    applianceEnergy,
    criticalEnergy,
    estimatedSurgeLoad,
    commonAreaMeasuredEnergy,
    commonAreaDailyEnergy,
    gridEnergy,
    gridDailyEnergy,
    estimatedDailyEnergy,
    weeklyEnergy,
    monthlyEnergy,
    requiredPvKwp,
    panelCount,
    installedPvKwp,
    estimatedSolarProduction,
    backupEnergyKwh,
    requiredNominalBatteryKwh,
    batteryCount,
    installedBatteryKwh,
    inverterFromCriticalLoad,
    inverterFromSurge,
    requiredInverterKva,
    recommendedInverterKva,
    measuredSubMeterEnergy,
    measuredVsEstimatedDifference,
    generatorResults,
    totalGeneratorRuntime,
    totalGeneratorFuel,
    totalGeneratorCost,
    totalGeneratorCapacityKva,
  };
}