import { habitProgress, isHabitScheduled } from "./day";
import { addDays, diffDays, eachDay, weekStart, weekday } from "./dates";
import type { DateStr, DaySummary, Habit, HabitLog, Task } from "./types";

// ─── Períodos ────────────────────────────────────────────────────────────────

export type PeriodPreset = "hoje" | "ontem" | "7d" | "30d" | "3m" | "1a" | "custom";

export const PERIOD_LABEL: Record<PeriodPreset, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7d": "7 dias",
  "30d": "30 dias",
  "3m": "3 meses",
  "1a": "1 ano",
  custom: "Personalizado",
};

export interface Period {
  from: DateStr;
  to: DateStr;
  dias: number;
}

export function periodRange(
  preset: PeriodPreset,
  today: DateStr,
  custom?: { from: DateStr; to: DateStr },
): Period {
  const last = (n: number) => ({ from: addDays(today, -(n - 1)), to: today });
  let r: { from: DateStr; to: DateStr };
  switch (preset) {
    case "hoje":
      r = { from: today, to: today };
      break;
    case "ontem":
      r = { from: addDays(today, -1), to: addDays(today, -1) };
      break;
    case "7d":
      r = last(7);
      break;
    case "30d":
      r = last(30);
      break;
    case "3m":
      r = last(90);
      break;
    case "1a":
      r = last(365);
      break;
    case "custom": {
      const from = custom?.from ?? addDays(today, -6);
      let to = custom?.to ?? today;
      if (to > today) to = today;
      r = from <= to ? { from, to } : { from: to, to: from };
      break;
    }
  }
  return { ...r, dias: diffDays(r.from, r.to) + 1 };
}

/** Período imediatamente anterior, com o mesmo tamanho (para a variação). */
export function previousPeriod(p: Period): Period {
  return { from: addDays(p.from, -p.dias), to: addDays(p.from, -1), dias: p.dias };
}

// ─── Resumo e série da pontuação ────────────────────────────────────────────

export interface ScorePoint {
  data: DateStr;
  /** null = dia sem itens previstos (fica de fora da média e do gráfico). */
  pontuacao: number | null;
}

/**
 * Pontuação de cada dia do período. `emAndamento` (hoje) fica de fora em períodos de vários dias:
 * o dia ainda não terminou e puxaria a linha e a média para baixo.
 */
export function scoreSeries(
  summaries: Map<DateStr, DaySummary>,
  p: Period,
  emAndamento?: DateStr,
): ScorePoint[] {
  return eachDay(p.from, p.to).map((d) => {
    const s = summaries.get(d);
    const aberto = p.dias > 1 && d === emAndamento;
    return { data: d, pontuacao: s?.temItens && !aberto ? s.pontuacao : null };
  });
}

export function mean(values: (number | null)[]): number | null {
  const v = values.filter((x): x is number => x !== null);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export interface PeriodSummary {
  mediaPontuacao: number | null;
  diasRegistrados: number;
  missoesConcluidas: number;
  xpGanho: number;
  diasPerfeitos: number;
}

export function periodSummary(input: {
  summaries: Map<DateStr, DaySummary>;
  habits: Habit[];
  logs: HabitLog[];
  tasks: Task[];
  period: Period;
  /** Dia em andamento (hoje), fora da média em períodos de vários dias. */
  emAndamento?: DateStr;
}): PeriodSummary {
  const { summaries, habits, logs, tasks, period: p, emAndamento } = input;
  const dentro = (d: DateStr) => d >= p.from && d <= p.to;
  const bons = new Set(habits.filter((h) => h.tipo === "bom").map((h) => h.id));
  const diasComRegistro = new Set<DateStr>();
  let missoes = 0;
  for (const l of logs) {
    if (!dentro(l.data)) continue;
    diasComRegistro.add(l.data);
    if (bons.has(l.habitId) && l.status === "feito") missoes += 1;
  }
  for (const t of tasks) {
    if (!dentro(t.data) || !t.concluida) continue;
    diasComRegistro.add(t.data);
    missoes += 1;
  }
  let xp = 0;
  let perfeitos = 0;
  for (const d of eachDay(p.from, p.to)) {
    const s = summaries.get(d);
    if (!s) continue;
    xp += s.xpGanho;
    if (s.diaPerfeito) perfeitos += 1;
  }
  return {
    mediaPontuacao: mean(scoreSeries(summaries, p, emAndamento).map((x) => x.pontuacao)),
    diasRegistrados: diasComRegistro.size,
    missoesConcluidas: missoes,
    xpGanho: xp,
    diasPerfeitos: perfeitos,
  };
}

// ─── Por hábito ─────────────────────────────────────────────────────────────

export interface HabitDay {
  data: DateStr;
  previsto: boolean;
  /** Volume do dia: quantidade registrada (meta numérica) ou 1/0 (check). */
  valor: number;
  /** 0–1 */
  progresso: number;
}

export interface HabitStats {
  dias: HabitDay[];
  previstos: number;
  /** Dias com a meta cumprida. */
  concluidos: number;
  /** concluidos / previstos (null sem dias previstos). */
  taxa: number | null;
  /** Soma do volume no período (ml, páginas, horas… ou dias feitos). */
  total: number;
  /** total / dias previstos */
  mediaDiaria: number | null;
  /** Maior sequência de dias previstos cumpridos (dias não previstos não quebram). */
  melhorSequencia: number;
}

export function habitStats(habit: Habit, logsDoHabito: HabitLog[], p: Period): HabitStats {
  const porDia = new Map(logsDoHabito.map((l) => [l.data, l]));
  const dias: HabitDay[] = [];
  let previstos = 0;
  let concluidos = 0;
  let total = 0;
  let seq = 0;
  let melhor = 0;
  for (const d of eachDay(p.from, p.to)) {
    const previsto = isHabitScheduled(habit, d);
    const log = porDia.get(d);
    const progresso = habitProgress(habit, log);
    const valor = habit.metaTipo === "quantidade" ? (log?.valor ?? 0) : progresso >= 1 ? 1 : 0;
    dias.push({ data: d, previsto, valor, progresso });
    total += valor;
    if (!previsto) continue;
    previstos += 1;
    if (progresso >= 1) {
      concluidos += 1;
      seq += 1;
      melhor = Math.max(melhor, seq);
    } else {
      seq = 0;
    }
  }
  return {
    dias,
    previstos,
    concluidos,
    taxa: previstos ? concluidos / previstos : null,
    total,
    mediaDiaria: previstos ? total / previstos : null,
    melhorSequencia: melhor,
  };
}

export interface Bucket {
  inicio: DateStr;
  fim: DateStr;
  valor: number;
}

/**
 * Agrupa uma série diária para caber no gráfico: até 31 dias, um ponto por dia;
 * acima disso, um por semana (soma).
 */
export function bucketize(dias: { data: DateStr; valor: number }[]): {
  porSemana: boolean;
  buckets: Bucket[];
} {
  if (dias.length <= 31) {
    return { porSemana: false, buckets: dias.map((d) => ({ inicio: d.data, fim: d.data, valor: d.valor })) };
  }
  const map = new Map<DateStr, Bucket>();
  for (const d of dias) {
    const ws = weekStart(d.data);
    const b = map.get(ws) ?? { inicio: d.data, fim: d.data, valor: 0 };
    b.fim = d.data;
    b.valor += d.valor;
    map.set(ws, b);
  }
  return { porSemana: true, buckets: [...map.values()] };
}

// ─── Hábitos a evitar ───────────────────────────────────────────────────────

export interface AvoidStat {
  habit: Habit;
  evitados: number;
  registrados: number;
  taxa: number | null;
}

export function avoidStats(habits: Habit[], logs: HabitLog[], p: Period): AvoidStat[] {
  return habits
    .filter((h) => h.tipo === "mau")
    .map((habit) => {
      let evitados = 0;
      let registrados = 0;
      for (const l of logs) {
        if (l.habitId !== habit.id || l.data < p.from || l.data > p.to) continue;
        if (l.status === "evitei") {
          evitados += 1;
          registrados += 1;
        } else if (l.status === "aconteceu") {
          registrados += 1;
        }
      }
      return { habit, evitados, registrados, taxa: registrados ? evitados / registrados : null };
    });
}

// ─── Heatmap anual de constância ────────────────────────────────────────────

export interface HeatCell {
  data: DateStr;
  /** 0 = sem itens/sem registro … 4 = dia perfeito */
  nivel: 0 | 1 | 2 | 3 | 4;
  pontuacao: number | null;
}

export function heatLevel(s: DaySummary | undefined): HeatCell["nivel"] {
  if (!s?.temItens || s.concluidos === 0) return 0;
  if (s.diaPerfeito) return 4;
  if (s.pontuacao >= 70) return 3;
  if (s.pontuacao >= 40) return 2;
  return 1;
}

export interface MonthStat {
  mes: string; // yyyy-MM
  media: number;
  dias: number;
}

/**
 * Últimas 53 semanas (colunas seg→dom) terminando na semana de hoje.
 * Também devolve o melhor e o pior mês (média da pontuação, meses com ≥ 5 dias com itens).
 */
export function yearHeatmap(summaries: Map<DateStr, DaySummary>, today: DateStr) {
  const fimSemana = addDays(weekStart(today), 6);
  const inicio = addDays(weekStart(today), -52 * 7);
  const semanas: (HeatCell | null)[][] = [];
  for (let w = inicio; w <= fimSemana; w = addDays(w, 7)) {
    semanas.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(w, i);
        if (d > today) return null;
        const s = summaries.get(d);
        return { data: d, nivel: heatLevel(s), pontuacao: s?.temItens ? s.pontuacao : null };
      }),
    );
  }

  const meses = new Map<string, { soma: number; dias: number }>();
  for (const col of semanas) {
    for (const c of col) {
      if (!c || c.pontuacao === null) continue;
      const m = c.data.slice(0, 7);
      const acc = meses.get(m) ?? { soma: 0, dias: 0 };
      acc.soma += c.pontuacao;
      acc.dias += 1;
      meses.set(m, acc);
    }
  }
  const validos: MonthStat[] = [...meses.entries()]
    .filter(([, v]) => v.dias >= 5)
    .map(([mes, v]) => ({ mes, media: v.soma / v.dias, dias: v.dias }));
  const melhor = validos.reduce<MonthStat | null>((a, b) => (!a || b.media > a.media ? b : a), null);
  const pior = validos.reduce<MonthStat | null>((a, b) => (!a || b.media < a.media ? b : a), null);
  return { semanas, melhorMes: melhor, piorMes: validos.length > 1 ? pior : null };
}

/** Quantos dias têm algum registro (para o estado vazio "registre 3 dias"). */
export function daysWithRecords(logs: HabitLog[], tasks: Task[]): number {
  const s = new Set(logs.map((l) => l.data));
  for (const t of tasks) if (t.concluida) s.add(t.data);
  return s.size;
}

export { weekday };
