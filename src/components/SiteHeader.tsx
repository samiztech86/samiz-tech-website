"use client";

import Image from "next/image";
import { useState } from "react";

const navigation = [
  { label: "Services", href: "/services" },
  { label: "EnergyOS", href: "/energyos" },
  { label: "Projects", href: "/projects" },
  { label: "About", href: "/about" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-6 lg:px-10">
        <a href="/" className="flex items-center">
          <Image
            src="/samiz-logo.png"
            alt="Samiz Tech Engineering"
            width={160}
            height={60}
            className="h-auto w-[100px] sm:w-[112px]"
            priority
          />
        </a>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden items-center gap-8 lg:flex">
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
            className="bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Start a Project
          </a>
        </nav>

        {/* MOBILE */}
        <div className="flex items-center gap-3 lg:hidden">
          <a
            href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20would%20like%20to%20discuss%20a%20project."
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
          >
            WhatsApp
          </a>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="border border-slate-300 p-2.5"
          >
            <div className="space-y-1.5">
              <span
                className={`block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "translate-y-2 rotate-45" : ""
                }`}
              />

              <span
                className={`block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />

              <span
                className={`block h-0.5 w-5 bg-slate-900 transition ${
                  menuOpen ? "-translate-y-2 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-w-[1400px] px-6 py-5">
            <div className="flex flex-col">
              {navigation.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="border-b border-slate-100 py-4 text-sm font-semibold text-slate-700 hover:text-blue-700"
                >
                  {item.label}
                </a>
              ))}

              <a
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="mt-5 bg-blue-700 px-5 py-4 text-center text-sm font-bold text-white"
              >
                Start a Project
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
