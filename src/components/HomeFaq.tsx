const faqs = [
  {
    question: "What services does Samiz Tech Engineering provide?",
    answer:
      "Samiz Tech provides electrical engineering and solar EPC services, including electrical installations, power distribution, solar and backup power systems, energy infrastructure, smart automation and energy management solutions. Project scope is determined by the facility's requirements.",
  },
  {
    question: "Does Samiz Tech design and install solar power systems?",
    answer:
      "Yes. We work on solar energy projects, from understanding the facility's energy requirements and developing the system design to equipment integration, installation and commissioning. The proposed configuration depends on the site's load profile, operating requirements and project scope.",
  },
  {
    question: "Can solar power be integrated with an existing generator or utility supply?",
    answer:
      "Solar and backup power systems can be designed around an existing power arrangement. The appropriate integration depends on the installed equipment, electrical architecture, load requirements and protection considerations. These details need to be assessed before a system configuration is proposed.",
  },
  {
    question: "Which types of facilities does Samiz Tech work with?",
    answer:
      "Our engineering solutions are relevant to residential properties, estates, commercial buildings, industrial facilities, schools and healthcare facilities. The engineering approach and equipment specification are tailored to the requirements of each facility.",
  },
  {
    question: "Can Samiz Tech assess a site before preparing a proposal?",
    answer:
      "Yes. A project assessment helps establish the facility's electrical infrastructure, energy requirements, existing equipment and operating conditions. The assessment required will depend on the nature and complexity of the project.",
  },
  {
    question: "What information should I provide when requesting a quotation?",
    answer:
      "Please share your project location, type of facility, the work you need, known load or capacity requirements, details of existing equipment and any relevant drawings or photographs. If some technical information is unavailable, describe the problem or outcome you want to achieve so we can identify the next steps.",
  },
  {
    question: "How much does a solar or electrical engineering project cost?",
    answer:
      "Project costs depend on system capacity, site conditions, equipment selection, installation requirements and the overall scope of work. We do not apply one fixed price to every project. Share your requirements so the appropriate technical scope and quotation can be established.",
  },
  {
    question: "What happens after I submit a project enquiry?",
    answer:
      "We review the information you provide to understand the project and its requirements. Where necessary, we may request additional details or discuss an assessment. The next step is to establish the appropriate scope and technical proposal for the project.",
  },
  {
    question: "Does Samiz Tech handle testing and commissioning?",
    answer:
      "Testing and commissioning form part of our engineering process. The applicable checks depend on the installation, equipment and project specification, with the objective of verifying that the completed system has been installed and operates in accordance with its requirements.",
  },
  {
    question: "Do you provide maintenance and technical support?",
    answer:
      "Samiz Tech provides electrical and energy-related maintenance and technical support services. The required service arrangement depends on the equipment, facility, system condition and scope agreed for the engagement.",
  },
  {
    question: "What is Samiz EnergyOS?",
    answer:
      "Samiz EnergyOS is our intelligent energy management platform. It brings energy assets, device information and operational data into a connected environment for energy monitoring, asset visibility, event alerts, analysis and operational decision-making.",
  },
  {
    question: "Can equipment suppliers, manufacturers and project developers partner with Samiz Tech?",
    answer:
      "Yes. We welcome relevant business and technical partnership enquiries from equipment suppliers, manufacturers, project developers and other organisations working in the energy and engineering sector. Share your organisation's profile, proposed collaboration and the products or capabilities you can bring to a project.",
  },
];

export default function HomeFaq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t border-slate-200 bg-slate-50"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />

      <div className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10 lg:py-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700">
              Frequently asked questions
            </p>

            <h2
              id="faq-heading"
              className="mt-4 max-w-xl text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl"
            >
              Clear answers before your next project.
            </h2>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
              Learn how we approach electrical engineering, solar power,
              project assessments and intelligent energy management.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center justify-center bg-blue-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Request a Project Assessment
              </a>

              <a
                href="https://wa.me/2348155721739?text=Hello%20Samiz%20Tech%2C%20I%20have%20a%20project%20enquiry."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-slate-300 px-6 py-3.5 text-sm font-bold text-slate-800 transition hover:border-blue-700 hover:text-blue-700"
              >
                Ask a Question
              </a>
            </div>
          </div>

          <div className="border-t border-slate-300">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                className="group border-b border-slate-300"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-left marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start gap-4">
                    <span className="pt-0.5 text-xs font-bold tabular-nums text-blue-700">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-base font-semibold leading-7 text-slate-900 sm:text-lg">
                      {faq.question}
                    </span>
                  </span>

                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-slate-300 text-xl font-normal text-slate-600 transition group-open:rotate-45 group-open:border-blue-700 group-open:text-blue-700"
                  >
                    +
                  </span>
                </summary>

                <div className="pb-6 pl-10 pr-10">
                  <p className="max-w-2xl text-sm leading-7 text-slate-600">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}