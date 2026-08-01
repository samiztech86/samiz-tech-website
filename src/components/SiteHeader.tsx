"use client";

import Image from "next/image";
import { useState } from "react";

const navigation = [
  { label: "Services", href: "/services" },
  { label: "Systems", href: "/#systems" },
  { label: "EnergyOS", href: "/energyos" },
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
      <div className="mx-auto flex h-[68px] max-w-[1400px] items-center justify-between px-4 sm:h-[74px] sm:px-6 lg:h-[78px] lg:px-10">
        {/* LOGO */}
        <a
          href="/"
          className="flex shrink-0 items-center"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/samiz-logo.png"
            alt="Samiz Tech Engineering"
            width={160}
            height={60}
            className="h-auto w-[82px] sm:w-[100px] lg:w-[112px]"
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

        {/* MOBILE CONTROLS */}
        <div className="flex items-center gap-2 lg:hidden">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-[#25D366] px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:opacity-90 sm:px-4 sm:text-xs"
          >
            WhatsApp
          </a>

          <button
            type="button"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white"
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
      </div>

      {/* MOBILE MENU */}
      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 lg:hidden ${
          menuOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
          <div className="flex flex-col">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-slate-100 py-3.5 text-sm font-semibold text-slate-700 transition hover:text-blue-700"
              >
                {item.label}
              </a>
            ))}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <a
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="rounded-md bg-slate-950 px-4 py-3 text-center text-xs font-bold text-white transition hover:bg-blue-700"
              >
                Start a Project
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="rounded-md bg-[#25D366] px-4 py-3 text-center text-xs font-bold text-white transition hover:opacity-90"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
