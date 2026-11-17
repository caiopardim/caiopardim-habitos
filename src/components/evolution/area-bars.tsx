import type { AreaStat } from "@/lib/domain/areas";
import type { LifeArea } from "@/lib/domain/types";
import { formatPercent } from "@/lib/utils";

/** Barras horizontais de execução por área (cor da área = identidade; texto sempre em tinta neutra). */
export function AreaBars({ areas, stats }: { areas: LifeArea[]; stats: Map<string | null, AreaStat> }) {
  const linhas = [...areas]
    .sort((a, b) => a.ordem - b.ordem)
    .filter((a) => a.emFoco || stats.has(a.id))
    .map((a) => ({ area: a, pct: stats.get(a.id)?.pct ?? null }));
  if (linhas.length === 0) return null;
  return (
    <ul className="space-y-3">
      {linhas.map(({ area, pct }) => (
        <li key={area.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: area.cor }} aria-hidden />
              {area.nome}
            </span>
            <span className="text-muted-foreground font-semibold tabular-nums">
              {pct === null ? "sem itens" : formatPercent(pct)}
            </span>
          </div>
          <div
            className="bg-muted h-2 overflow-hidden rounded-full"
            role="progressbar"
            aria-label={area.nome}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct === null ? undefined : Math.round(pct * 100)}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${(pct ?? 0) * 100}%`, background: area.cor }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
