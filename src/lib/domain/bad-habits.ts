import { diffDays } from "./dates";
import type { DateStr, Habit, HabitLog } from "./types";

export const MARCOS = [1, 3, 7, 14, 30, 60, 90, 180, 365] as const;

export interface BadHabitStats {
  /** Dias desde a última ocorrência (ou desde o início do controle). */
  diasLimpo: number;
  recorde: number;
  proximoMarco: number | null;
  ultimoMarco: number | null;
}

/** `logs` = registros deste hábito (qualquer ordem). */
export function badHabitStats(habit: Habit, logs: HabitLog[], today: DateStr): BadHabitStats {
  const ocorrencias = logs
    .filter((l) => l.status === "aconteceu" && l.data <= today && l.data >= habit.inicio)
    .map((l) => l.data)
    .sort();

  let recorde = 0;
  let anterior = habit.inicio;
  for (const o of ocorrencias) {
    recorde = Math.max(recorde, diffDays(anterior, o));
    anterior = o;
  }
  const diasLimpo = Math.max(0, diffDays(anterior, today));
  recorde = Math.max(recorde, diasLimpo);

  return {
    diasLimpo,
    recorde,
    proximoMarco: MARCOS.find((m) => m > diasLimpo) ?? null,
    ultimoMarco: [...MARCOS].reverse().find((m) => m <= diasLimpo) ?? null,
  };
}

/** Dias "Evitei" / dias registrados no período. `null` se não houver registros. */
export function successRate(logs: HabitLog[], from: DateStr, to: DateStr): number | null {
  let evitei = 0;
  let total = 0;
  for (const l of logs) {
    if (l.data < from || l.data > to) continue;
    if (l.status === "evitei") {
      evitei += 1;
      total += 1;
    } else if (l.status === "aconteceu") {
      total += 1;
    }
  }
  return total > 0 ? evitei / total : null;
}
