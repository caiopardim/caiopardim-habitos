import { computeDay } from "./day";
import { eachDay } from "./dates";
import { computeStreak, type StreakResult } from "./streak";
import type { DateStr, DaySummary, Habit, HabitLog, Task } from "./types";
import { levelFromXp, type LevelInfo } from "./xp";

export interface HistoryInput {
  habits: Habit[];
  tasks: Task[];
  logs: HabitLog[];
  restDays: DateStr[];
  limiteSequencia: number;
  /** Primeiro dia de uso (criação do perfil, no fuso do usuário). */
  start: DateStr;
  today: DateStr;
}

export interface History {
  /** Primeiro dia do histórico (perfil, hábito, tarefa ou registro mais antigo). */
  start: DateStr;
  summaries: Map<DateStr, DaySummary>;
  streak: StreakResult;
  xpTotal: number;
  level: LevelInfo;
  diasPerfeitos: number;
}

export function indexLogsByDate(logs: HabitLog[]): Map<DateStr, Map<string, HabitLog>> {
  const idx = new Map<DateStr, Map<string, HabitLog>>();
  for (const l of logs) {
    let dia = idx.get(l.data);
    if (!dia) idx.set(l.data, (dia = new Map()));
    dia.set(l.habitId, l);
  }
  return idx;
}

/** Calcula o resumo de cada dia, sequência, XP total e nível. */
export function computeHistory(input: HistoryInput): History {
  const { habits, tasks, logs, restDays, limiteSequencia, today } = input;
  // O histórico começa no que vier primeiro: criação do perfil, hábito, tarefa ou registro.
  let start = input.start;
  for (const h of habits) if (h.inicio < start) start = h.inicio;
  for (const t of tasks) if (t.data < start) start = t.data;
  for (const l of logs) if (l.data < start) start = l.data;

  const logsIdx = indexLogsByDate(logs);
  const tasksIdx = new Map<DateStr, Task[]>();
  for (const t of tasks) tasksIdx.set(t.data, [...(tasksIdx.get(t.data) ?? []), t]);

  const summaries = new Map<DateStr, DaySummary>();
  let xpTotal = 0;
  let diasPerfeitos = 0;
  const vazio = new Map<string, HabitLog>();
  for (const d of start <= today ? eachDay(start, today) : []) {
    const s = computeDay({
      date: d,
      habits,
      tasks: tasksIdx.get(d) ?? [],
      logs: logsIdx.get(d) ?? vazio,
      limiteSequencia,
    });
    summaries.set(d, s);
    xpTotal += s.xpGanho;
    if (s.diaPerfeito) diasPerfeitos += 1;
  }

  return {
    start,
    summaries,
    streak: computeStreak(summaries, restDays, start, today),
    xpTotal,
    level: levelFromXp(xpTotal),
    diasPerfeitos,
  };
}
