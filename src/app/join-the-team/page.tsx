import Image from "next/image";
import type { Metadata } from "next";
import JoinTeamForm from "./join-team-form";

export const metadata: Metadata = {
  title: "Join Our Team | Samiz Tech Engineering Ltd",
  description:
    "Explore professional opportunities, paid project engagements and voluntary collaboration with Samiz Tech Engineering Ltd across engineering, energy and technology.",
  alternates: {
    canonical: "https://www.samiztech.com.ng/join-the-team",
  },
  openGraph: {
    type: "website",
    url: "https://www.samiztech.com.ng/join-the-team",
    title: "Join Our Team | Samiz Tech Engineering Ltd",
    description:
      "Work with Samiz Tech on electrical engineering, solar energy, software and intelligent energy systems.",
    siteName: "Samiz Tech Engineering Ltd",
    locale: "en_NG",
  },
};

const collaborationAreas = [
  {
    number: "01",
    title: "Software Development",
    description:
      "Web applications, backend systems, mobile development, APIs and software engineering.",
  },
  {
    number: "02",
    title: "Electrical & Solar Engineering",
    description:
      "Electrical installations, solar PV, battery storage, power systems and technical design.",
  },
  {
    number: "03",
    title: "EnergyOS, IoT & Automation",
    description:
      "Energy monitoring, embedded systems, connected devices, telemetry and automation.",
  },
  {
    number: "04",
    title: "Business Development & Sales",
    description:
      "Partnerships, customer engagement, market development and commercial opportunities.",
  },
  {
    number: "05",
    title: "Operations & Field Support",
    description:
      "Project coordination, documentation, field activities and operational support.",
  },
  {
    number: "06",
    title: "Other Relevant Skills",
    description:
      "Share another capability that could contribute to our engineering and technology work.",
  },
];

export default function JoinTheTeamPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-[#07111f]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(37,99,235,0.24),_transparent_55%)]" />

        <div className="relative mx-auto grid min-h-[calc(100svh-5rem)] w-full max-w-[1600px] grid-cols-1 items-stretch lg:grid-cols-2">
          <div className="relative order-1 aspect-[16/9] w-full bg-[#07111f] sm:aspect-[16/9] lg:order-2 lg:aspect-auto lg:min-h-[calc(100svh-5rem)]">
            <Image
              src="/images/team/samiz-team-solar-engineers.png"
              alt="Samiz Tech engineering team collaborating on a solar energy installation"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-contain object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/35 via-transparent to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-transparent lg:to-[#07111f]/20" />
          </div>

          <div className="order-2 flex items-center px-5 py-12 sm:px-8 sm:py-16 lg:order-1 lg:px-12 lg:py-20 xl:px-20">
            <div className="w-full max-w-2xl">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-blue-500 sm:w-12" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400 sm:text-xs sm:tracking-[0.25em]">
                  Careers & Collaboration
                </span>
              </div>

              <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Build with us.{" "}
                <span className="text-blue-400">Shape what comes next.</span>
              </h1>

              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8 lg:text-lg">
                Samiz Tech Engineering Ltd brings together electrical engineering,
                renewable energy, software development and intelligent energy
                systems to solve practical challenges. We are building a network
                of talented professionals interested in meaningful projects,
                professional opportunities and our long-term growth.
              </p>

              <a
                href="#application"
                className="mt-8 inline-flex min-h-12 w-full items-center justify-center bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-600 sm:w-auto"
              >
                Express Your Interest
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1400px] gap-6 px-5 py-10 sm:px-8 md:grid-cols-2 lg:grid-cols-3 lg:px-10">
          <article className="border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Paid employment
            </p>
            <h2 className="mt-3 text-xl font-bold">Future career opportunities</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Register your interest in future salaried vacancies. Suitable
              candidates may be contacted when approved vacancies and funding
              become available.
            </p>
          </article>

          <article className="border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Project-based engagement
            </p>
            <h2 className="mt-3 text-xl font-bold">Contribute to funded projects</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Qualified professionals may be engaged for specific projects
              when funding is confirmed. Scope, compensation and timelines
              will be agreed in writing before work begins.
            </p>
          </article>

          <article className="border border-slate-200 bg-white p-5 sm:p-6 md:col-span-2 lg:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Volunteer collaboration
            </p>
            <h2 className="mt-3 text-xl font-bold">Contribute by choice</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              People who genuinely wish to support our mission may choose
              voluntary collaboration. This is unpaid, optional and based on
              mutually agreed activities.
            </p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
            Where you can contribute
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Areas of collaboration
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
            We are interested in practical capabilities across our engineering,
            software and business activities.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collaborationAreas.map((area) => (
            <article
              key={area.number}
              className="border border-slate-200 p-5 transition hover:border-blue-300 sm:p-6"
            >
              <span className="text-xs font-bold tracking-widest text-blue-700">
                {area.number}
              </span>
              <h3 className="mt-4 text-lg font-bold">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {area.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="application" className="scroll-mt-8 border-t border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-[1400px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10 lg:py-24">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-700">
              Expression of interest
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Tell us how you could contribute.
            </h2>
            <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
              We are interested in connecting with people who have relevant skills,
              experience and ideas across engineering, energy, software,
              technology and business development. Tell us which opportunity
              interests you. We will contact applicants when a suitable
              opportunity becomes available.
            </p>

            <div className="mt-8 border-l-4 border-blue-700 bg-white p-5">
              <h3 className="font-bold text-slate-900">
                Important information
              </h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                <li>• Paid employment opportunities will be advertised when approved vacancies and funding are available.</li>
                <li>• Project compensation requires confirmed funding and written terms agreed before work begins.</li>
                <li>• Volunteer collaboration is unpaid and entirely optional.</li>
                <li>• An expression of interest does not guarantee employment, payment, a stipend, equity or project placement.</li>
                <li>• Do not commence work based on an expectation of future payment or employment.</li>
              </ul>
            </div>
          </div>

          <div className="min-w-0 border border-slate-200 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
            <JoinTeamForm />
          </div>
        </div>
      </section>
    </main>
  );
}
