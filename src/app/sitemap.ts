import { supabaseServer } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.samiztech.com.ng";

  const pages: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    { path: "/systems", changeFrequency: "monthly", priority: 0.9 },
    { path: "/energy-store", changeFrequency: "weekly", priority: 0.9 },
    { path: "/marketplace", changeFrequency: "weekly", priority: 0.9 },
    {
      path: "/marketplace/how-it-works",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { path: "/energy-tools", changeFrequency: "weekly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/engineering-assessment", changeFrequency: "monthly", priority: 0.8 },
    { path: "/energyos", changeFrequency: "monthly", priority: 0.8 },
    { path: "/projects", changeFrequency: "monthly", priority: 0.8 },
    { path: "/resources", changeFrequency: "weekly", priority: 0.8 },
    {
      path: "/resources/how-to-calculate-electrical-load",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-to-size-an-inverter",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-many-solar-panels-do-you-need",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-to-calculate-battery-capacity",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  ];

  const staticUrls: MetadataRoute.Sitemap = pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const { data: products, error: productsError } = await supabaseServer
    .from("marketplace_products")
    .select("slug, supplier_id, updated_at")
    .eq("product_status", "approved")
    .eq("is_listed", true)
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (productsError) {
    throw new Error(`Failed to load marketplace products for sitemap: ${productsError.message}`);
  }

  const supplierIds = [
    ...new Set(
      (products ?? [])
        .map((product) => product.supplier_id)
        .filter((id): id is string => typeof id === "string"),
    ),
  ];

  let approvedSupplierIds = new Set<string>();

  if (supplierIds.length > 0) {
    const { data: suppliers, error: suppliersError } = await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id")
      .eq("verification_status", "approved")
      .in("id", supplierIds);

    if (suppliersError) {
      throw new Error(`Failed to load approved marketplace suppliers for sitemap: ${suppliersError.message}`);
    }

    approvedSupplierIds = new Set((suppliers ?? []).map((supplier) => supplier.id));
  }

  const productUrls: MetadataRoute.Sitemap = (products ?? [])
    .filter(
      (product) =>
        typeof product.slug === "string" &&
        product.slug.length > 0 &&
        approvedSupplierIds.has(product.supplier_id),
    )
    .map((product) => ({
      url: `${baseUrl}/marketplace/products/${encodeURIComponent(product.slug)}`,
      ...(product.updated_at ? { lastModified: new Date(product.updated_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [...staticUrls, ...productUrls];
}
