import { Flame, Sparkles } from "lucide-react";
import { ProgressArc } from "@/components/brand/progress-arc";
import { Progress } from "@/components/ui/progress";
import type { DaySummary } from "@/lib/domain/types";
import type { LevelInfo } from "@/lib/domain/xp";
import { cn, formatPercent } from "@/lib/utils";

function formatConcluidos(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}

/** Destaque do dia: anel da marca + execução, hábitos evitados e pontuação. */
export function TodayHero({ summary }: { summary: DaySummary | null }) {
  const temItens = !!summary?.temItens;
  const exec = summary?.execucao ?? 0;
  const maus = summary?.maus ?? { previstos: 0, evitados: 0, aconteceram: 0 };
  const sucessoMaus = maus.previstos ? maus.evitados / maus.previstos : null;
  const perfeito = !!summary?.diaPerfeito;

  return (
    <section
      aria-label="Resumo do dia"
      className={cn(
        "bg-card flex items-center gap-4 rounded-2xl border p-4 sm:gap-6 sm:p-5",
        perfeito && "border-brand-yellow/60",
      )}
    >
      <ProgressArc
        execucao={exec}
        sucessoMaus={sucessoMaus}
        perfeito={perfeito}
        className="text-foreground w-36 shrink-0 sm:w-44"
        label={`Execução do dia ${formatPercent(exec)}${
          maus.previstos ? `, hábitos evitados ${maus.evitados} de ${maus.previstos}` : ""
        }${perfeito ? ", dia perfeito" : ""}`}
      />
      <dl className="min-w-0 flex-1 space-y-2.5">
        <div>
          <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <span className="bg-brand-pink size-2 rounded-full" aria-hidden />
            Execução do dia
          </dt>
          <dd className="text-3xl leading-tight font-bold tabular-nums">
            {temItens ? formatPercent(exec) : "—"}
          </dd>
          {temItens && (
            <dd className="text-muted-foreground text-xs">
              {formatConcluidos(summary!.concluidos)} de {summary!.totalItens} itens
            </dd>
          )}
        </div>
        <div className="flex gap-5">
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <span className="bg-brand-orange size-2 rounded-full" aria-hidden />
              Evitados
            </dt>
            <dd className="text-lg font-bold tabular-nums">
              {maus.previstos ? `${maus.evitados}/${maus.previstos}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <span className="bg-brand-yellow size-2 rounded-full" aria-hidden />
              Pontuação
            </dt>
            <dd className="text-lg font-bold tabular-nums">{temItens ? summary!.pontuacao : "—"}</dd>
          </div>
        </div>
        {perfeito && <p className="text-xp text-sm font-semibold">✨ Dia perfeito!</p>}
      </dl>
    </section>
  );
}

export function StatCards({
  summary,
  streak,
  melhor,
  level,
  isToday,
}: {
  summary: DaySummary | null;
  streak: number;
  melhor: number;
  level: LevelInfo;
  isToday: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Sparkles className="text-primary size-4" aria-hidden />
          {isToday ? "XP hoje" : "XP no dia"}
        </p>
        <p className="text-xp text-2xl leading-none font-bold tabular-nums">+{summary?.xpGanho ?? 0}</p>
        <p className="text-muted-foreground text-xs">
          Nível {level.nivel} · {level.xpNoNivel}/{level.xpDoNivel}
        </p>
        <Progress
          value={level.progresso * 100}
          indicatorClassName="bg-brand-gradient"
          className="mt-1 h-1.5"
          aria-label={`Progresso do nível ${level.nivel}`}
        />
      </div>
      <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          <Flame className="text-primary size-4" aria-hidden />
          Dias seguidos
        </p>
        <p className="flex items-baseline gap-1 text-2xl leading-none font-bold tabular-nums">
          {streak}
          <span className="text-sm font-semibold">{streak === 1 ? "dia" : "dias"}</span>
        </p>
        <p className="text-muted-foreground text-xs">Melhor: {melhor}</p>
      </div>
    </div>
  );
}
