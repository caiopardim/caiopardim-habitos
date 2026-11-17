"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Medal } from "@/components/gamification/medal";
import { useGamification } from "@/components/gamification/use-gamification";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { CATEGORIA_LABEL, type AchievementCategoria } from "@/lib/domain/achievements";
import { formatShortDate } from "@/lib/format-date";
import { formatNumber } from "@/lib/utils";

const ORDEM: AchievementCategoria[] = [
  "constancia",
  "sequencia",
  "perfeicao",
  "evitar",
  "temporada",
  "nivel",
];

export default function ConquistasPage() {
  const { snapshot } = useReadyData();
  const { medalhas } = useGamification();
  const datas = new Map(snapshot.achievements.map((a) => [a.codigo, a.conquistadoEm]));
  const total = medalhas.filter((m) => m.desbloqueada).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2">
        <Button variant="ghost" size="icon" asChild className="-ml-2">
          <Link href="/perfil" aria-label="Voltar para o perfil">
            <ArrowLeft />
          </Link>
        </Button>
        <PageHeader title="Conquistas" subtitle={`${total} de ${medalhas.length} medalhas`} />
      </div>

      {ORDEM.map((cat) => {
        const lista = medalhas.filter((m) => m.def.categoria === cat);
        return (
          <section key={cat} aria-labelledby={`cat-${cat}`} className="space-y-3">
            <h2
              id={`cat-${cat}`}
              className="text-muted-foreground text-xs font-semibold tracking-wide uppercase"
            >
              {CATEGORIA_LABEL[cat]}
            </h2>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {lista.map(({ def, desbloqueada, atual, progresso }) => {
                const quando = datas.get(def.codigo);
                return (
                  <li
                    key={def.codigo}
                    className="bg-card flex flex-col items-center gap-2 rounded-xl border p-3 text-center"
                    aria-label={`${def.nome}: ${def.descricao}. ${desbloqueada ? "Conquistada" : `Progresso ${Math.min(atual, def.alvo)} de ${def.alvo}`}`}
                  >
                    <Medal conteudo={def.emoji} bloqueada={!desbloqueada} size={64} />
                    <div className="space-y-0.5">
                      <p
                        className={
                          desbloqueada
                            ? "text-sm font-semibold"
                            : "text-muted-foreground text-sm font-semibold"
                        }
                      >
                        {def.nome}
                      </p>
                      <p className="text-muted-foreground text-xs leading-snug">{def.descricao}</p>
                    </div>
                    {desbloqueada ? (
                      <p className="text-xp text-xs font-semibold">
                        {quando ? `Conquistada em ${formatShortDate(quando.slice(0, 10))}` : "Conquistada"}
                      </p>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                          <div
                            className="bg-brand-gradient h-full rounded-full"
                            style={{ width: `${progresso * 100}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground text-[11px] tabular-nums">
                          {formatNumber(Math.min(atual, def.alvo))} / {formatNumber(def.alvo)}
                        </p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
