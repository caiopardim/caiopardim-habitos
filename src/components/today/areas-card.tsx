"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { areaStats } from "@/lib/domain/areas";
import { addDays } from "@/lib/domain/dates";
import type { DateStr, Habit, HabitLog, LifeArea, Task } from "@/lib/domain/types";
import { formatPercent } from "@/lib/utils";

type Periodo = "dia" | "7" | "30";

export function AreasCard({
  date,
  areas,
  habits,
  tasks,
  logsByDate,
}: {
  date: DateStr;
  areas: LifeArea[];
  habits: Habit[];
  tasks: Task[];
  logsByDate: Map<DateStr, Map<string, HabitLog>>;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("7");
  const stats = useMemo(() => {
    const from = periodo === "dia" ? date : addDays(date, -(Number(periodo) - 1));
    return areaStats({ habits, tasks, logsByDate, from, to: date });
  }, [periodo, date, habits, tasks, logsByDate]);

  const linhas = [...areas]
    .sort((a, b) => a.ordem - b.ordem)
    .filter((a) => a.emFoco || stats.has(a.id))
    .map((a) => ({ area: a, pct: stats.get(a.id)?.pct ?? null }));

  if (linhas.length === 0) return null;

  return (
    <section aria-labelledby="areas" className="bg-card space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="areas" className="text-base font-bold">
          Áreas da vida
        </h2>
        <Segmented<Periodo>
          label="Período"
          value={periodo}
          onChange={setPeriodo}
          className="w-52"
          options={[
            { value: "dia", label: "Dia" },
            { value: "7", label: "7 dias" },
            { value: "30", label: "30 dias" },
          ]}
        />
      </div>
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
    </section>
  );
}
