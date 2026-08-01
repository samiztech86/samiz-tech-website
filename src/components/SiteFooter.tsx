import Image from "next/image";

export default function SiteFooter() {
  return (
    <footer className="bg-[#050b14] text-slate-400">
      <div className="mx-auto max-w-[1400px] px-6 py-12 lg:px-10">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Image
              src="/samiz-logo.png"
              alt="Samiz Tech Engineering"
              width={160}
              height={60}
              className="h-auto w-[105px] brightness-0 invert"
            />

            <p className="mt-4 max-w-sm text-sm leading-6">
              Where Engineering Meets Energy.
            </p>

            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">
              Electrical engineering, solar energy, backup power, smart
              infrastructure and intelligent energy systems.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Explore
            </p>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              <a href="/" className="hover:text-white">
                Home
              </a>

              <a href="/services" className="hover:text-white">
                Services
              </a>

              <a href="/energyos" className="hover:text-white">
                EnergyOS
              </a>

              <a href="/projects" className="hover:text-white">
                Projects
              </a>

              <a href="/about" className="hover:text-white">
                About
              </a>

              <a href="/contact" className="hover:text-white">
                Contact
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </p>

            <div className="mt-5 flex flex-col gap-4 text-sm">
              <a
                href="https://wa.me/2348155721739"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                +234 815 572 1739
              </a>

              <a
                href="mailto:info@samiztech.com"
                className="hover:text-white"
              >
                info@samiztech.com
              </a>

              <span>Lagos, Nigeria</span>

              <a
                href="/contact"
                className="mt-2 inline-block bg-blue-700 px-5 py-3 text-center text-xs font-bold text-white hover:bg-blue-600"
              >
                Start a Project
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-between gap-4 border-t border-slate-800 pt-6 text-xs sm:flex-row">
          <p>
            © {new Date().getFullYear()} Samiz Tech Engineering Ltd. All rights
            reserved.
          </p>

          <p className="text-slate-600">
            Where Engineering Meets Energy.
          </p>
        </div>
      </div>
    </footer>
  );
}
