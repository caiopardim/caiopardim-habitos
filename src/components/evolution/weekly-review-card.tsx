"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { useAppData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import type { WeeklyReview } from "@/lib/domain/insights";
import type { Habit } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/format-date";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

const DONE_KEY = "zoryka:revisao-feita";

function readDone(): string | null {
  try {
    return window.localStorage.getItem(DONE_KEY);
  } catch {
    return null;
  }
}

/**
 * Revisão semanal: Registre → Revise → Aprenda → Ajuste.
 * Resume a semana e oferece um ajuste de 1 toque para o hábito que mais faltou.
 */
export function WeeklyReviewCard({ review, destaque }: { review: WeeklyReview; destaque: boolean }) {
  const { saveHabit } = useAppData();
  const [feita, setFeita] = useState(false);
  const [editando, setEditando] = useState<Habit | null>(null);

  useEffect(() => {
    setFeita(readDone() === review.inicio);
  }, [review.inicio]);

  const concluir = (msg?: string) => {
    try {
      window.localStorage.setItem(DONE_KEY, review.inicio);
    } catch {
      // sem armazenamento: vale só nesta sessão
    }
    setFeita(true);
    if (msg) toast.success(msg);
  };

  if (review.media === null) return null;
  const { ajuste } = review;

  return (
    <section
      id="revisao"
      aria-labelledby="revisao-titulo"
      className={cn(
        "bg-card scroll-mt-4 space-y-4 rounded-xl border p-4",
        destaque && !feita && "border-primary/60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="revisao-titulo" className="flex items-center gap-2 text-base font-bold">
            <CalendarCheck2 className="text-primary size-5" aria-hidden />
            Revisão da semana
          </h2>
          <p className="text-muted-foreground text-xs">
            {formatShortDate(review.inicio)} – {formatShortDate(review.fim)}
          </p>
        </div>
        {destaque && !feita && (
          <span className="bg-primary/15 text-xp rounded-full px-2.5 py-1 text-xs font-semibold">
            Domingo de revisão
          </span>
        )}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["Média", Math.round(review.media)],
          ["Na sequência", `${review.diasNaSequencia} d`],
          ["Perfeitos", review.diasPerfeitos],
        ].map(([l, v]) => (
          <div key={String(l)} className="bg-muted rounded-lg p-2">
            <dt className="text-muted-foreground text-[11px]">{l}</dt>
            <dd className="text-lg font-bold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="space-y-1 text-sm">
        {review.melhor && (
          <li>
            🏆 Destaque: <strong>{review.melhor.habit.nome}</strong> ({formatPercent(review.melhor.taxa)} dos
            dias)
          </li>
        )}
        {review.pior && (
          <li>
            🌱 Mais faltou: <strong>{review.pior.habit.nome}</strong> ({formatPercent(review.pior.taxa)} dos
            dias)
          </li>
        )}
      </ul>

      {feita ? (
        <p className="text-muted-foreground text-sm">Revisão feita. Boa semana! ✨</p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold">O que você quer ajustar?</p>
          {ajuste.tipo === "reduzir_meta" && (
            <Button
              variant="secondary"
              className="h-auto min-h-11 w-full justify-start py-2 text-left whitespace-normal"
              onClick={async () => {
                await saveHabit({ ...ajuste.habit, metaValor: ajuste.novaMeta });
                concluir("Meta ajustada. Recomeçar menor também é evoluir.");
              }}
            >
              Reduzir a meta de {ajuste.habit.nome} para {formatNumber(ajuste.novaMeta)}{" "}
              {ajuste.habit.unidade}
            </Button>
          )}
          {ajuste.tipo === "menos_dias" && (
            <Button
              variant="secondary"
              className="h-auto min-h-11 w-full justify-start py-2 text-left whitespace-normal"
              onClick={async () => {
                await saveHabit({ ...ajuste.habit, diasSemana: ajuste.diasSemana });
                concluir("Pronto: agora são 3 dias por semana. Constância vale mais que intensidade.");
              }}
            >
              Fazer {ajuste.habit.nome} só seg, qua e sex
            </Button>
          )}
          {review.pior && (
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setEditando(review.pior!.habit)}
            >
              <Pencil /> Editar {review.pior.habit.nome}
            </Button>
          )}
          <Button variant="ghost" className="w-full justify-start" onClick={() => concluir()}>
            Está bom assim
          </Button>
        </div>
      )}

      {editando && (
        <HabitFormDialog
          habit={editando}
          isNew={false}
          open
          onOpenChange={(o) => {
            if (!o) {
              setEditando(null);
              concluir();
            }
          }}
        />
      )}
    </section>
  );
}
