"use client";

import Image from "next/image";
import { useState } from "react";

const navigation = [
  { label: "Services", href: "/services" },
  { label: "Systems", href: "/systems" },
  { label: "EnergyOS", href: "/energyos" },
  { label: "Energy Tools", href: "/energy-tools" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const whatsappUrl =
  "https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project.";

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[64px] max-w-[1400px] items-center justify-between px-4 sm:h-[72px] sm:px-6 lg:h-[78px] lg:px-10">

        {/* LOGO */}
        <a
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
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
            >
              {item.label}
            </a>
          ))}

          <a
            href="/contact"
            className="ml-1 bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Start a Project
          </a>
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white lg:hidden"
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

      {/* MOBILE NAVIGATION */}
      <div
        className={`border-t border-slate-200 bg-white lg:hidden ${
          menuOpen ? "block" : "hidden"
        }`}
      >
        <nav className="px-4 py-3 sm:px-6">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block border-b border-slate-100 py-4 text-sm font-semibold text-slate-700 transition hover:text-blue-700"
            >
              {item.label}
            </a>
          ))}

          <div className="grid grid-cols-2 gap-3 pt-4">
            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="rounded-md bg-slate-950 px-4 py-3 text-center text-xs font-bold text-white"
            >
              Start a Project
            </a>

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


