"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "./use-plan";

const CHAVE = "zoryka:aviso-plano";

/**
 * Aviso discreto na tela Hoje: teste grátis acabando (≤ 3 dias) ou acabado. Some ao fechar
 * e só volta numa situação nova (outra data de fim).
 */
export function PlanBanner() {
  const { controlado, direito, assinatura } = usePlan();
  const [fechado, setFechado] = useState<string | null>(null);
  useEffect(() => {
    try {
      setFechado(window.localStorage.getItem(CHAVE) ?? "");
    } catch {
      setFechado("");
    }
  }, []);
  if (!controlado || !assinatura || fechado === null) return null;

  let id: string;
  let texto: React.ReactNode;
  if (direito.plano === "teste" && direito.diasRestantes <= 3) {
    id = `teste:${direito.ate}`;
    texto =
      direito.diasRestantes <= 1
        ? "Seu teste grátis do Premium termina hoje."
        : `Faltam ${direito.diasRestantes} dias do seu teste grátis do Premium.`;
  } else if (direito.plano === "gratis" && assinatura.trialAte && !assinatura.premiumAte) {
    id = `fim-teste:${assinatura.trialAte}`;
    texto = "Seu teste grátis terminou. Seus dados continuam aqui, e o plano grátis segue valendo.";
  } else if (direito.plano === "gratis" && assinatura.premiumAte) {
    id = `fim-premium:${assinatura.premiumAte}`;
    texto = "Seu Premium venceu. Renove quando quiser: nada do que você registrou se perde.";
  } else return null;
  if (fechado === id) return null;

  return (
    <aside
      aria-label="Seu plano"
      className="border-primary/40 bg-primary/5 flex items-start gap-3 rounded-xl border p-3 text-sm"
    >
      <Sparkles className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
      <div className="flex-1 space-y-2">
        <p>{texto}</p>
        <Button size="sm" asChild>
          <Link href="/planos">Ver planos</Link>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="-m-2"
        aria-label="Fechar aviso"
        onClick={() => {
          setFechado(id);
          try {
            window.localStorage.setItem(CHAVE, id);
          } catch {}
        }}
      >
        <X />
      </Button>
    </aside>
  );
}
