"use client";

import { useEffect } from "react";
import { CHAVE_NOVIDADES_VISTAS, ULTIMA_NOVIDADE } from "@/lib/changelog";

/** Abriu a página de novidades: some o aviso de "novo" em Configurações. */
export function MarkNewsSeen() {
  useEffect(() => {
    try {
      if (ULTIMA_NOVIDADE) window.localStorage.setItem(CHAVE_NOVIDADES_VISTAS, ULTIMA_NOVIDADE);
    } catch {}
  }, []);
  return null;
}
