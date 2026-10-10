import { NextResponse } from "next/server";
import { clearAdminSessionCookie } from "@/lib/admin/session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    }

    await clearAdminSessionCookie();

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin logout failed:", error);

    return NextResponse.json(
      { error: "Unable to sign out right now." },
      { status: 500 },
    );
  }
}