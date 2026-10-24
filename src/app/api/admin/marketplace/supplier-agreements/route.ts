import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin/session";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const responseHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401, headers: responseHeaders },
      );
    }

    const { data: acceptances, error: acceptanceError } =
      await supabaseServer
        .from("marketplace_supplier_agreement_acceptances")
        .select(
          "id, supplier_id, agreement_version, agreement_sha256, signatory_name, acceptance_method, acceptance_statement, accepted_at",
        )
        .order("accepted_at", { ascending: false })
        .limit(500);

    if (acceptanceError) {
      console.error("Admin supplier agreement query failed:", acceptanceError.message);

      return NextResponse.json(
        { error: "Unable to load supplier agreement records." },
        { status: 500, headers: responseHeaders },
      );
    }

    const records = acceptances ?? [];
    const supplierIds = [...new Set(records.map((record) => record.supplier_id))];

    let suppliers: {
      id: string;
      business_name: string;
      contact_name: string;
      contact_email: string;
    }[] = [];

    if (supplierIds.length > 0) {
      const { data, error } = await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id, business_name, contact_name, contact_email")
        .in("id", supplierIds);

      if (error) {
        console.error("Admin supplier agreement profile lookup failed:", error.message);

        return NextResponse.json(
          { error: "Unable to load supplier details for agreement records." },
          { status: 500, headers: responseHeaders },
        );
      }

      suppliers = data ?? [];
    }

    const supplierById = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );

    return NextResponse.json(
      {
        records: records.map((record) => ({
          ...record,
          supplier: supplierById.get(record.supplier_id) ?? null,
        })),
      },
      { headers: responseHeaders },
    );
  } catch (error) {
    console.error(
      "Admin supplier agreement request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return NextResponse.json(
      { error: "Unable to load supplier agreement records." },
      { status: 500, headers: responseHeaders },
    );
  }
}
