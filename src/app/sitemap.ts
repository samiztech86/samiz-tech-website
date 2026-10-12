import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.samiztech.com.ng";

  const pages: Array<{
    path: string;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/services", changeFrequency: "monthly", priority: 0.9 },
    { path: "/systems", changeFrequency: "monthly", priority: 0.9 },
    { path: "/energy-store", changeFrequency: "weekly", priority: 0.9 },
    { path: "/energy-tools", changeFrequency: "weekly", priority: 0.9 },
    { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
    { path: "/engineering-assessment", changeFrequency: "monthly", priority: 0.8 },
    { path: "/energyos", changeFrequency: "monthly", priority: 0.8 },
    { path: "/projects", changeFrequency: "monthly", priority: 0.8 },
    { path: "/resources", changeFrequency: "weekly", priority: 0.8 },
    {
      path: "/resources/how-to-calculate-electrical-load",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-to-size-an-inverter",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-many-solar-panels-do-you-need",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      path: "/resources/how-to-calculate-battery-capacity",
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { path: "/about", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  ];

  return pages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
