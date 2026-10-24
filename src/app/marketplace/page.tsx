"use client";

import Image from "next/image";
import MarketplaceAdSlot from "@/components/MarketplaceAdSlot";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

const categories = [
  "All Products",
  "Solar & Backup Power",
  "Electrical Materials",
  "Industrial & Distribution",
  "Smart Energy & Automation",
  "Tools & Accessories",
] as const;

type Category = (typeof categories)[number];

type Product = {
  id: string;
  slug?: string;
  name: string;
  category: Exclude<Category, "All Products">;
  description: string;
  image: string;
  imageAlt: string;
  priceLabel?: string;
  price_type?: "quote_only" | "indicative";
  indicative_price?: number | null;
  currency?: string;
  is_available?: boolean;
  isSupplierListing?: boolean;
  supplierProductId?: string;
  supplierName?: string | null;
  supplierWhatsapp?: string | null;
  brand?: string | null;
  model_number?: string | null;
};

const products: Product[] = [
  {
    id: "solar-panels",
    name: "Solar Panels",
    category: "Solar & Backup Power",
    description: "Photovoltaic modules for residential, commercial and industrial solar installations.",
    image: "/images/energy-store/solar-panels.webp",
    imageAlt: "Solar panels for photovoltaic installations",
  },
  {
    id: "solar-inverters",
    name: "Solar & Hybrid Inverters",
    category: "Solar & Backup Power",
    description: "Inverter options for backup power, hybrid solar systems and energy conversion.",
    image: "/images/energy-store/hybrid-inverter.webp",
    imageAlt: "Solar and hybrid inverter equipment",
  },
  {
    id: "batteries",
    name: "Solar Batteries & Energy Storage",
    category: "Solar & Backup Power",
    description: "Battery solutions for backup power and solar energy storage requirements.",
    image: "/images/energy-store/solar-battery.webp",
    imageAlt: "Solar battery energy storage equipment",
  },
  {
    id: "cables",
    name: "Electrical Cables & Wires",
    category: "Electrical Materials",
    description: "Request cable types, conductor sizes, insulation specifications and quantities.",
    image: "/images/energy-store/electrical-cables.webp",
    imageAlt: "Electrical cables and wires",
  },
  {
    id: "protection",
    name: "Circuit Breakers & Protection",
    category: "Electrical Materials",
    description: "Circuit protection products selected to match your electrical specification.",
    image: "/images/energy-store/circuit-breaker.webp",
    imageAlt: "Circuit breakers and electrical protection equipment",
  },
  {
    id: "distribution-boards",
    name: "Distribution Boards & Changeovers",
    category: "Electrical Materials",
    description: "Distribution and source-changeover equipment for electrical installations.",
    image: "/images/energy-store/distribution-board.webp",
    imageAlt: "Electrical distribution board and changeover equipment",
  },
  {
    id: "power-distribution",
    name: "Industrial & Power Distribution Equipment",
    category: "Industrial & Distribution",
    description: "Enquire about project-specific power distribution and industrial electrical equipment.",
    image: "/images/energy-store/industrial-switchgear.webp",
    imageAlt: "Industrial electrical switchgear",
  },
  {
    id: "automation",
    name: "Smart Energy & Automation",
    category: "Smart Energy & Automation",
    description: "Explore monitoring, control and automation components for energy systems.",
    image: "/images/energy-store/smart-energy-controller.webp",
    imageAlt: "Smart energy monitoring and automation controller",
  },
  {
    id: "tools",
    name: "Electrical Installation Tools",
    category: "Tools & Accessories",
    description: "Tell us the tool type, specification and quantity you need.",
    image: "/images/energy-store/electrical-tools.webp",
    imageAlt: "Electrical installation tools",
  },
  {
    id: "lighting-accessories",
    name: "Lighting & Electrical Accessories",
    category: "Tools & Accessories",
    description: "Enquire about lighting products and accessories for your project or facility.",
    image: "/images/energy-store/lighting-accessories.webp",
    imageAlt: "Lighting and electrical accessories",
  },
];


type SupplierApiProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  brand: string | null;
  model_number: string | null;
  price_type: "quote_only" | "indicative";
  indicative_price: number | null;
  currency: string;
  is_available: boolean;
  is_listed: boolean;
  image_urls: string[] | null;
  supplier_name: string | null;
  supplier_contact_phone: string | null;
};

const supplierCategoryMap: Record<
  string,
  Exclude<Category, "All Products">
> = {
  solar_backup_power: "Solar & Backup Power",
  electrical_materials: "Electrical Materials",
  industrial_distribution: "Industrial & Distribution",
  smart_energy_automation: "Smart Energy & Automation",
  tools_accessories: "Tools & Accessories",
};

function mapSupplierProduct(product: SupplierApiProduct): Product {
  const category =
    supplierCategoryMap[product.category] ?? "Solar & Backup Power";

  const priceLabel =
    product.price_type === "indicative" &&
    product.indicative_price != null
      ? new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: product.currency || "NGN",
          maximumFractionDigits: 2,
        }).format(product.indicative_price)
      : undefined;

  return {
    id: `supplier-${product.id}`,
    slug: product.slug,
    supplierProductId: product.id,
    name: product.name,
    category,
    description: product.description,
    image: product.image_urls?.find((url) => typeof url === "string" && url.trim()) ?? "",
    imageAlt: product.name,
    priceLabel,
    price_type: product.price_type,
    indicative_price: product.indicative_price,
    currency: product.currency,
    is_available: product.is_available,
    isSupplierListing: true,
    supplierName: product.supplier_name,
    supplierWhatsapp: product.supplier_contact_phone,
    brand: product.brand,
    model_number: product.model_number,
  };
}
const whatsappNumber = "2348155721739";

function normalizeWhatsAppNumber(phone: string | null | undefined) {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  // Convert Nigerian local mobile/phone format to international format.
  if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 11) {
    digits = `234${digits.slice(1)}`;
  }

  // Do not guess a country code for an unrecognised number.
  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  return digits;
}

function buildEnquiryUrl(
  productName: string,
  supplierListing = false,
  supplierPhone?: string | null,
  supplierName?: string | null,
) {
  const recipient =
    supplierListing
      ? normalizeWhatsAppNumber(supplierPhone) ?? whatsappNumber
      : whatsappNumber;

  const greeting =
    supplierListing && normalizeWhatsAppNumber(supplierPhone)
      ? `Hello ${supplierName?.trim() || "Supplier"},`
      : "Hello Samiz Tech Engineering Ltd.";

  const message = [
    greeting,
    "I found this product on the Samiz Tech Marketplace.",
    "",
    `Product: ${productName}`,
    "Quantity: To be confirmed",
    "Delivery location: To be confirmed",
    "Please confirm the available specification, availability, price and delivery terms.",
  ].join("\n");

  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("All Products");
  const [supplierProducts, setSupplierProducts] = useState<Product[]>([]);
  const [selectedQuoteProduct, setSelectedQuoteProduct] =
    useState<Product | null>(null);
  const [selectedCheckoutProduct, setSelectedCheckoutProduct] =
    useState<Product | null>(null);
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutQuantity, setCheckoutQuantity] = useState("1");
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [quoteName, setQuoteName] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteOrganization, setQuoteOrganization] = useState("");
  const [quoteQuantity, setQuoteQuantity] = useState("");
  const [quoteUnit, setQuoteUnit] = useState("");
  const [quoteLocation, setQuoteLocation] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [quoteWebsite, setQuoteWebsite] = useState("");
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteSuccess, setQuoteSuccess] = useState("");
  const [quoteRequestId, setQuoteRequestId] = useState("");

  async function submitQuoteRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedQuoteProduct?.supplierProductId || quoteSubmitting) {
      return;
    }

    setQuoteError("");
    setQuoteSuccess("");
    setQuoteRequestId("");
    setQuoteSubmitting(true);

    try {
      const response = await fetch("/api/marketplace/quote-requests", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedQuoteProduct.supplierProductId,
          customerName: quoteName,
          customerEmail: quoteEmail,
          customerPhone: quotePhone,
          organizationName: quoteOrganization,
          quantity: quoteQuantity,
          quantityUnit: quoteUnit,
          deliveryLocation: quoteLocation,
          customerMessage: quoteMessage,
          website: quoteWebsite,
        }),
      });

      const payload: {
        error?: unknown;
        message?: unknown;
        requestId?: unknown;
      } = await response.json();

      if (!response.ok) {
        setQuoteError(
          typeof payload.error === "string"
            ? payload.error
            : "We could not submit your enquiry. Please try again.",
        );
        return;
      }

      setQuoteSuccess(
        typeof payload.message === "string"
          ? payload.message
          : "Your quote request has been submitted.",
      );
      setQuoteRequestId(
        typeof payload.requestId === "string" ? payload.requestId : "",
      );
      setQuoteName("");
      setQuoteEmail("");
      setQuotePhone("");
      setQuoteOrganization("");
      setQuoteQuantity("");
      setQuoteUnit("");
      setQuoteLocation("");
      setQuoteMessage("");
      setQuoteWebsite("");
    } catch {
      setQuoteError("A network error occurred. Please try again.");
    } finally {
      setQuoteSubmitting(false);
    }
  }

  async function submitMarketplaceCheckout(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const product = selectedCheckoutProduct;
    if (
      !product?.supplierProductId ||
      product.price_type !== "indicative" ||
      product.indicative_price == null ||
      !Number.isFinite(product.indicative_price) ||
      product.indicative_price <= 0 ||
      checkoutSubmitting
    ) {
      return;
    }

    const quantity = Number(checkoutQuantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
      setCheckoutError("Enter a whole-number quantity between 1 and 10,000.");
      return;
    }

    setCheckoutError("");
    setCheckoutSubmitting(true);

    try {
      const response = await fetch("/api/marketplace/checkout/initialize", {
        method: "POST",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.supplierProductId,
          quantity,
          customerName: checkoutName,
          customerEmail: checkoutEmail,
          customerPhone: checkoutPhone,
        }),
      });

      const payload: {
        success?: unknown;
        checkoutUrl?: unknown;
        error?: unknown;
        reference?: unknown;
      } = await response.json();

      if (
        !response.ok ||
        payload.success !== true ||
        typeof payload.checkoutUrl !== "string"
      ) {
        setCheckoutError(
          typeof payload.error === "string"
            ? payload.error
            : "We could not start checkout. Please try again.",
        );
        return;
      }

      let checkoutUrl: URL;
      try {
        checkoutUrl = new URL(payload.checkoutUrl);
      } catch {
        setCheckoutError("The checkout address returned was invalid.");
        return;
      }

      if (
        checkoutUrl.protocol !== "https:" ||
        checkoutUrl.hostname !== "checkout.paystack.com"
      ) {
        setCheckoutError("The checkout address could not be verified.");
        return;
      }

      window.location.assign(checkoutUrl.toString());
    } catch {
      setCheckoutError(
        "A network error occurred. If you received an order reference, keep it and contact Samiz support before retrying.",
      );
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadSupplierProducts() {
      try {
        const response = await fetch("/api/marketplace/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Marketplace listings could not be loaded.");
        }

        const data: { products?: SupplierApiProduct[] } =
          await response.json();

        if (!cancelled) {
          setSupplierProducts(
            Array.isArray(data.products)
              ? data.products.map(mapSupplierProduct)
              : [],
          );
        }
      } catch {
        if (!cancelled) {
          setSupplierProducts([]);
        }
      }
    }

    void loadSupplierProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...products, ...supplierProducts].filter((product) => {
      const categoryMatches =
        selectedCategory === "All Products" ||
        product.category === selectedCategory;

      const searchableText =
        `${product.name} ${product.category} ${product.description}`.toLowerCase();

      return categoryMatches && (!query || searchableText.includes(query));
    });
  }, [search, selectedCategory, supplierProducts]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Samiz Tech Engineering Ltd.
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Samiz Tech Marketplace
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
            Find solar equipment, electrical materials, industrial power
            equipment, engineering tools and smart energy technology for your
            home, business or project.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#marketplace-products"
              className="inline-flex items-center justify-center bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Browse All Products
            </a>
            <a
              href={buildEnquiryUrl("a product not currently listed")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Request a Product
            </a>
            <a
              href="/marketplace/my-quotes"
              className="inline-flex items-center justify-center border border-blue-300 bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              My Quotes
            </a>
            <a
              href="/marketplace/my-orders"
              className="inline-flex items-center justify-center border border-blue-300 bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              My Orders
            </a>
            <a
              href="/marketplace/how-it-works"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              How It Works
            </a>
            <a
              href="/marketplace/supplier/register"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Become a Supplier
            </a>
            <a
              href="/marketplace/supplier/login"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Supplier Sign In
            </a>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-slate-400">
            Product availability, specifications, prices and delivery are
            confirmed individually. Listings do not imply that stock is held
       by Samiz.
          </p>
        </div>
      </section>

      <MarketplaceAdSlot placement="marketplace_featured" />
<section
        id="marketplace-products"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Engineering supplies
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Browse the marketplace
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Search by equipment name, application or category. Select a
              product to enquire about specifications, pricing and supply.
            </p>
          </div>

          <div>
            <label
              htmlFor="marketplace-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search engineering products
            </label>
            <input
              id="marketplace-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Try inverter, cable or switchgear"
              className="w-full border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-7 flex gap-2 overflow-x-auto pb-3">
          {categories.map((category) => {
            const active = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                aria-pressed={active}
                className={`shrink-0 border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-blue-500 hover:text-blue-700"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "product" : "products"} found
          </p>
          {search || selectedCategory !== "All Products" ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All Products");
              }}
              className="text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              Clear filters
            </button>
          ) : null}
        </div>

        {filteredProducts.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="flex h-full flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative aspect-[4/3] bg-slate-100">
                  {product.isSupplierListing && !product.image ? (
                    <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-slate-500">
                      Product image unavailable
                    </div>
                  ) : (
                    <Image
                      src={product.image}
                      alt={product.imageAlt}
                      fill
                      unoptimized={product.isSupplierListing === true}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-4"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {product.category}
                  </p>
                  {product.isSupplierListing ? (
                    <p className="mt-2 text-xs font-semibold text-emerald-700">
                      Approved supplier listing
                    </p>
                  ) : null}
                  {(product.isSupplierListing
                    ? product.supplierName || product.brand || product.model_number
                    : product.brand || product.model_number) ? (
                    <p className="mt-2 text-xs text-slate-500">
                      {(product.isSupplierListing
                        ? [product.supplierName || product.brand, product.model_number]
                        : [product.brand, product.model_number])
                        .filter(Boolean)
                        .join(" \u00B7 ")}
                    </p>
                  ) : null}
                  <h3 className="mt-2 text-lg font-bold leading-6">
                    {product.isSupplierListing && product.slug ? (
                      <Link
                        href={`/marketplace/products/${encodeURIComponent(product.slug)}`}
                        className="hover:text-blue-700 hover:underline"
                      >
                        {product.name}
                      </Link>
                    ) : (
                      product.name
                    )}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>

                  <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {product.priceLabel ?? "Price on request"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Specification and availability to be confirmed.
                    </p>
                    {product.isSupplierListing && product.supplierProductId ? (
                      product.price_type === "indicative" &&
                      typeof product.indicative_price === "number" &&
                      Number.isFinite(product.indicative_price) &&
                      product.indicative_price > 0 &&
                      product.currency === "NGN" ? (
                        product.is_available === false ? (
                          <button
                            type="button"
                            disabled
                            className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600"
                          >
                            Out of stock
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckoutError("");
                              setCheckoutQuantity("1");
                              setSelectedCheckoutProduct(product);
                            }}
                            className="mt-4 inline-flex w-full items-center justify-center bg-emerald-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                          >
                            Buy Now
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuoteProduct(product);
                            setQuoteError("");
                            setQuoteSuccess("");
                            setQuoteRequestId("");
                          }}
                          className="mt-4 inline-flex w-full items-center justify-center bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                          Request Quote from Supplier
                        </button>
                      )
                    ) : (
                      <a
                        href={buildEnquiryUrl(product.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                      >
                        Request Price &amp; Availability
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <h3 className="text-lg font-semibold">No matching products found</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try another search or ask our team to source the equipment you need.
            </p>
            <a
              href={buildEnquiryUrl(search.trim() || "a product not currently listed")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center justify-center bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Request This Product
            </a>
          </div>
        )}
      </section>

      {selectedQuoteProduct?.supplierProductId ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quote-dialog-title"
            className="mx-auto w-full max-w-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                  Supplier enquiry
                </p>
                <h2 id="quote-dialog-title" className="mt-2 text-2xl font-bold">
                  Request a quote
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Product: <span className="font-semibold text-slate-900">{selectedQuoteProduct.name}</span>
                </p>
                {selectedQuoteProduct.supplierName ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Supplier: {selectedQuoteProduct.supplierName}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuoteProduct(null)}
                aria-label="Close quote request form"
                className="shrink-0 border border-slate-300 px-3 py-2 text-sm font-semibold hover:border-blue-600"
              >
                Close
              </button>
            </div>

            {quoteSuccess ? (
              <div className="mt-6" role="status" aria-live="polite">
                <div className="border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  <p className="font-semibold">{quoteSuccess}</p>
                  {quoteRequestId ? (
                    <p className="mt-1 break-all text-xs">
                      Reference: {quoteRequestId}
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQuoteProduct(null)}
                  className="mt-3 inline-flex w-full items-center justify-center bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={submitQuoteRequest} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="quote-customer-name" className="mb-1 block text-sm font-medium">
                      Full name *
                    </label>
                    <input
                      id="quote-customer-name"
                      name="customerName"
                      autoComplete="name"
                      required
                      minLength={2}
                      maxLength={120}
                      value={quoteName}
                      onChange={(event) => setQuoteName(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-customer-email" className="mb-1 block text-sm font-medium">
                      Email address *
                    </label>
                    <input
                      id="quote-customer-email"
                      name="customerEmail"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      value={quoteEmail}
                      onChange={(event) => setQuoteEmail(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-customer-phone" className="mb-1 block text-sm font-medium">
                      Phone number *
                    </label>
                    <input
                      id="quote-customer-phone"
                      name="customerPhone"
                      type="tel"
                      autoComplete="tel"
                      required
                      minLength={7}
                      maxLength={40}
                      value={quotePhone}
                      onChange={(event) => setQuotePhone(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-organization" className="mb-1 block text-sm font-medium">
                      Organisation (optional)
                    </label>
                    <input
                      id="quote-organization"
                      name="organizationName"
                      autoComplete="organization"
                      maxLength={160}
                      value={quoteOrganization}
                      onChange={(event) => setQuoteOrganization(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-quantity" className="mb-1 block text-sm font-medium">
                      Quantity (optional)
                    </label>
                    <input
                      id="quote-quantity"
                      name="quantity"
                      type="number"
                      min="0.001"
                      max="1000000000"
                      step="0.001"
                      value={quoteQuantity}
                      onChange={(event) => setQuoteQuantity(event.target.value)}
                      className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                  <div>
                    <label htmlFor="quote-unit" className="mb-1 block text-sm font-medium">
                      Quantity unit (optional)
                    </label>
                    <select
                      id="quote-unit"
                      name="quantityUnit"
                      value={quoteUnit}
                      onChange={(event) => setQuoteUnit(event.target.value)}
                      className="w-full border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Select unit</option>
                      <option value="pieces">Pieces</option>
                      <option value="units">Units</option>
                      <option value="sets">Sets</option>
                      <option value="metres">Metres</option>
                      <option value="rolls">Rolls</option>
                      <option value="boxes">Boxes</option>
                      <option value="cartons">Cartons</option>
                      <option value="kg">Kilograms (kg)</option>
                      <option value="tonnes">Tonnes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="quote-location" className="mb-1 block text-sm font-medium">
                    Delivery location (optional)
                  </label>
                  <input
                    id="quote-location"
                    name="deliveryLocation"
                    autoComplete="shipping street-address"
                    maxLength={250}
                    placeholder="Town, state or delivery address"
                    value={quoteLocation}
                    onChange={(event) => setQuoteLocation(event.target.value)}
                    className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="quote-message" className="mb-1 block text-sm font-medium">
                    Specifications or additional details (optional)
                  </label>
                  <textarea
                    id="quote-message"
                    name="customerMessage"
                    rows={4}
                    maxLength={5000}
                    placeholder="Required specifications, intended use, delivery timeline or other details"
                    value={quoteMessage}
                    onChange={(event) => setQuoteMessage(event.target.value)}
                    className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div
                  aria-hidden="true"
                  className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
                >
                  <label htmlFor="quote-website">Leave this field empty</label>
                  <input
                    id="quote-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={quoteWebsite}
                    onChange={(event) => setQuoteWebsite(event.target.value)}
                  />
                </div>

                {quoteError ? (
                  <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                    {quoteError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={quoteSubmitting}
                  className="inline-flex w-full items-center justify-center bg-blue-700 px-4 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {quoteSubmitting ? "Submitting request..." : "Submit Quote Request"}
                </button>

                <p className="text-xs leading-5 text-slate-500">
                  Your details will be used to process this enquiry. Do not include passwords, payment card details or other sensitive information.
                </p>


              </form>
            )}
          </div>
        </div>
      ) : null}

      {selectedCheckoutProduct?.supplierProductId ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 px-4 py-8">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-dialog-title"
            className="mx-auto w-full max-w-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Secure checkout
                </p>
                <h2 id="checkout-dialog-title" className="mt-2 text-2xl font-bold">
                  Buy this product
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Product: <span className="font-semibold text-slate-900">{selectedCheckoutProduct.name}</span>
                </p>
                {selectedCheckoutProduct.supplierName ? (
                  <p className="mt-1 text-sm text-slate-600">
                    Supplier: {selectedCheckoutProduct.supplierName}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!checkoutSubmitting) {
                    setSelectedCheckoutProduct(null);
                    setCheckoutError("");
                  }
                }}
                disabled={checkoutSubmitting}
                aria-label="Close checkout form"
                className="shrink-0 border border-slate-300 px-3 py-2 text-sm font-semibold hover:border-blue-600 disabled:opacity-50"
              >
                Close
              </button>
            </div>

            <div className="mt-5 border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-slate-600">Unit price</span>
                <span className="font-semibold text-slate-900">
                  ₦{selectedCheckoutProduct.indicative_price?.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-4 text-sm">
                <span className="text-slate-600">Quantity</span>
                <span className="font-semibold text-slate-900">{checkoutQuantity || "0"}</span>
              </div>
              <div className="mt-3 flex items-start justify-between gap-4 border-t border-slate-200 pt-3">
                <span className="font-semibold text-slate-900">Estimated subtotal</span>
                <span className="text-lg font-bold text-slate-900">
                  ₦{(selectedCheckoutProduct.indicative_price! * (Number.isSafeInteger(Number(checkoutQuantity)) && Number(checkoutQuantity) > 0 ? Number(checkoutQuantity) : 0)).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                The server revalidates the product price and total before payment.
              </p>
            </div>

            <form onSubmit={submitMarketplaceCheckout} className="mt-6 space-y-4">
              <div>
                <label htmlFor="checkout-customer-name" className="mb-1 block text-sm font-medium">
                  Full name *
                </label>
                <input
                  id="checkout-customer-name"
                  name="customerName"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={120}
                  value={checkoutName}
                  onChange={(event) => setCheckoutName(event.target.value)}
                  className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="checkout-customer-email" className="mb-1 block text-sm font-medium">
                  Email address *
                </label>
                <input
                  id="checkout-customer-email"
                  name="customerEmail"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={checkoutEmail}
                  onChange={(event) => setCheckoutEmail(event.target.value)}
                  className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="checkout-customer-phone" className="mb-1 block text-sm font-medium">
                  Phone number *
                </label>
                <input
                  id="checkout-customer-phone"
                  name="customerPhone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={40}
                  value={checkoutPhone}
                  onChange={(event) => setCheckoutPhone(event.target.value)}
                  className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="checkout-quantity" className="mb-1 block text-sm font-medium">
                  Quantity *
                </label>
                <input
                  id="checkout-quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  max="10000"
                  step="1"
                  required
                  value={checkoutQuantity}
                  onChange={(event) => setCheckoutQuantity(event.target.value)}
                  className="w-full border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">Enter a whole number between 1 and 10,000.</p>
              </div>

              {checkoutError ? (
                <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800">
                  {checkoutError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={checkoutSubmitting}
                className="inline-flex w-full items-center justify-center bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutSubmitting ? "Preparing secure checkout..." : "Continue to Paystack"}
              </button>

              <p className="text-xs leading-5 text-slate-500">
                Your payment is processed through Paystack. Do not enter your card details on this form.
              </p>
            </form>
          </div>
        </div>
      ) : null}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Need equipment for a complete project?
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Samiz also provides electrical engineering, solar EPC, backup
                power and energy system services.
              </p>
            </div>
            <a
              href="/contact"
              className="inline-flex shrink-0 items-center justify-center border border-slate-300 px-5 py-3 font-semibold text-slate-900 transition hover:border-blue-600 hover:text-blue-700"
            >
              Contact the Engineering Team
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
