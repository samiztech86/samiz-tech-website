export type GeneratorFuelType =
  | "Diesel"
  | "Petrol"
  | "Gas";

export type GeneratorInput = {
  id: number;
  historyKey: string;
  name: string;
  capacityKva: number;
  fuelType: GeneratorFuelType;
  fuelPrice: number;
  fuelConsumptionPerHour: number;
  openingRuntime: number;
  closingRuntime: number;
  serviceInterval: number;
  lastServiceRuntime: number;
};

export type GeneratorResult = GeneratorInput & {
  runtimeUsed: number;
  fuelConsumed: number;
  fuelCost: number;
  runtimeSinceService: number;
  serviceRemaining: number;
  serviceDue: boolean;
};

export type GeneratorResults = {
  generatorResults: GeneratorResult[];
  totalGeneratorRuntime: number;
  totalGeneratorFuel: number;
  totalGeneratorCost: number;
  totalGeneratorCapacityKva: number;
};

export function calculateGeneratorPerformance(
  generators: GeneratorInput[],
): GeneratorResults {
  const generatorResults = generators.map((generator) => {
    const runtimeUsed = Math.max(
      0,
      generator.closingRuntime - generator.openingRuntime,
    );

    const fuelConsumed =
      runtimeUsed *
      Math.max(0, generator.fuelConsumptionPerHour);

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

    const serviceDue = serviceRemaining <= 0;

    return {
      ...generator,
      runtimeUsed,
      fuelConsumed,
      fuelCost,
      runtimeSinceService,
      serviceRemaining,
      serviceDue,
    };
  });

  const totalGeneratorRuntime = generatorResults.reduce(
    (total, generator) =>
      total + generator.runtimeUsed,
    0,
  );

  const totalGeneratorFuel = generatorResults.reduce(
    (total, generator) =>
      total + generator.fuelConsumed,
    0,
  );

  const totalGeneratorCost = generatorResults.reduce(
    (total, generator) =>
      total + generator.fuelCost,
    0,
  );

  const totalGeneratorCapacityKva =
    generatorResults.reduce(
      (total, generator) =>
        total + Math.max(0, generator.capacityKva),
      0,
    );

  return {
    generatorResults,
    totalGeneratorRuntime,
    totalGeneratorFuel,
    totalGeneratorCost,
    totalGeneratorCapacityKva,
  };
}
