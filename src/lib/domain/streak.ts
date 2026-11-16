import { eachDay, weekStart } from "./dates";
import type { DateStr, DaySummary } from "./types";

export interface StreakResult {
  atual: number;
  melhor: number;
}

/**
 * Mantém só o primeiro dia de descanso de cada semana (segunda a domingo).
 * É a regra "1 dia de descanso por semana".
 */
export function validRestDays(restDays: Iterable<DateStr>): Set<DateStr> {
  const porSemana = new Map<DateStr, DateStr>();
  for (const d of [...restDays].sort()) {
    const ws = weekStart(d);
    if (!porSemana.has(ws)) porSemana.set(ws, d);
  }
  return new Set(porSemana.values());
}

/** Ainda dá para usar o descanso da semana de `date`? */
export function canUseRestDay(restDays: Iterable<DateStr>, date: DateStr): boolean {
  const ws = weekStart(date);
  for (const d of restDays) if (d !== date && weekStart(d) === ws) return false;
  return true;
}

/**
 * Sequência de dias que "contam" (execução ≥ limite).
 * - Dias sem itens previstos e dias de descanso válidos são neutros: não somam nem quebram.
 * - Hoje é neutro enquanto não conta (o dia ainda não acabou).
 */
export function computeStreak(
  summaries: Map<DateStr, DaySummary>,
  restDays: Iterable<DateStr>,
  start: DateStr,
  today: DateStr,
): StreakResult {
  if (start > today) return { atual: 0, melhor: 0 };
  const descanso = validRestDays(restDays);
  let atual = 0;
  let melhor = 0;
  for (const d of eachDay(start, today)) {
    const s = summaries.get(d);
    if (s?.contaSequencia) {
      atual += 1;
      melhor = Math.max(melhor, atual);
      continue;
    }
    if (descanso.has(d) || !s?.temItens || d === today) continue;
    atual = 0;
  }
  return { atual, melhor };
}
