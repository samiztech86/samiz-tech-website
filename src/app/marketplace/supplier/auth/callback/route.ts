import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/route-handler";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const errorCode = requestUrl.searchParams.get("error_code");

  const loginUrl = new URL(
    "/marketplace/supplier/login",
    requestUrl.origin,
  );

  if (errorCode) {
    loginUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    loginUrl.searchParams.set("error", "missing_confirmation_code");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createSupabaseRouteHandlerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      loginUrl.searchParams.set("error", "confirmation_failed");
      return NextResponse.redirect(loginUrl);
    }

    loginUrl.searchParams.set("confirmed", "1");
    return NextResponse.redirect(loginUrl);
  } catch {
    loginUrl.searchParams.set("error", "confirmation_failed");
    return NextResponse.redirect(loginUrl);
  }
}
