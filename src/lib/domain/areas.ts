import { habitProgress, isHabitScheduled } from "./day";
import { addDays } from "./dates";
import type { DateStr, Habit, HabitLog, Task } from "./types";

export interface AreaStat {
  areaId: string | null;
  previstos: number;
  /** Soma das frações concluídas (meta numérica parcial conta proporcionalmente). */
  concluidos: number;
  /** 0–1, ou null sem itens previstos. */
  pct: number | null;
}

/**
 * Execução por área da vida no período [from, to]:
 * bons hábitos (proporcional), tarefas e maus hábitos ("Evitei" conta como concluído).
 */
export function areaStats(input: {
  habits: Habit[];
  tasks: Task[];
  logsByDate: Map<DateStr, Map<string, HabitLog>>;
  from: DateStr;
  to: DateStr;
}): Map<string | null, AreaStat> {
  const { habits, tasks, logsByDate, from, to } = input;
  const out = new Map<string | null, AreaStat>();
  const add = (areaId: string | null, feito: number) => {
    const s = out.get(areaId) ?? { areaId, previstos: 0, concluidos: 0, pct: null };
    s.previstos += 1;
    s.concluidos += feito;
    out.set(areaId, s);
  };

  for (let d = from; d <= to; d = addDays(d, 1)) {
    const logs = logsByDate.get(d);
    for (const h of habits) {
      if (!isHabitScheduled(h, d)) continue;
      const log = logs?.get(h.id);
      add(h.areaId, h.tipo === "bom" ? habitProgress(h, log) : log?.status === "evitei" ? 1 : 0);
    }
  }
  for (const t of tasks) {
    if (t.data >= from && t.data <= to) add(t.areaId, t.concluida ? 1 : 0);
  }
  for (const s of out.values()) s.pct = s.previstos ? s.concluidos / s.previstos : null;
  return out;
}
