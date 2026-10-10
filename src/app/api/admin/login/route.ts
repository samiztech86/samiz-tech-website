import { NextResponse } from "next/server";
import {
  createAdminSessionToken,
  setAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  try {
    if (!origin || new URL(origin).origin !== new URL(request.url).origin) {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("password" in body) ||
      typeof body.password !== "string" ||
      body.password.length === 0 ||
      body.password.length > 1024
    ) {
      return NextResponse.json(
        { error: "Enter a valid password." },
        { status: 400 },
      );
    }

    if (!verifyAdminPassword(body.password)) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        {
          status: 401,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    const token = createAdminSessionToken();
    await setAdminSessionCookie(token);

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Admin login failed:", error);

    return NextResponse.json(
      { error: "Unable to sign in right now." },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}