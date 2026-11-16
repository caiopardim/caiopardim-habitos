import { Flame, Gauge, Sparkles, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DaySummary } from "@/lib/domain/types";
import type { LevelInfo } from "@/lib/domain/xp";
import { cn, formatPercent } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  children,
}: {
  icon: typeof Flame;
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-card flex flex-col gap-1 rounded-xl border p-3.5">
      <div className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
        <Icon className={cn("size-4", accent && "text-primary")} aria-hidden />
        {label}
      </div>
      <p className={cn("text-3xl leading-none font-bold tabular-nums", accent && "text-xp")}>{value}</p>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      {children}
    </div>
  );
}

export function SummaryCards({
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
  const exec = summary?.execucao ?? 0;
  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
      <StatCard
        icon={Target}
        label="Execução do dia"
        value={summary?.temItens ? formatPercent(exec) : "—"}
        hint={
          summary?.temItens
            ? `${formatConcluidos(summary.concluidos)} de ${summary.totalItens} itens`
            : "Nada previsto"
        }
      >
        <Progress value={exec * 100} className="mt-1.5 h-1.5" aria-label="Execução do dia" />
      </StatCard>
      <StatCard
        icon={Gauge}
        label="Pontuação do Dia"
        value={summary?.temItens ? summary.pontuacao : "—"}
        hint={summary?.diaPerfeito ? "✨ Dia perfeito!" : "de 100"}
      />
      <StatCard
        icon={Sparkles}
        label={isToday ? "XP hoje" : "XP no dia"}
        value={`+${summary?.xpGanho ?? 0}`}
        accent
        hint={`Nível ${level.nivel} · ${level.xpNoNivel}/${level.xpDoNivel}`}
      >
        <Progress
          value={level.progresso * 100}
          className="mt-1.5 h-1.5"
          aria-label={`Progresso do nível ${level.nivel}`}
        />
      </StatCard>
      <StatCard
        icon={Flame}
        label="Dias seguidos"
        value={
          <span className="flex items-baseline gap-1">
            {streak}
            <span className="text-base font-semibold">{streak === 1 ? "dia" : "dias"}</span>
          </span>
        }
        hint={`Melhor: ${melhor}`}
      />
    </div>
  );
}

function formatConcluidos(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");
}
