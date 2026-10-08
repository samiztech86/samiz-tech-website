export type SolarAppliance = {
  id: number;
  name: string;
  watts: number;
  quantity: number;
  hoursPerDay: number;
  critical: boolean;
};

export type SolarInputs = {
  appliances: SolarAppliance[];
  peakSunHours: number;
  panelWattage: number;
  batteryBackupHours: number;
  solarOffset: number;
};

export type SolarResults = {
  dailyEnergy: number;
  monthlyEnergy: number;
  peakLoad: number;
  criticalLoad: number;
  criticalEnergyPerHour: number;
  sunHours: number;
  panel: number;
  offset: number;
  solarCapacity: number;
  panelCount: number;
  installedSolar: number;
  estimatedDailyGeneration: number;
  monthlyGeneration: number;
  solarCoverage: number;
  inverterRequired: number;
  recommendedInverter: number;
  requiredBatteryKwh: number;
  recommendedBatteryKwh: number;
  backupHours: number;
  estimatedBackupAtCriticalLoad: number;
  averageDailyLoad: number;
};

export function calculateSolar(
  input: SolarInputs,
): SolarResults {
  const {
    appliances,
    peakSunHours,
    panelWattage,
    batteryBackupHours,
    solarOffset,
  } = input;

  const sunHours = Math.max(
    1,
    Number(peakSunHours) || 4.5,
  );

  const panel = Math.max(
    100,
    Number(panelWattage) || 550,
  );

  const offset = Math.min(
    100,
    Math.max(10, Number(solarOffset) || 100),
  ) / 100;

  const backupHours = Math.max(
    1,
    Number(batteryBackupHours) || 6,
  );

  let dailyEnergy = 0;
  let peakLoad = 0;
  let criticalLoad = 0;

  for (const appliance of appliances) {
    const runningPower =
      appliance.watts * appliance.quantity;

    const dailyKwh =
      (runningPower * appliance.hoursPerDay) / 1000;

    dailyEnergy += dailyKwh;
    peakLoad += runningPower;

    if (appliance.critical) {
      criticalLoad += runningPower;
    }
  }

  /*
   * Preliminary solar sizing.
   *
   * We allow an 80% overall system efficiency
   * assumption to account broadly for PV,
   * inverter, temperature, wiring and other losses.
   */
  const efficiency = 0.8;

  const targetSolarEnergy =
    dailyEnergy * offset;

  const solarCapacity =
    targetSolarEnergy /
    sunHours /
    efficiency;

  const panelCount = Math.max(
    1,
    Math.ceil(
      (solarCapacity * 1000) / panel,
    ),
  );

  const installedSolar =
    (panelCount * panel) / 1000;

  const estimatedDailyGeneration =
    installedSolar *
    sunHours *
    efficiency;

  const monthlyEnergy =
    dailyEnergy * 30;

  /*
   * Inverter sizing.
   *
   * We add a 25% engineering allowance above
   * estimated simultaneous peak load.
   */
  const inverterRequired =
    peakLoad * 1.25;

  const recommendedInverter =
    inverterRequired <= 1
      ? 1
      : inverterRequired <= 2
        ? 2
        : inverterRequired <= 3
          ? 3
          : inverterRequired <= 5
            ? 5
            : inverterRequired <= 7.5
              ? 7.5
              : inverterRequired <= 10
                ? 10
                : Math.ceil(inverterRequired);

  /*
   * Battery sizing.
   *
   * 90% usable efficiency × 80% DoD
   * gives a practical preliminary storage estimate.
   */
  const batteryEfficiency = 0.9;
  const batteryDoD = 0.8;

  const criticalEnergyPerHour =
    criticalLoad / 1000;

  const requiredBatteryKwh =
    criticalEnergyPerHour *
    backupHours /
    (batteryEfficiency * batteryDoD);

  const recommendedBatteryKwh =
    Math.max(
      5.12,
      Math.ceil(
        requiredBatteryKwh / 5.12,
      ) * 5.12,
    );

  const estimatedBackupAtCriticalLoad =
    criticalLoad > 0
      ? (recommendedBatteryKwh *
          batteryEfficiency *
          batteryDoD) /
        criticalEnergyPerHour
      : 0;

  const monthlyGeneration =
    estimatedDailyGeneration * 30;

  const solarCoverage =
    dailyEnergy > 0
      ? (estimatedDailyGeneration /
          dailyEnergy) *
        100
      : 0;

  const averageDailyLoad =
    dailyEnergy / 24;

  return {
    dailyEnergy,
    monthlyEnergy,
    peakLoad,
    criticalLoad,
    criticalEnergyPerHour,
    sunHours,
    panel,
    offset: offset * 100,
    solarCapacity,
    panelCount,
    installedSolar,
    estimatedDailyGeneration,
    monthlyGeneration,
    solarCoverage,
    inverterRequired,
    recommendedInverter,
    requiredBatteryKwh,
    recommendedBatteryKwh,
    backupHours,
    estimatedBackupAtCriticalLoad,
    averageDailyLoad,
  };
}
