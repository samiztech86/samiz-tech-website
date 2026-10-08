import { NextRequest, NextResponse } from "next/server";

import { calculateSolar } from "@/lib/energy-tools/solar/calculate";
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
      calculateSolar(input);

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
      "Solar calculator API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the solar assessment.",
      },
      { status: 500 },
    );
  }
}
