"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const categories = [
  "All Products",
  "Solar & Backup Power",
  "Electrical Materials",
  "Industrial & Distribution",
  "Smart Energy & Automation",
  "Tools & Accessories",
] as const;

type Category = (typeof categories)[number];

type StoreProduct = {
  id: string;
  name: string;
  category: Exclude<Category, "All Products">;
  description: string;
  image: string;
  imageAlt: string;
  mode: "checkout" | "request_quote";
  status: "verified" | "source_on_request";
};

const products: StoreProduct[] = [
  {
    id: "solar-panels",
    image: "/images/energy-store/solar-panels.webp",
    imageAlt: "Solar panels",
    name: "Solar Panels",
    category: "Solar & Backup Power",
    description:
      "Photovoltaic modules for residential, commercial and industrial solar installations.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "solar-inverters",
    image: "/images/energy-store/hybrid-inverter.webp",
    imageAlt: "Solar and hybrid inverter",
    name: "Solar & Hybrid Inverters",
    category: "Solar & Backup Power",
    description:
      "Inverter options for backup power, hybrid solar systems and energy conversion.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "batteries",
    image: "/images/energy-store/solar-battery.webp",
    imageAlt: "Solar battery energy storage",
    name: "Solar Batteries & Energy Storage",
    category: "Solar & Backup Power",
    description:
      "Battery solutions for backup power and solar energy storage requirements.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "cables",
    image: "/images/energy-store/electrical-cables.webp",
    imageAlt: "Electrical cables and wires",
    name: "Electrical Cables & Wires",
    category: "Electrical Materials",
    description:
      "Request cable types, conductor sizes, insulation specifications and quantities.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "protection",
    image: "/images/energy-store/circuit-breaker.webp",
    imageAlt: "Circuit breaker and electrical protection equipment",
    name: "Circuit Breakers & Protection",
    category: "Electrical Materials",
    description:
      "Circuit protection products selected to match your electrical specification.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "distribution-boards",
    image: "/images/energy-store/distribution-board.webp",
    imageAlt: "Electrical distribution board and changeover equipment",
    name: "Distribution Boards & Changeovers",
    category: "Electrical Materials",
    description:
      "Distribution and source-changeover equipment for electrical installations.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "power-distribution",
    image: "/images/energy-store/industrial-switchgear.webp",
    imageAlt: "Industrial power distribution switchgear",
    name: "Industrial & Power Distribution Equipment",
    category: "Industrial & Distribution",
    description:
      "Enquire about project-specific power distribution and industrial electrical equipment.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "automation",
    image: "/images/energy-store/smart-energy-controller.webp",
    imageAlt: "Smart energy monitoring and automation controller",
    name: "Smart Energy & Automation",
    category: "Smart Energy & Automation",
    description:
      "Explore monitoring, control and automation components for energy systems.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "tools",
    image: "/images/energy-store/electrical-tools.webp",
    imageAlt: "Electrical installation tools",
    name: "Electrical Installation Tools",
    category: "Tools & Accessories",
    description:
      "Tell us the tool type, specification and quantity you need.",
    mode: "request_quote",
    status: "source_on_request",
  },
  {
    id: "lighting-accessories",
    image: "/images/energy-store/lighting-accessories.webp",
    imageAlt: "Lighting and electrical accessories",
    name: "Lighting & Electrical Accessories",
    category: "Tools & Accessories",
    description:
      "Enquire about lighting products and accessories for your project or facility.",
    mode: "request_quote",
    status: "source_on_request",
  },
];

const whatsappNumber = "2348155721739";

function buildEnquiryUrl(
  productName: string,
  details?: {
    quantity?: string;
    unit?: string;
    requiredWhen?: string;
    deliveryLocation?: string;
    fulfilment?: string;
    customerName?: string;
    customerPhone?: string;
  },
) {
  const message = [
    "Hello Samiz Tech Engineering Ltd.",
    "I would like to enquire about an Energy Store product.",
    "",
    `Product: ${productName}`,
    `Quantity: ${details?.quantity || "To be confirmed"} ${details?.unit || ""}`.trim(),
    `When needed: ${details?.requiredWhen || "To be confirmed"}`,
    `Location: ${details?.deliveryLocation || "To be confirmed"}`,
    `Fulfilment: ${details?.fulfilment || "To be discussed"}`,
    `Customer name: ${details?.customerName || "Not provided"}`,
    `Customer phone: ${details?.customerPhone || "Not provided"}`,
    "",
    "Please confirm the specification, availability, quotation and delivery terms.",
  ].join("\n");

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export default function EnergyStorePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category>("All Products");

  const [selectedProductId, setSelectedProductId] = useState(products[0].id);
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("units");
  const [requiredWhen, setRequiredWhen] = useState("Within 1 week");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [fulfilment, setFulfilment] = useState("Delivery to my location");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");


  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All Products" ||
        product.category === selectedCategory;

      const searchableText =
        `${product.name} ${product.category} ${product.description}`.toLowerCase();

      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [search, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Samiz Tech Engineering Ltd.
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Samiz Energy Store
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Electrical materials, solar equipment and energy technology for
            homes, businesses, contractors and industrial projects.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#store-catalogue"
              className="inline-flex items-center justify-center bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500"
            >
              Explore Products
            </a>
            <a
              href={buildEnquiryUrl("a product not listed in the catalogue")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Find a Product
            </a>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-400">
            Product listings are enquiry-led until specifications, supplier
            availability and pricing have been confirmed. No stock or price is
            implied by a listing alone.
          </p>
        </div>
      </section>

      <section
        id="store-catalogue"
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Product catalogue
            </p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Find the equipment you need
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Search by product, application or category, then request a
              specification and quotation from our team.
            </p>
          </div>

          <div className="w-full md:max-w-sm">
            <label
              htmlFor="store-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Search products
            </label>
            <input
              id="store-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g. inverter, cable, breaker"
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
                className={`shrink-0 border px-4 py-2.5 text-sm font-medium transition ${
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

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600" aria-live="polite">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "listing" : "listings"} found
          </p>
          {(search || selectedCategory !== "All Products") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("All Products");
              }}
              className="text-sm font-semibold text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <section
          id="product-enquiry"
          className="mt-8 scroll-mt-6 border border-blue-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Product enquiry
          </p>
          <h3 className="mt-2 text-2xl font-bold">
            Tell us what you need
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Share your requirements so our team can check availability and prepare a quotation.
          </p>

          <form
            className="mt-6 grid gap-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              const selectedProduct = products.find(
                (product) => product.id === selectedProductId
              );
              if (!selectedProduct) return;

              window.open(
                buildEnquiryUrl(selectedProduct.name, {
                  quantity,
                  unit,
                  requiredWhen,
                  deliveryLocation,
                  fulfilment,
                  customerName,
                  customerPhone,
                }),
                "_blank",
                "noopener,noreferrer"
              );
            }}
          >
            <div className="sm:col-span-2">
              <label htmlFor="enquiry-product" className="mb-2 block text-sm font-medium text-slate-700">
                Which product do you need?
              </label>
              <select
                id="enquiry-product"
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                required
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="enquiry-quantity" className="mb-2 block text-sm font-medium text-slate-700">
                How many do you need?
              </label>
              <input
                id="enquiry-quantity"
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full border border-slate-300 px-3 py-3 text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="enquiry-unit" className="mb-2 block text-sm font-medium text-slate-700">
                Unit
              </label>
              <select
                id="enquiry-unit"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
              >
                <option value="units">Units / pieces</option>
                <option value="panels">Panels</option>
                <option value="metres">Metres</option>
                <option value="rolls">Coils / rolls</option>
                <option value="sets">Sets</option>
                <option value="boxes">Boxes</option>
                <option value="other / discuss">Other / discuss</option>
              </select>
            </div>

            <div>
              <label htmlFor="enquiry-when" className="mb-2 block text-sm font-medium text-slate-700">
                When will you need it?
              </label>
              <select
                id="enquiry-when"
                value={requiredWhen}
                onChange={(event) => setRequiredWhen(event.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
                required
              >
                <option>Immediately</option>
                <option>Within 1 week</option>
                <option>Within 1 month</option>
                <option>Planning ahead</option>
              </select>
            </div>

            <div>
              <label htmlFor="enquiry-location" className="mb-2 block text-sm font-medium text-slate-700">
                Where do you need it?
              </label>
              <input
                id="enquiry-location"
                value={deliveryLocation}
                onChange={(event) => setDeliveryLocation(event.target.value)}
                placeholder="Town / city and state"
                className="w-full border border-slate-300 px-3 py-3 text-sm"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label htmlFor="enquiry-fulfilment" className="mb-2 block text-sm font-medium text-slate-700">
                Delivery or collection?
              </label>
              <select
                id="enquiry-fulfilment"
                value={fulfilment}
                onChange={(event) => setFulfilment(event.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-3 text-sm"
              >
                <option>Delivery to my location</option>
                <option>I will arrange collection</option>
                <option>Supply and installation</option>
              </select>
            </div>

            <div>
              <label htmlFor="enquiry-name" className="mb-2 block text-sm font-medium text-slate-700">
                Your name
              </label>
              <input
                id="enquiry-name"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full border border-slate-300 px-3 py-3 text-sm"
                required
                maxLength={120}
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="enquiry-phone" className="mb-2 block text-sm font-medium text-slate-700">
                Your phone / WhatsApp number
              </label>
              <input
                id="enquiry-phone"
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="+234..."
                className="w-full border border-slate-300 px-3 py-3 text-sm"
                required
                maxLength={40}
                autoComplete="tel"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="flex w-full items-center justify-center bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
              >
                Continue to WhatsApp
              </button>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                Your message will open in WhatsApp for you to review and send. This is an enquiry, not a confirmed order.
              </p>
            </div>
          </form>
        </section>

        {filteredProducts.length > 0 ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="flex h-full flex-col border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-sm bg-slate-100">
                  <Image
                    src={product.image}
                    alt={product.imageAlt}
                    fill
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                    className="object-contain p-4"
                  />
                </div>

                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {product.category}
                  </span>
                  <span className="shrink-0 border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                    Price on request
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-bold leading-snug">
                  {product.name}
                </h3>

                <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <p className="text-xs leading-5 text-slate-500">
                    {product.status === "verified"
                      ? "Supplier and product details verified."
                      : "Supplier availability and final specification to be confirmed."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductId(product.id);
                      document.getElementById("product-enquiry")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className="mt-4 flex w-full items-center justify-center bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Request Price & Availability
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <h3 className="text-lg font-semibold">No matching listings</h3>
            <p className="mt-2 text-sm text-slate-600">
              Try another search term or contact us to source the product.
            </p>
            <a
              href={buildEnquiryUrl(search || "a product not listed in the catalogue")}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              Ask Samiz to Source It
            </a>
          </div>
        )}
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 sm:px-8 md:grid-cols-3 lg:px-10">
          <div>
            <h2 className="font-bold">Specify your requirements</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Share the model, rating, quantity or project specification where
              known.
            </p>
          </div>
          <div>
            <h2 className="font-bold">Confirm supply and pricing</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We will need to confirm supplier availability, price and delivery
              before accepting an order.
            </p>
          </div>
          <div>
            <h2 className="font-bold">Need engineering support?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Samiz also provides electrical engineering, solar EPC and energy
              system services.
            </p>
            <a
              href="/contact"
              className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline"
            >
              Contact the engineering team →
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
