import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

export const dynamic = "force-static";
import { CHANGELOG } from "@/lib/changelog";

export default function sitemap(): MetadataRoute.Sitemap {
  const ultima = CHANGELOG[0]?.data ?? "2026-11-17";
  return [
    { url: `${SITE_URL}/`, lastModified: ultima, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/novidades`, lastModified: ultima, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/suporte`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/privacidade`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/termos`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
