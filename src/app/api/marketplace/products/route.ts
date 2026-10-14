import "server-only";

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  try {
    const { data: products, error: productsError } = await supabaseServer
      .from("marketplace_products")
      .select(
        "id, name, slug, category, description, brand, model_number, image_urls, price_type, indicative_price, currency, is_available, is_listed, created_at, supplier_id",
      )
      .eq("product_status", "approved")
      .eq("is_listed", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (productsError) {
      console.error("Public marketplace product query failed.");
      return respond(
        { error: "Unable to load marketplace products." },
        500,
      );
    }

    if (!products?.length) {
      return respond({ products: [] });
    }

    const supplierIds = [
      ...new Set(products.map((product) => product.supplier_id)),
    ];

    const { data: approvedSuppliers, error: suppliersError } =
      await supabaseServer
        .from("marketplace_supplier_profiles")
        .select("id, business_name, contact_phone")
        .in("id", supplierIds)
        .eq("verification_status", "approved");

    if (suppliersError) {
      console.error("Public marketplace supplier verification failed.");
      return respond(
        { error: "Unable to verify marketplace listings." },
        500,
      );
    }

    const approvedSupplierIds = new Set(
      (approvedSuppliers ?? []).map((supplier) => supplier.id),
    );

    const approvedSupplierById = new Map(
      (approvedSuppliers ?? []).map((supplier) => [
        supplier.id,
        {
          business_name: supplier.business_name,
          contact_phone: supplier.contact_phone,
        },
      ]),
    );

    const publicProducts = products
      .filter((product) => approvedSupplierIds.has(product.supplier_id))
      .map(({ supplier_id, ...product }) => {
        const supplier = approvedSupplierById.get(supplier_id);

        return {
          ...product,
          supplier_name: supplier?.business_name ?? null,
          supplier_contact_phone: supplier?.contact_phone ?? null,
        };
      });

    return respond({ products: publicProducts });
  } catch {
    console.error("Unexpected public marketplace product query failure.");
    return respond(
      { error: "Unable to load marketplace products." },
      500,
    );
  }
}
