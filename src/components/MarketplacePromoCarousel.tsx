"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const slides = [
  {
    image: "/images/banners/samiz-marketplace-banner.webp.jpg",
    alt: "Samiz Tech Marketplace for electrical and solar equipment",
    href: "/marketplace",
    label: "Explore the Samiz Tech Marketplace",
  },
  {
    image: "/images/banners/samiz-supplier-banner.webp.jpg",
    alt: "Supplier registration and product listing on Samiz Tech",
    href: "/marketplace/supplier/register",
    label: "Register as a Samiz Tech supplier",
  },
  {
    image: "/images/banners/samiz-energy-solutions-banner.webp.jpg",
    alt: "Samiz Tech EnergyOS and Energy Tools solutions",
    href: "/energyos",
    label: "Explore Samiz Tech energy solutions",
  },
];

export default function MarketplacePromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, []);

  const activeSlide = slides[activeIndex];

  return (
    <section
      aria-label="Samiz Tech featured promotions"
      className="border-b border-slate-200 bg-slate-50"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Link
            href={activeSlide.href}
            aria-label={activeSlide.label}
            className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            <div className="relative h-[180px] w-full bg-slate-950 sm:h-[240px] md:h-[280px] lg:h-[320px] xl:h-[340px]">
              <Image
                src={activeSlide.image}
                alt={activeSlide.alt}
                fill
                unoptimized
                priority={activeIndex === 0}
                sizes="(max-width: 768px) 100vw, 1400px"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.01]"
              />
            </div>
          </Link>
        </div>

        <div className="mt-4 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() =>
              setActiveIndex(
                (current) => (current - 1 + slides.length) % slides.length
              )
            }
            aria-label="Previous promotional banner"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl text-slate-800 transition hover:border-blue-700 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span aria-hidden="true">‹</span>
          </button>

          <div
            className="flex items-center gap-2"
            aria-label="Choose promotional banner"
          >
            {slides.map((slide, index) => (
              <button
                key={slide.image}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show banner ${index + 1}: ${slide.label}`}
                aria-current={activeIndex === index ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all ${
                  activeIndex === index
                    ? "w-8 bg-blue-700"
                    : "w-2.5 bg-slate-300 hover:bg-slate-500"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setActiveIndex((current) => (current + 1) % slides.length)
            }
            aria-label="Next promotional banner"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xl text-slate-800 transition hover:border-blue-700 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>

        <p className="sr-only" aria-live="polite">
          Banner {activeIndex + 1} of {slides.length}: {activeSlide.label}
        </p>
      </div>
    </section>
  );
}
