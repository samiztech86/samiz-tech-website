import { NextRequest, NextResponse } from "next/server";

import { calculateLoadAnalysis } from "@/lib/energy-tools/load-analysis/calculate";
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

    const results = calculateLoadAnalysis(input);

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
      "Load analysis API failed:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to calculate the load analysis.",
      },
      { status: 500 },
    );
  }
}
