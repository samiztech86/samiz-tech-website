import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import MarketplaceProductShare from "@/components/MarketplaceProductShare";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const siteUrl = "https://www.samiztech.com.ng";

type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  brand: string | null;
  model_number: string | null;
  image_urls: string[] | null;
  price_type: "quote_only" | "indicative";
  indicative_price: number | null;
  currency: string;
  is_available: boolean;
  supplier_id: string;
};

async function getPublicProduct(slug: string) {
  const { data: product, error } = await supabaseServer
    .from("marketplace_products")
    .select(
      "id, name, slug, category, description, brand, model_number, image_urls, price_type, indicative_price, currency, is_available, supplier_id",
    )
    .eq("slug", slug)
    .eq("product_status", "approved")
    .eq("is_listed", true)
    .maybeSingle();

  if (error || !product) {
    return null;
  }

  const { data: supplier, error: supplierError } =
    await supabaseServer
      .from("marketplace_supplier_profiles")
      .select("id, business_name")
      .eq("id", product.supplier_id)
      .eq("verification_status", "approved")
      .maybeSingle();

  if (supplierError || !supplier) {
    return null;
  }

  return {
    product: product as PublicProduct,
    supplierName: supplier.business_name as string | null,
  };
}

function formatCategory(category: string) {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatPrice(product: PublicProduct) {
  if (
    product.price_type !== "indicative" ||
    product.indicative_price == null ||
    !Number.isFinite(product.indicative_price) ||
    product.indicative_price <= 0
  ) {
    return "Price on request";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: product.currency || "NGN",
      maximumFractionDigits: 2,
    }).format(product.indicative_price);
  } catch {
    return "Price on request";
  }
}

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublicProduct(slug);

  if (!listing) {
    return {
      title: "Product Not Found | Samiz Tech Marketplace",
      robots: { index: false, follow: false },
    };
  }

  const { product, supplierName } = listing;
  const description =
    product.description.trim().slice(0, 155) ||
    `View ${product.name} on Samiz Tech Marketplace.`;

  const canonical = `${siteUrl}/marketplace/products/${product.slug}`;
  const image = product.image_urls?.find(
    (url) => typeof url === "string" && /^https?:\/\//i.test(url),
  );

  return {
    title: `${product.name} | Samiz Tech Marketplace`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      siteName: "Samiz Tech Engineering Ltd.",
      locale: "en_NG",
      title: `${product.name} | Samiz Tech Marketplace`,
      description,
      ...(image ? { images: [{ url: image, alt: product.name }] } : {}),
    },
    robots: { index: true, follow: true },
    keywords: [
      product.name,
      product.brand ?? "",
      product.model_number ?? "",
      "solar and electrical equipment Nigeria",
      "Samiz Tech Marketplace",
      supplierName ?? "",
    ].filter(Boolean),
  };
}

export default async function MarketplaceProductPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const listing = await getPublicProduct(slug);

  if (!listing) {
    notFound();
  }

  const { product, supplierName } = listing;
  const image = product.image_urls?.find(
    (url) => typeof url === "string" && /^https?:\/\//i.test(url),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 text-sm text-slate-600"
      >
        <Link
          href="/marketplace"
          className="hover:text-blue-700 hover:underline"
        >
          Marketplace
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span aria-current="page" className="text-slate-900">
          {product.name}
        </span>
      </nav>

      <article className="grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="relative flex min-h-72 items-center justify-center overflow-hidden border border-slate-200 bg-white md:min-h-96">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-6"
              priority
            />
          ) : (
            <p className="px-6 text-center text-sm text-slate-500">
              Product image currently unavailable.
            </p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            {formatCategory(product.category)}
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {product.name}
          </h1>

          <MarketplaceProductShare
            productName={product.name}
            slug={product.slug}
            priceLabel={formatPrice(product)}
          />

          {supplierName ? (
            <p className="mt-3 text-sm text-slate-600">
              Listed by{" "}
              <span className="font-semibold text-slate-900">
                {supplierName}
              </span>
            </p>
          ) : null}

          {product.brand || product.model_number ? (
            <p className="mt-3 text-sm text-slate-600">
              {[
                product.brand ? `Brand: ${product.brand}` : null,
                product.model_number
                  ? `Model: ${product.model_number}`
                  : null,
              ]
                .filter(Boolean)
                .join(" Â· ")}
            </p>
          ) : null}

          <p className="mt-6 text-2xl font-bold text-slate-950">
            {formatPrice(product)}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            {product.is_available
              ? "Confirm final specifications and availability with the supplier."
              : "Currently marked as unavailable. Contact Samiz Tech to enquire about alternatives."}
          </p>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Product description
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
              {product.description}
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center bg-blue-700 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              Browse marketplace to enquire or buy
            </Link>
            <Link
              href="/marketplace/how-it-works"
              className="inline-flex items-center justify-center border border-slate-300 px-5 py-3 text-center text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              How it works
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
