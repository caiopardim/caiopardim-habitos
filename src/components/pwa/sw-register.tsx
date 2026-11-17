"use client";

import { useEffect } from "react";
import { captureInstallPrompt } from "@/lib/pwa/install";

captureInstallPrompt();

/** Registra o service worker (só em produção) e manda guardar os arquivos já carregados. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const registrar = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        const urls = performance
          .getEntriesByType("resource")
          .map((e) => e.name)
          .filter((u) => u.includes("/_next/static/"));
        (reg.active ?? navigator.serviceWorker.controller)?.postMessage({ tipo: "guardar", urls });
      } catch (e) {
        console.warn("Service worker não registrado", e);
      }
    };
    if (document.readyState === "complete") void registrar();
    else window.addEventListener("load", () => void registrar(), { once: true });
  }, []);
  return null;
}
