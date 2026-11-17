"use client";

import { useEffect } from "react";

/**
 * Sem Supabase (modo local), o servidor não sabe se a pessoa já usa o app: se houver dados
 * neste navegador, vai direto para o Hoje.
 */
export function LandingRedirect() {
  useEffect(() => {
    try {
      if (window.localStorage.getItem("zoryka:local:v1") || document.cookie.includes("zoryka_demo=1")) {
        window.location.replace("/hoje");
      }
    } catch {}
  }, []);
  return null;
}
