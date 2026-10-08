export type ConsumptionAppliance = {
  id: number;
  name: string;
  quantity: number;
  watts: number;
  hoursPerDay: number;
};

export type ConsumptionInputs = {
  appliances: ConsumptionAppliance[];
  meterDaily: number;
};

export function calculateEnergyConsumption(
  appliances: ConsumptionAppliance[],
  meterDaily: number,
) {
  const calculatedAppliances = appliances
    .filter(
      (appliance) =>
        appliance.name.trim() !== "" &&
        appliance.quantity > 0 &&
        appliance.watts > 0 &&
        appliance.hoursPerDay > 0,
    )
    .map((appliance) => {
      const dailyWh =
        appliance.quantity *
        appliance.watts *
        appliance.hoursPerDay;

      const dailyKwh = dailyWh / 1000;

      return {
        ...appliance,
        dailyWh,
        dailyKwh,
        monthlyKwh: dailyKwh * 30,
      };
    });

  const totalDailyKwh = calculatedAppliances.reduce(
    (total, appliance) => total + appliance.dailyKwh,
    0,
  );

  const totalMonthlyKwh = totalDailyKwh * 30;

  const rankedAppliances = [...calculatedAppliances]
    .sort((a, b) => b.dailyKwh - a.dailyKwh)
    .map((appliance) => ({
      ...appliance,
      percentage:
        totalDailyKwh > 0
          ? (appliance.dailyKwh / totalDailyKwh) * 100
          : 0,
    }));

  const largestConsumer = rankedAppliances[0] ?? null;

  const largestConsumerPercentage =
    largestConsumer && totalDailyKwh > 0
      ? (largestConsumer.dailyKwh / totalDailyKwh) * 100
      : 0;

  const safeMeterDaily = Number.isFinite(meterDaily)
    ? Math.max(0, meterDaily)
    : 0;

  const gap = safeMeterDaily - totalDailyKwh;

  const gapPercentage =
    totalDailyKwh > 0
      ? (gap / totalDailyKwh) * 100
      : 0;

  return {
    hasData: calculatedAppliances.length > 0,
    totalDailyKwh,
    totalMonthlyKwh,
    largestConsumer,
    largestConsumerPercentage,
    rankedAppliances,
    meterDaily: safeMeterDaily,
    gap,
    gapPercentage,
  };
}

export type ConsumptionResults = ReturnType<
  typeof calculateEnergyConsumption
>;
