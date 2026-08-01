export default function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.samiztech.com.ng/#organization",
    name: "Samiz Tech Engineering Ltd.",
    url: "https://www.samiztech.com.ng/",
    description:
      "Samiz Tech Engineering Ltd. provides electrical engineering, solar EPC, energy infrastructure, automation, energy management and intelligent energy solutions across Nigeria.",
    slogan: "Where Engineering Meets Energy",
    knowsAbout: [
      "Electrical Engineering",
      "Solar Engineering",
      "Solar EPC",
      "Energy Infrastructure",
      "Electrical Installation",
      "Electrical Maintenance",
      "Smart Automation",
      "Energy Management",
      "Energy Monitoring",
      "Intelligent Energy Systems",
    ],
    sameAs: [],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.samiztech.com.ng/#website",
    name: "Samiz Tech Engineering Ltd.",
    url: "https://www.samiztech.com.ng/",
    description:
      "Electrical engineering, solar EPC, energy infrastructure, automation and intelligent energy solutions across Nigeria.",
    publisher: {
      "@id": "https://www.samiztech.com.ng/#organization",
    },
    inLanguage: "en-NG",
  };

  const services = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": "https://www.samiztech.com.ng/#services",
    name: "Samiz Tech Engineering Ltd. Services",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Solar EPC",
        url: "https://www.samiztech.com.ng/services",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Electrical Engineering",
        url: "https://www.samiztech.com.ng/services",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Energy Infrastructure",
        url: "https://www.samiztech.com.ng/services",
      },
      {
        "@type": "ListItem",
        position: 4,
        name: "Smart Automation",
        url: "https://www.samiztech.com.ng/services",
      },
      {
        "@type": "ListItem",
        position: 5,
        name: "Energy Management",
        url: "https://www.samiztech.com.ng/energyos",
      },
    ],
  };

  const energyOS = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": "https://www.samiztech.com.ng/energyos#software",
    name: "Samiz EnergyOS",
    url: "https://www.samiztech.com.ng/energyos",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Samiz EnergyOS is an intelligent energy management platform being built to monitor, manage and optimise electrical infrastructure, energy assets, telemetry, consumption and operational intelligence.",
    creator: {
      "@id": "https://www.samiztech.com.ng/#organization",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organization),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(website),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(services),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(energyOS),
        }}
      />
    </>
  );
}

