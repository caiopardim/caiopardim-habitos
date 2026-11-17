import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/config";

/** Buscadores indexam só as páginas públicas; as telas do app são pessoais. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/suporte", "/novidades", "/privacidade", "/termos"],
      disallow: [
        "/api/",
        "/hoje",
        "/habitos",
        "/evolucao",
        "/perfil",
        "/conquistas",
        "/configuracoes",
        "/planos",
        "/assinatura",
        "/onboarding",
        "/demo",
        "/auth",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
