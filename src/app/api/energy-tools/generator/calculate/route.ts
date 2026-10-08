import { NextRequest, NextResponse } from "next/server";

import { calculateGeneratorPerformance } from "@/lib/energy-tools/generator/calculate";
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

    const input = await request.json();

    const results =
      calculateGeneratorPerformance(
        input.generators,
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
      "Generator calculator API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the generator performance assessment.",
      },
      { status: 500 },
    );
  }
}
