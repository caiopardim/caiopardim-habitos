import { habitProgress, isHabitScheduled } from "./day";
import { addDays, eachDay, hourInTz, weekStart, weekday } from "./dates";
import { suggestedStep } from "./quantity";
import type { DateStr, DaySummary, Habit, HabitLog } from "./types";

const DIA_PLURAL = ["domingos", "segundas", "terças", "quartas", "quintas", "sextas", "sábados"];
const DIA_SINGULAR = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
/** "às segundas" / "aos sábados" */
const comDia = (wd: number) => `${wd === 0 || wd === 6 ? "aos" : "às"} ${DIA_PLURAL[wd]}`;

export interface Insight {
  id: string;
  texto: string;
  /** Quanto maior, mais relevante (ordena a lista). */
  forca: number;
}

export interface InsightInput {
  habits: Habit[];
  logs: HabitLog[];
  summaries: Map<DateStr, DaySummary>;
  from: DateStr;
  to: DateStr;
  fuso: string;
  /** Médias da pontuação no período e no anterior (para a tendência). */
  mediaAtual?: number | null;
  mediaAnterior?: number | null;
}

const MIN_AMOSTRAS_DIA = 3;

/**
 * Insights em texto, gerados por regras simples e conservadoras
 * (só aparecem com dados suficientes e diferenças relevantes).
 */
export function buildInsights(input: InsightInput): Insight[] {
  const { habits, logs, summaries, from, to, fuso } = input;
  const out: Insight[] = [];
  const logsPorHabito = new Map<string, Map<DateStr, HabitLog>>();
  for (const l of logs) {
    if (l.data < from || l.data > to) continue;
    let m = logsPorHabito.get(l.habitId);
    if (!m) logsPorHabito.set(l.habitId, (m = new Map()));
    m.set(l.data, l);
  }
  const dias = eachDay(from, to);

  for (const h of habits) {
    const reg = logsPorHabito.get(h.id) ?? new Map<DateStr, HabitLog>();

    if (h.tipo === "bom") {
      // 1) Dia da semana: onde o hábito acontece mais e menos.
      const feitos = Array(7).fill(0);
      const previstos = Array(7).fill(0);
      for (const d of dias) {
        if (!isHabitScheduled(h, d)) continue;
        const wd = weekday(d);
        previstos[wd] += 1;
        if (habitProgress(h, reg.get(d)) >= 1) feitos[wd] += 1;
      }
      const taxas = previstos
        .map((n, wd) => ({ wd, n, taxa: n >= MIN_AMOSTRAS_DIA ? feitos[wd] / n : null }))
        .filter((x): x is { wd: number; n: number; taxa: number } => x.taxa !== null);
      if (taxas.length >= 3) {
        const melhor = taxas.reduce((a, b) => (b.taxa > a.taxa ? b : a));
        const pior = taxas.reduce((a, b) => (b.taxa < a.taxa ? b : a));
        const dif = melhor.taxa - pior.taxa;
        if (dif >= 0.25) {
          const texto =
            pior.taxa === 0
              ? `${h.nome}: você quase nunca faz ${comDia(pior.wd)} — e ${comDia(melhor.wd)} faz em ${Math.round(melhor.taxa * 100)}% das vezes.`
              : `Você faz ${h.nome} ${Math.round((melhor.taxa / pior.taxa - 1) * 100)}% mais ${comDia(melhor.wd)} do que ${comDia(pior.wd)}.`;
          out.push({ id: `dia-${h.id}`, texto, forca: dif * 100 });
        }
      }

      // 2) Efeito no resto do dia: nos dias em que faz, cumpre mais das outras missões?
      const com: number[] = [];
      const sem: number[] = [];
      const horas: number[] = [];
      for (const d of dias) {
        const s = summaries.get(d);
        if (!s?.temItens || s.totalItens < 3 || !isHabitScheduled(h, d)) continue;
        const log = reg.get(d);
        const p = habitProgress(h, log);
        const outras = (s.concluidos - p) / (s.totalItens - 1);
        if (p >= 1) {
          com.push(outras);
          if (log?.concluidoEm) horas.push(hourInTz(fuso, new Date(log.concluidoEm)));
        } else if (p === 0) {
          sem.push(outras);
        }
      }
      if (com.length >= 5 && sem.length >= 5) {
        const a = com.reduce((x, y) => x + y, 0) / com.length;
        const b = sem.reduce((x, y) => x + y, 0) / sem.length;
        const pontos = Math.round((a - b) * 100);
        if (pontos >= 12) {
          const cedo = horas.length >= 5 && horas.filter((x) => x < 9).length / horas.length >= 0.6;
          out.push({
            id: `efeito-${h.id}`,
            texto: `Nos dias em que você faz ${h.nome}${cedo ? " (geralmente antes das 9h)" : ""}, cumpre ${pontos} pontos percentuais a mais das outras missões.`,
            forca: pontos + 10,
          });
        }
      }
    } else {
      // 3) Hábito a evitar: fim de semana × dias úteis.
      let fdsReg = 0;
      let fdsOc = 0;
      let uteisReg = 0;
      let uteisOc = 0;
      for (const [d, l] of reg) {
        if (l.status !== "evitei" && l.status !== "aconteceu") continue;
        const fds = weekday(d) === 0 || weekday(d) === 6;
        const oc = l.status === "aconteceu" ? 1 : 0;
        if (fds) {
          fdsReg += 1;
          fdsOc += oc;
        } else {
          uteisReg += 1;
          uteisOc += oc;
        }
      }
      if (fdsReg >= 4 && uteisReg >= 6) {
        const fds = fdsOc / fdsReg;
        const uteis = uteisOc / uteisReg;
        const pct = (x: number) => `${Math.round(x * 100)}%`;
        if (fds >= 0.2 && fds >= uteis * 1.5) {
          out.push({
            id: `fds-${h.id}`,
            texto: `${h.nome} acontece mais nos fins de semana (${pct(fds)} dos dias, contra ${pct(uteis)} nos dias úteis).`,
            forca: (fds - uteis) * 100,
          });
        } else if (uteis >= 0.2 && uteis >= fds * 1.5) {
          out.push({
            id: `uteis-${h.id}`,
            texto: `${h.nome} acontece mais nos dias úteis (${pct(uteis)} dos dias, contra ${pct(fds)} nos fins de semana).`,
            forca: (uteis - fds) * 100,
          });
        }
      }
    }
  }

  // 4) Dia da semana mais forte e mais difícil.
  const porDia = Array.from({ length: 7 }, () => [] as number[]);
  for (const d of dias) {
    const s = summaries.get(d);
    if (s?.temItens) porDia[weekday(d)].push(s.pontuacao);
  }
  const medias = porDia
    .map((v, wd) => ({ wd, n: v.length, media: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 }))
    .filter((x) => x.n >= MIN_AMOSTRAS_DIA);
  if (medias.length >= 5) {
    const forte = medias.reduce((a, b) => (b.media > a.media ? b : a));
    const fraco = medias.reduce((a, b) => (b.media < a.media ? b : a));
    if (forte.media - fraco.media >= 10) {
      out.push({
        id: "dia-forte",
        texto: `${DIA_SINGULAR[forte.wd]} é seu dia mais forte (média ${Math.round(forte.media)}); ${DIA_SINGULAR[fraco.wd].toLowerCase()}, o mais difícil (média ${Math.round(fraco.media)}).`,
        forca: forte.media - fraco.media,
      });
    }
  }

  // 5) Tendência em relação ao período anterior.
  const { mediaAtual, mediaAnterior } = input;
  if (mediaAtual != null && mediaAnterior != null && mediaAnterior > 0) {
    const v = Math.round(((mediaAtual - mediaAnterior) / mediaAnterior) * 100);
    if (Math.abs(v) >= 5) {
      out.push({
        id: "tendencia",
        texto:
          v > 0
            ? `Sua pontuação média subiu ${v}% em relação ao período anterior. Continue assim!`
            : `Sua pontuação média caiu ${Math.abs(v)}% em relação ao período anterior — uma queda no gráfico, não um recomeço.`,
        forca: Math.abs(v),
      });
    }
  }

  // Variedade: no máximo 2 insights do mesmo tipo, os mais fortes primeiro.
  const porTipo = new Map<string, number>();
  return out
    .sort((a, b) => b.forca - a.forca)
    .filter((i) => {
      const tipo = i.id.split("-")[0];
      const n = (porTipo.get(tipo) ?? 0) + 1;
      porTipo.set(tipo, n);
      return n <= 2;
    });
}

/**
 * Semana revisada: no domingo, a semana atual (seg→hoje); nos outros dias,
 * a última semana completa (seg→dom anterior).
 */
export function reviewRef(today: DateStr): DateStr {
  return isReviewDay(today) ? today : addDays(weekStart(today), -1);
}

// ─── Revisão semanal ────────────────────────────────────────────────────────

export type Ajuste =
  | { tipo: "reduzir_meta"; habit: Habit; novaMeta: number }
  | { tipo: "menos_dias"; habit: Habit; diasSemana: number[] }
  | { tipo: "nenhum" };

export interface WeeklyReview {
  inicio: DateStr;
  fim: DateStr;
  media: number | null;
  diasNaSequencia: number;
  diasPerfeitos: number;
  melhor: { habit: Habit; taxa: number } | null;
  pior: { habit: Habit; taxa: number } | null;
  ajuste: Ajuste;
}

/** Meta 30% menor, arredondada no passo da meta (ex.: 3000 ml → 2100 ml). */
export function reducedGoal(meta: number): number {
  const passo = suggestedStep(meta);
  const v = Math.max(passo, Math.round((meta * 0.7) / passo) * passo);
  return Math.round(v * 100) / 100;
}

/**
 * Resumo da semana (segunda a domingo) que contém `ref`, até `ref`,
 * com uma sugestão de ajuste para o hábito que mais faltou.
 */
export function weeklyReview(input: {
  habits: Habit[];
  logs: HabitLog[];
  summaries: Map<DateStr, DaySummary>;
  ref: DateStr;
}): WeeklyReview {
  const { habits, logs, summaries, ref } = input;
  const inicio = weekStart(ref);
  const fim = ref;
  const dias = eachDay(inicio, fim);

  let soma = 0;
  let n = 0;
  let seq = 0;
  let perfeitos = 0;
  for (const d of dias) {
    const s = summaries.get(d);
    if (!s?.temItens) continue;
    soma += s.pontuacao;
    n += 1;
    if (s.contaSequencia) seq += 1;
    if (s.diaPerfeito) perfeitos += 1;
  }

  const porHabito = new Map<string, Map<DateStr, HabitLog>>();
  for (const l of logs) {
    if (l.data < inicio || l.data > fim) continue;
    let m = porHabito.get(l.habitId);
    if (!m) porHabito.set(l.habitId, (m = new Map()));
    m.set(l.data, l);
  }
  const taxas = habits
    .filter((h) => h.tipo === "bom" && !h.arquivado)
    .map((habit) => {
      const prev = dias.filter((d) => isHabitScheduled(habit, d));
      const feitos = prev.filter((d) => habitProgress(habit, porHabito.get(habit.id)?.get(d)) >= 1).length;
      return { habit, previstos: prev.length, taxa: prev.length ? feitos / prev.length : 0 };
    })
    .filter((x) => x.previstos >= 3);

  const melhor = taxas.length ? taxas.reduce((a, b) => (b.taxa > a.taxa ? b : a)) : null;
  const pior = taxas.length ? taxas.reduce((a, b) => (b.taxa < a.taxa ? b : a)) : null;

  let ajuste: Ajuste = { tipo: "nenhum" };
  if (pior && pior.taxa < 0.6) {
    const h = pior.habit;
    if (h.metaTipo === "quantidade" && h.metaValor) {
      ajuste = { tipo: "reduzir_meta", habit: h, novaMeta: reducedGoal(h.metaValor) };
    } else if (h.diasSemana.length === 0 || h.diasSemana.length > 3) {
      ajuste = { tipo: "menos_dias", habit: h, diasSemana: [1, 3, 5] };
    }
  }

  return {
    inicio,
    fim,
    media: n ? soma / n : null,
    diasNaSequencia: seq,
    diasPerfeitos: perfeitos,
    melhor: melhor && melhor.taxa > 0 ? { habit: melhor.habit, taxa: melhor.taxa } : null,
    pior: pior && pior !== melhor ? { habit: pior.habit, taxa: pior.taxa } : null,
    ajuste,
  };
}

/** A revisão da semana fica em destaque aos domingos. */
export function isReviewDay(today: DateStr): boolean {
  return weekday(today) === 0;
}

export { addDays };
