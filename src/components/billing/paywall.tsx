"use client";

import { createContext, useCallback, useContext, useState } from "react";
import Link from "next/link";
import { Check, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { formatBRL, LIMITES_GRATIS, mensalEquivalenteAnual, PRECOS } from "@/lib/domain/billing";
import { cn } from "@/lib/utils";

export type MotivoPaywall = "habitos" | "evolucao" | "insights" | "temporadas" | "calendario";

const TEXTO: Record<MotivoPaywall, { titulo: string; descricao: string }> = {
  habitos: {
    titulo: "Acompanhe quantos hábitos quiser",
    descricao: `No plano grátis você mantém até ${LIMITES_GRATIS.habitosAtivos} hábitos ativos. Seus hábitos atuais continuam funcionando normalmente.`,
  },
  evolucao: {
    titulo: "Veja sua evolução completa",
    descricao: `No plano grátis a Evolução mostra os últimos ${LIMITES_GRATIS.evolucaoDias} dias. Com o Premium você vê 30 dias, 3 meses, 1 ano ou qualquer período.`,
  },
  insights: {
    titulo: "Descubra seus padrões",
    descricao:
      "Os insights mostram em quais dias e horários você vai melhor e o que mais pesa no seu resultado.",
  },
  temporadas: {
    titulo: "Jogue as temporadas",
    descricao: "Desafios semanais com meta que sobe a cada temporada concluída.",
  },
  calendario: {
    titulo: "Seu ano inteiro num calendário",
    descricao: "Veja a constância dos últimos 12 meses, o melhor e o pior mês.",
  },
};

const BENEFICIOS = [
  "Hábitos ilimitados",
  "Evolução de qualquer período",
  "Insights e calendário do ano",
  "Temporadas semanais",
];

const Ctx = createContext<(m: MotivoPaywall) => void>(() => {});

/** Abre o convite para o Premium de qualquer tela: `const abrir = usePaywall(); abrir("habitos")`. */
export function usePaywall() {
  return useContext(Ctx);
}

export function PaywallProvider({ children }: { children: React.ReactNode }) {
  const [motivo, setMotivo] = useState<MotivoPaywall | null>(null);
  const abrir = useCallback((m: MotivoPaywall) => {
    setMotivo(m);
    track("paywall_visto", { motivo: m });
  }, []);
  const t = motivo ? TEXTO[motivo] : null;
  return (
    <Ctx.Provider value={abrir}>
      {children}
      <Dialog open={motivo !== null} onOpenChange={(o) => !o && setMotivo(null)}>
        <DialogContent>
          <DialogHeader>
            <span className="bg-brand-gradient text-primary-foreground mx-auto grid size-12 place-items-center rounded-full sm:mx-0">
              <Sparkles aria-hidden />
            </span>
            <DialogTitle>{t?.titulo}</DialogTitle>
            <DialogDescription>{t?.descricao}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm">
            {BENEFICIOS.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Check className="text-success size-4 shrink-0" aria-hidden /> {b}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground text-sm">
            A partir de <strong className="text-foreground">{formatBRL(mensalEquivalenteAnual())}/mês</strong>{" "}
            no plano anual, ou {formatBRL(PRECOS.mensal)} no mensal.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setMotivo(null)}>
              Agora não
            </Button>
            <Button asChild>
              <Link href="/planos" onClick={() => setMotivo(null)}>
                Ver planos
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

/**
 * Mostra o conteúdo borrado (prévia) com um convite por cima. O conteúdo borrado fica
 * fora da leitura de tela e do foco (inert).
 */
export function PremiumLock({
  motivo,
  bloqueado,
  children,
  className,
}: {
  motivo: MotivoPaywall;
  bloqueado: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const abrir = usePaywall();
  if (!bloqueado) return <>{children}</>;
  return (
    <div className={cn("relative isolate overflow-hidden rounded-xl", className)}>
      <div inert aria-hidden className="pointer-events-none max-h-80 overflow-hidden blur-[6px] select-none">
        {children}
      </div>
      <div className="bg-background/40 absolute inset-0 grid place-items-center p-4">
        <div className="bg-card max-w-xs space-y-2 rounded-xl border p-4 text-center shadow-lg">
          <p className="flex items-center justify-center gap-1.5 text-sm font-bold">
            <Lock className="size-4" aria-hidden /> {TEXTO[motivo].titulo}
          </p>
          <p className="text-muted-foreground text-xs">Recurso Premium</p>
          <Button size="sm" onClick={() => abrir(motivo)}>
            Desbloquear
          </Button>
        </div>
      </div>
    </div>
  );
}
