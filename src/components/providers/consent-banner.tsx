"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { analyticsConfigured, getConsent, setConsent } from "@/lib/analytics";

/** Pede consentimento para métricas de uso (só aparece se o analytics estiver configurado). */
export function ConsentBanner() {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    setAberto(analyticsConfigured() && getConsent() === null);
  }, []);
  if (!aberto) return null;
  const decidir = (v: "aceito" | "recusado") => {
    setConsent(v);
    setAberto(false);
  };
  return (
    <div
      role="dialog"
      aria-label="Privacidade e medições de uso"
      className="bg-popover text-popover-foreground fixed inset-x-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md space-y-3 rounded-xl border p-4 shadow-lg md:bottom-6"
    >
      <p className="text-sm">
        Podemos medir de forma anônima como o app é usado, para melhorar a Zoryka? Não vendemos dados e você
        pode mudar de ideia em Configurações.{" "}
        <Link href="/privacidade" className="font-semibold underline underline-offset-2">
          Política de privacidade
        </Link>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" onClick={() => decidir("recusado")}>
          Não, obrigado
        </Button>
        <Button className="flex-1" onClick={() => decidir("aceito")}>
          Pode medir
        </Button>
      </div>
    </div>
  );
}
