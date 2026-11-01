"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const navigation = [
  { label: "Services", href: "/services" },
  { label: "Systems", href: "/systems" },
  { label: "EnergyOS", href: "/energyos" },
  { label: "Energy Tools", href: "/energy-tools" },
  { label: "Energy Store", href: "/energy-store" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Resources", href: "/resources" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Join Our Team", href: "/join-the-team" },
  { label: "Contact", href: "/contact" },
];

const whatsappUrl =
  "https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project.";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/55 shadow-sm backdrop-blur-2xl">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {/* TOP ROW: LOGO AND PROJECT ACTION */}
        <div className="flex h-[64px] items-center justify-between sm:h-[72px] lg:h-[76px]">
          <Link
            href="/"
            className="flex shrink-0 items-center"
            onClick={() => setMenuOpen(false)}
          >
            <Image
              src="/samiz-logo.png"
              alt="Samiz Tech Engineering Ltd."
              width={160}
              height={60}
              className="h-auto w-[78px] sm:w-[96px] lg:w-[112px]"
              priority
            />
          </Link>

          {/* DESKTOP PROJECT ACTION */}
          <Link
            href="/contact"
            className="hidden rounded-sm bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 xl:inline-flex"
          >
            Start a Project
          </Link>

          {/* MOBILE AND TABLET MENU BUTTON */}
          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-site-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300/80 bg-white/70 backdrop-blur xl:hidden"
          >
            <div className="relative h-5 w-5">
              <span
                className={`absolute left-0 top-1 block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "top-2 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-2 block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-3 block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "top-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* DESKTOP NAVIGATION: SECOND ROW */}
        <nav className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-slate-300/40 py-3 xl:flex 2xl:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-slate-700 transition hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* MOBILE AND TABLET NAVIGATION */}
      <div
        id="mobile-site-navigation"
        className={`border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur-xl xl:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav className="mx-auto max-h-[calc(100vh-64px)] max-w-[1400px] overflow-y-auto px-4 py-3 sm:px-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-slate-100 py-4 text-sm font-semibold text-slate-700 transition hover:text-blue-700"
            >
              {item.label}
            </Link>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-slate-950 px-4 py-3 text-center text-xs font-bold text-white transition hover:bg-blue-700"
            >
              Start a Project
            </Link>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-[#25D366] px-4 py-3 text-center text-xs font-bold text-white"
            >
              WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}