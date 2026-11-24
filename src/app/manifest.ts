import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config";
import { THEME_COLORS } from "@/lib/theme-color";

export const dynamic = "force-static";

const ICONE = { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" };
const LEGENDAS = {
  hoje: "Missões do dia com execução, sequência e XP",
  evolucao: "Sua evolução em dados",
  perfil: "Um avatar que evolui com você",
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    lang: "pt-BR",
    id: "/",
    start_url: "/hoje",
    scope: "/",
    orientation: "portrait",
    categories: ["health", "lifestyle", "productivity"],
    display: "standalone",
    background_color: THEME_COLORS.dark,
    theme_color: THEME_COLORS.dark,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Atalhos ao segurar o ícone (Android) ou clicar com o botão direito (computador).
    shortcuts: [
      { name: "Hoje", short_name: "Hoje", url: "/hoje", icons: [ICONE] },
      { name: "Novo hábito", short_name: "Novo hábito", url: "/habitos?novo=bom", icons: [ICONE] },
      { name: "Evolução", short_name: "Evolução", url: "/evolucao", icons: [ICONE] },
    ],
    // Prints na janela de instalação (Chrome/Edge mostram como numa loja).
    screenshots: [
      ...(["hoje", "evolucao", "perfil"] as const).map((t) => ({
        src: `/landing/${t}.webp`,
        sizes: "600x1298",
        type: "image/webp",
        form_factor: "narrow" as const,
        label: LEGENDAS[t],
      })),
      {
        src: "/landing/desktop.webp",
        sizes: "1280x800",
        type: "image/webp",
        form_factor: "wide",
        label: "A Zoryka no computador",
      },
    ],
  };
}
