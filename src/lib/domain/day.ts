import { weekday } from "./dates";
import type { DateStr, DaySummary, Dificuldade, Habit, HabitLog, Task } from "./types";

export const XP_POR_DIFICULDADE: Record<Dificuldade, number> = {
  facil: 10,
  media: 20,
  dificil: 30,
};
/** Peso de cada dificuldade na Pontuação do Dia (proporcional ao XP). */
const PESO: Record<Dificuldade, number> = { facil: 1, media: 2, dificil: 3 };

export const XP_DIA_PERFEITO = 50;
export const XP_MAU_HABITO_EVITADO = 10;

const PESO_BONS = 0.7;
const PESO_MAUS = 0.3;

/** O hábito está previsto para este dia? */
export function isHabitScheduled(habit: Habit, date: DateStr): boolean {
  if (date < habit.inicio) return false;
  if (habit.arquivadoEm && date >= habit.arquivadoEm) return false;
  if (habit.arquivado && !habit.arquivadoEm) return false;
  if (habit.tipo === "mau") return true;
  return habit.diasSemana.length === 0 || habit.diasSemana.includes(weekday(date));
}

/** Fração concluída (0–1) de um bom hábito, a partir do registro do dia. */
export function habitProgress(habit: Habit, log: HabitLog | undefined): number {
  if (!log) return 0;
  if (habit.metaTipo === "quantidade") {
    const meta = habit.metaValor ?? 0;
    if (meta <= 0) return log.status === "feito" ? 1 : 0;
    return Math.min(Math.max((log.valor ?? 0) / meta, 0), 1);
  }
  if (log.status === "feito") return 1;
  if (log.status === "parcial") return 0.5;
  return 0;
}

/** Status coerente com o valor de uma meta numérica. */
export function statusForValue(valor: number, meta: number): "feito" | "parcial" | "nao_feito" {
  if (valor >= meta) return "feito";
  if (valor > 0) return "parcial";
  return "nao_feito";
}

export interface DayInput {
  date: DateStr;
  habits: Habit[];
  tasks: Task[];
  /** Registros do dia, por habitId. */
  logs: Map<string, HabitLog>;
  limiteSequencia: number;
}

export function computeDay({ date, habits, tasks, logs, limiteSequencia }: DayInput): DaySummary {
  let somaPeso = 0;
  let somaPesoFeito = 0;
  let concluidos = 0;
  let totalItens = 0;
  let xp = 0;

  const add = (dificuldade: Dificuldade, progresso: number) => {
    totalItens += 1;
    concluidos += progresso;
    somaPeso += PESO[dificuldade];
    somaPesoFeito += PESO[dificuldade] * progresso;
    xp += Math.round(XP_POR_DIFICULDADE[dificuldade] * progresso);
  };

  const maus = { previstos: 0, evitados: 0, aconteceram: 0 };

  for (const habit of habits) {
    if (!isHabitScheduled(habit, date)) continue;
    const log = logs.get(habit.id);
    if (habit.tipo === "bom") {
      add(habit.dificuldade, habitProgress(habit, log));
    } else {
      totalItens += 1;
      maus.previstos += 1;
      if (log?.status === "evitei") {
        maus.evitados += 1;
        concluidos += 1;
        xp += XP_MAU_HABITO_EVITADO;
      } else if (log?.status === "aconteceu") {
        maus.aconteceram += 1;
      }
    }
  }

  for (const task of tasks) {
    if (task.data !== date) continue;
    add(task.dificuldade, task.concluida ? 1 : 0);
  }

  const execucao = totalItens > 0 ? concluidos / totalItens : 0;
  const execBons = somaPeso > 0 ? somaPesoFeito / somaPeso : null;
  const sucessoMaus = maus.previstos > 0 ? maus.evitados / maus.previstos : null;

  let pontuacao = 0;
  if (execBons !== null && sucessoMaus !== null) {
    pontuacao = PESO_BONS * execBons + PESO_MAUS * sucessoMaus;
  } else {
    pontuacao = execBons ?? sucessoMaus ?? 0;
  }

  // Evita que 0,9999… vire "não perfeito" por erro de ponto flutuante.
  const execucaoArred = Math.round(execucao * 10_000) / 10_000;
  const diaPerfeito = totalItens > 0 && execucaoArred >= 1 && maus.aconteceram === 0;
  if (diaPerfeito) xp += XP_DIA_PERFEITO;

  return {
    data: date,
    temItens: totalItens > 0,
    totalItens,
    concluidos,
    execucao: execucaoArred,
    pontuacao: Math.round(pontuacao * 100),
    xpGanho: xp,
    diaPerfeito,
    contaSequencia: totalItens > 0 && execucaoArred >= limiteSequencia,
    maus,
  };
}

/** Média simples e variação percentual (vs. período anterior). */
export function averageScore(summaries: DaySummary[]): number | null {
  const comItens = summaries.filter((s) => s.temItens);
  if (comItens.length === 0) return null;
  return comItens.reduce((acc, s) => acc + s.pontuacao, 0) / comItens.length;
}

export function percentChange(atual: number | null, anterior: number | null): number | null {
  if (atual === null || anterior === null || anterior === 0) return null;
  return ((atual - anterior) / anterior) * 100;
}
