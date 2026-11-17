import { addDays, todayInTz } from "../domain/dates";
import { minutesInTz } from "../domain/format";
import { indexLogsByDate, computeHistory } from "../domain/stats";
import {
  dueInWindow,
  JANELA_MINUTOS,
  planReminders,
  SEQUENCIA_HORARIO,
  type Reminder,
} from "../domain/reminders";
import type { DateStr, Habit, HabitLog, Profile, Task } from "../domain/types";

export interface PushSub {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

/** Dias de histórico usados para calcular a sequência no servidor. */
export const HISTORICO_DIAS = 120;

export interface CronDeps {
  now: Date;
  listSubscriptions(): Promise<PushSub[]>;
  /** Perfil e hábitos (para saber se há algum lembrete na janela). */
  loadUser(userId: string): Promise<{ profile: Profile; habits: Habit[] } | null>;
  /** Registros, tarefas e descansos de [from, to] + o que já foi enviado em `to`. */
  loadDays(
    userId: string,
    from: DateStr,
    to: DateStr,
  ): Promise<{ logs: HabitLog[]; tasks: Task[]; restDays: DateStr[]; sent: { tipo: string; ref: string }[] }>;
  send(sub: PushSub, payload: PushPayload): Promise<"ok" | "expirada" | "erro">;
  removeSubscription(endpoint: string): Promise<void>;
  logSent(userId: string, date: DateStr, reminders: Reminder[]): Promise<void>;
}

export interface CronResult {
  usuarios: number;
  avaliados: number;
  enviados: number;
  removidas: number;
}

/** Há algum horário de lembrete deste usuário dentro da janela atual? (evita consultas à toa) */
function hasCandidate(profile: Profile, habits: Habit[], minutes: number): boolean {
  const n = profile.notificacoes;
  if (n.fechamento && profile.lembreteHorario && dueInWindow(profile.lembreteHorario, minutes)) return true;
  if (n.sequencia && dueInWindow(SEQUENCIA_HORARIO, minutes)) return true;
  return n.habitos && habits.some((h) => h.lembrete && h.horario && dueInWindow(h.horario, minutes));
}

/**
 * Roda a cada 15 minutos: para cada usuário com aparelho inscrito, calcula no fuso dele
 * o que é devido agora (planReminders), envia para todos os aparelhos e registra.
 */
export async function runReminderCron(deps: CronDeps): Promise<CronResult> {
  const subs = await deps.listSubscriptions();
  const porUsuario = new Map<string, PushSub[]>();
  for (const s of subs) porUsuario.set(s.userId, [...(porUsuario.get(s.userId) ?? []), s]);

  const r: CronResult = { usuarios: porUsuario.size, avaliados: 0, enviados: 0, removidas: 0 };

  for (const [userId, aparelhos] of porUsuario) {
    try {
      const u = await deps.loadUser(userId);
      if (!u) continue;
      const { profile, habits } = u;
      const minutos = minutesInTz(profile.fuso, deps.now);
      if (!hasCandidate(profile, habits, minutos)) continue;
      r.avaliados += 1;

      const hoje = todayInTz(profile.fuso, deps.now);
      const inicio = addDays(hoje, -(HISTORICO_DIAS - 1));
      const dias = await deps.loadDays(userId, inicio, hoje);
      const hist = computeHistory({
        habits,
        tasks: dias.tasks,
        logs: dias.logs,
        restDays: dias.restDays,
        limiteSequencia: profile.limiteSequencia,
        start: inicio,
        today: hoje,
      });
      const lembretes = planReminders({
        date: hoje,
        nowMinutes: minutos,
        prefs: profile.notificacoes,
        lembreteHorario: profile.lembreteHorario,
        habits,
        logs: indexLogsByDate(dias.logs).get(hoje) ?? new Map(),
        summary: hist.summaries.get(hoje) ?? null,
        limiteSequencia: profile.limiteSequencia,
        sequenciaAtual: hist.streak.atual,
        sentToday: dias.sent,
        janela: JANELA_MINUTOS,
      });
      if (!lembretes.length) continue;

      for (const l of lembretes) {
        for (const a of aparelhos) {
          const res = await deps.send(a, {
            title: l.title,
            body: l.body,
            url: l.url,
            tag: `${l.tipo}-${l.ref}`,
          });
          if (res === "ok") r.enviados += 1;
          if (res === "expirada") {
            await deps.removeSubscription(a.endpoint);
            r.removidas += 1;
          }
        }
      }
      await deps.logSent(userId, hoje, lembretes);
    } catch (e) {
      // Um usuário com problema não impede os outros.
      console.error("Lembretes: falha no usuário", userId, e);
    }
  }
  return r;
}
