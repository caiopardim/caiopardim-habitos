"use client";

import { useMemo, useState } from "react";
import { AreaBars } from "@/components/evolution/area-bars";
import { Segmented } from "@/components/ui/segmented";
import { areaStats } from "@/lib/domain/areas";
import { addDays } from "@/lib/domain/dates";
import type { DateStr, Habit, HabitLog, LifeArea, Task } from "@/lib/domain/types";

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

  if (!areas.some((a) => a.emFoco || stats.has(a.id))) return null;

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
      <AreaBars areas={areas} stats={stats} />
    </section>
  );
}
