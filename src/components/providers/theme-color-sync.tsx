"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { THEME_COLORS } from "@/lib/theme-color";

/** Mantém o <meta name="theme-color"> igual ao tema escolhido no app (claro/escuro). */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    const cor = resolvedTheme === "light" ? THEME_COLORS.light : THEME_COLORS.dark;
    let metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    if (metas.length === 0) {
      const m = document.createElement("meta");
      m.name = "theme-color";
      document.head.appendChild(m);
      metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    }
    metas.forEach((m) => m.setAttribute("content", cor));
  }, [resolvedTheme]);
  return null;
}
