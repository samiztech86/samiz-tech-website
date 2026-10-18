import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid recovery verification request." },
      { status: 400 },
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("token_hash" in body) ||
    typeof body.token_hash !== "string" ||
    body.token_hash.length === 0 ||
    body.token_hash.length > 512
  ) {
    return NextResponse.json(
      { error: "A valid recovery token is required." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: body.token_hash,
      type: "recovery",
    });

    if (error || !data.session) {
      return NextResponse.json(
        {
          error:
            "This reset link is invalid or expired. Request a new password-reset email.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to verify this reset link. Please try again." },
      { status: 500 },
    );
  }
}
