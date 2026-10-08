import { NextRequest, NextResponse } from "next/server";

import { calculateEnergyConsumption } from "@/lib/energy-tools/consumption/calculate";
import { getActiveEnergySubscription } from "@/lib/subscription/server-access";

export async function POST(request: NextRequest) {
  try {
    const subscription =
      await getActiveEnergySubscription();

    if (!subscription) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An active Samiz Energy Tools subscription is required.",
        },
        { status: 403 },
      );
    }

    const input =
      await request.json();

    const results =
      calculateEnergyConsumption(
        input.appliances,
        input.meterDaily,
      );

    return NextResponse.json(
      {
        success: true,
        results,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error(
      "Consumption calculator API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the energy consumption assessment.",
      },
      { status: 500 },
    );
  }
}
