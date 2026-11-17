import { habitProgress, isHabitScheduled } from "./day";
import { itemsToStreak } from "./greeting";
import type { DateStr, DaySummary, Habit, HabitLog, NotificationPrefs } from "./types";
import { formatNumberPtBr } from "./format";

export type ReminderTipo = "habito" | "fechamento" | "sequencia";

export interface Reminder {
  tipo: ReminderTipo;
  /** Identifica o lembrete no dia (id do hábito; vazio nos gerais) — evita repetição. */
  ref: string;
  title: string;
  body: string;
  url: string;
}

/** Horário fixo do aviso de sequência em risco. */
export const SEQUENCIA_HORARIO = "20:00";
/** De quanto em quanto tempo o servidor verifica os lembretes. */
export const JANELA_MINUTOS = 15;

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

/** O minuto `now` está no horário silencioso? (a faixa pode atravessar a meia-noite) */
export function inQuietHours(now: number, inicio: string, fim: string): boolean {
  const a = toMinutes(inicio);
  const b = toMinutes(fim);
  if (a === b) return false;
  return a < b ? now >= a && now < b : now >= a || now < b;
}

/** O horário `hhmm` caiu na janela (now − janela, now]? */
export function dueInWindow(hhmm: string, now: number, janela = JANELA_MINUTOS): boolean {
  const t = toMinutes(hhmm);
  return t <= now && t > now - janela;
}

export interface PlanInput {
  date: DateStr;
  /** Minutos desde a meia-noite, no fuso do usuário. */
  nowMinutes: number;
  prefs: NotificationPrefs;
  lembreteHorario: string | null;
  habits: Habit[];
  /** Registros de hoje, por habitId. */
  logs: Map<string, HabitLog>;
  summary: DaySummary | null;
  limiteSequencia: number;
  sequenciaAtual: number;
  /** O que já foi enviado hoje. */
  sentToday: { tipo: string; ref: string }[];
  janela?: number;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Quais notificações mandar agora. Respeita: tipos desligados, horário silencioso,
 * limite por dia e não repetir o mesmo lembrete no dia.
 */
export function planReminders(input: PlanInput): Reminder[] {
  const { date, nowMinutes: now, prefs, summary, sentToday } = input;
  const janela = input.janela ?? JANELA_MINUTOS;
  if (inQuietHours(now, prefs.silencioInicio, prefs.silencioFim)) return [];
  const restantes = prefs.maxPorDia - sentToday.length;
  if (restantes <= 0) return [];
  const jaFoi = (tipo: string, ref = "") => sentToday.some((s) => s.tipo === tipo && s.ref === ref);

  const out: Reminder[] = [];

  // Sequência em risco (mais específico que o fechamento: se os dois caírem juntos, vai só este).
  let sequencia = false;
  if (
    prefs.sequencia &&
    input.sequenciaAtual >= 2 &&
    summary?.temItens &&
    !summary.contaSequencia &&
    dueInWindow(SEQUENCIA_HORARIO, now, janela) &&
    !jaFoi("sequencia")
  ) {
    const faltam = itemsToStreak(summary, input.limiteSequencia);
    out.push({
      tipo: "sequencia",
      ref: "",
      title: `Sua sequência de ${input.sequenciaAtual} dias está em risco`,
      body: `Mais ${plural(faltam, "item", "itens")} e ela continua. Você consegue!`,
      url: "/hoje",
    });
    sequencia = true;
  }

  // Fechar o dia
  if (
    prefs.fechamento &&
    input.lembreteHorario &&
    summary?.temItens &&
    summary.execucao < 1 &&
    dueInWindow(input.lembreteHorario, now, janela) &&
    !jaFoi("fechamento") &&
    !sequencia
  ) {
    const pendentes = Math.max(0, Math.round(summary.totalItens - summary.concluidos));
    out.push({
      tipo: "fechamento",
      ref: "",
      title: "Como foi seu dia?",
      body:
        pendentes > 0
          ? `Registre o que você fez — ${plural(pendentes, "item ainda aberto", "itens ainda abertos")}.`
          : "Registre o que você fez hoje.",
      url: "/hoje",
    });
  }

  // Por hábito, no horário sugerido
  if (prefs.habitos) {
    for (const h of input.habits) {
      if (h.tipo !== "bom" || !h.lembrete || !h.horario || h.arquivado) continue;
      if (!isHabitScheduled(h, date) || !dueInWindow(h.horario, now, janela) || jaFoi("habito", h.id))
        continue;
      if (habitProgress(h, input.logs.get(h.id)) >= 1) continue;
      const meta =
        h.metaTipo === "quantidade" && h.metaValor
          ? `Meta de hoje: ${formatNumberPtBr(h.metaValor)} ${h.unidade ?? ""}`.trim()
          : "Toque para marcar quando fizer.";
      out.push({
        tipo: "habito",
        ref: h.id,
        title: `${h.emoji} Hora de ${h.nome}`,
        body: meta,
        url: "/hoje",
      });
    }
  }

  // Limite do dia: prioridade sequência > fechamento > hábitos (ordem de inserção)
  return out.slice(0, restantes);
}
