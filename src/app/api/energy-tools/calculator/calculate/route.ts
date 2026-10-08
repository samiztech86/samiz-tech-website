import { NextRequest, NextResponse } from "next/server";

import { calculateEnergyAssessment } from "@/lib/energy-tools/calculator/calculate";
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
      calculateEnergyAssessment(input);

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
      "Energy calculator API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the energy assessment.",
      },
      { status: 500 },
    );
  }
}