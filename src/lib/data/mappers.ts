import { z } from "zod";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type DaySummary,
  type Habit,
  type HabitLog,
  type LifeArea,
  type Profile,
  type Task,
} from "../domain/types";

/** Converte linhas do Postgres (snake_case) ⇄ objetos de domínio (camelCase), validando com Zod. */

const num = z.union([z.number(), z.string()]).transform(Number);
const numOrNull = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => (v === null ? null : Number(v)));
const dificuldade = z.enum(["facil", "media", "dificil"]);

export const profileRow = z
  .object({
    id: z.string(),
    nome: z.string(),
    fuso: z.string(),
    limite_sequencia: num,
    xp_total: num,
    nivel: num,
    onboarding_concluido: z.boolean(),
    objetivo: z.string().nullable().optional(),
    lembrete_horario: z.string().nullable().optional(),
    notif_fechamento: z.boolean().optional(),
    notif_habitos: z.boolean().optional(),
    notif_sequencia: z.boolean().optional(),
    silencio_inicio: z.string().nullable().optional(),
    silencio_fim: z.string().nullable().optional(),
    notif_max_dia: num.optional(),
    criado_em: z.string(),
  })
  .transform((r): Profile => ({
    id: r.id,
    nome: r.nome,
    fuso: r.fuso,
    limiteSequencia: r.limite_sequencia,
    xpTotal: r.xp_total,
    nivel: r.nivel,
    onboardingConcluido: r.onboarding_concluido,
    objetivo: r.objetivo ?? null,
    lembreteHorario: r.lembrete_horario ? r.lembrete_horario.slice(0, 5) : null,
    notificacoes: {
      fechamento: r.notif_fechamento ?? DEFAULT_NOTIFICATION_PREFS.fechamento,
      habitos: r.notif_habitos ?? DEFAULT_NOTIFICATION_PREFS.habitos,
      sequencia: r.notif_sequencia ?? DEFAULT_NOTIFICATION_PREFS.sequencia,
      silencioInicio: r.silencio_inicio?.slice(0, 5) ?? DEFAULT_NOTIFICATION_PREFS.silencioInicio,
      silencioFim: r.silencio_fim?.slice(0, 5) ?? DEFAULT_NOTIFICATION_PREFS.silencioFim,
      maxPorDia: r.notif_max_dia ?? DEFAULT_NOTIFICATION_PREFS.maxPorDia,
    },
    criadoEm: r.criado_em,
  }));

export const areaRow = z
  .object({ id: z.string(), nome: z.string(), cor: z.string(), ordem: num, em_foco: z.boolean() })
  .transform((r): LifeArea => ({ id: r.id, nome: r.nome, cor: r.cor, ordem: r.ordem, emFoco: r.em_foco }));

export const habitRow = z
  .object({
    id: z.string(),
    area_id: z.string().nullable(),
    tipo: z.enum(["bom", "mau"]),
    nome: z.string(),
    emoji: z.string(),
    cor: z.string(),
    meta_tipo: z.enum(["check", "quantidade"]),
    meta_valor: numOrNull,
    unidade: z.string().nullable(),
    dias_semana: z.array(num),
    dificuldade,
    horario: z.string().nullable(),
    lembrete: z.boolean().optional(),
    inicio: z.string(),
    arquivado: z.boolean(),
    arquivado_em: z.string().nullable(),
    criado_em: z.string(),
  })
  .transform((r): Habit => ({
    id: r.id,
    areaId: r.area_id,
    tipo: r.tipo,
    nome: r.nome,
    emoji: r.emoji,
    cor: r.cor,
    metaTipo: r.meta_tipo,
    metaValor: r.meta_valor,
    unidade: r.unidade,
    diasSemana: r.dias_semana,
    dificuldade: r.dificuldade,
    horario: r.horario ? r.horario.slice(0, 5) : null,
    lembrete: r.lembrete ?? false,
    inicio: r.inicio,
    arquivado: r.arquivado,
    arquivadoEm: r.arquivado_em,
    criadoEm: r.criado_em,
  }));

export const taskRow = z
  .object({
    id: z.string(),
    area_id: z.string().nullable(),
    titulo: z.string(),
    prioridade: z.enum(["alta", "media", "baixa"]),
    dificuldade,
    data: z.string(),
    concluida: z.boolean(),
    concluida_em: z.string().nullable(),
  })
  .transform((r): Task => ({
    id: r.id,
    areaId: r.area_id,
    titulo: r.titulo,
    prioridade: r.prioridade,
    dificuldade: r.dificuldade,
    data: r.data,
    concluida: r.concluida,
    concluidaEm: r.concluida_em,
  }));

export const logRow = z
  .object({
    id: z.string(),
    habit_id: z.string(),
    data: z.string(),
    status: z.enum(["feito", "parcial", "nao_feito", "evitei", "aconteceu"]),
    valor: numOrNull,
    concluido_em: z.string().nullable(),
  })
  .transform((r): HabitLog => ({
    id: r.id,
    habitId: r.habit_id,
    data: r.data,
    status: r.status,
    valor: r.valor,
    concluidoEm: r.concluido_em,
  }));

export function profileToRow(p: Partial<Omit<Profile, "id" | "criadoEm">>) {
  const row: Record<string, unknown> = {};
  if (p.nome !== undefined) row.nome = p.nome;
  if (p.fuso !== undefined) row.fuso = p.fuso;
  if (p.limiteSequencia !== undefined) row.limite_sequencia = p.limiteSequencia;
  if (p.xpTotal !== undefined) row.xp_total = p.xpTotal;
  if (p.nivel !== undefined) row.nivel = p.nivel;
  if (p.onboardingConcluido !== undefined) row.onboarding_concluido = p.onboardingConcluido;
  if (p.objetivo !== undefined) row.objetivo = p.objetivo;
  if (p.lembreteHorario !== undefined) row.lembrete_horario = p.lembreteHorario;
  if (p.notificacoes !== undefined) {
    const n = p.notificacoes;
    row.notif_fechamento = n.fechamento;
    row.notif_habitos = n.habitos;
    row.notif_sequencia = n.sequencia;
    row.silencio_inicio = n.silencioInicio;
    row.silencio_fim = n.silencioFim;
    row.notif_max_dia = n.maxPorDia;
  }
  return row;
}

export const areaToRow = (a: LifeArea, userId: string) => ({
  id: a.id,
  user_id: userId,
  nome: a.nome,
  cor: a.cor,
  ordem: a.ordem,
  em_foco: a.emFoco,
});

export const habitToRow = (h: Habit, userId: string) => ({
  id: h.id,
  user_id: userId,
  area_id: h.areaId,
  tipo: h.tipo,
  nome: h.nome,
  emoji: h.emoji,
  cor: h.cor,
  meta_tipo: h.metaTipo,
  meta_valor: h.metaTipo === "quantidade" ? h.metaValor : null,
  unidade: h.metaTipo === "quantidade" ? h.unidade : null,
  dias_semana: h.diasSemana,
  dificuldade: h.dificuldade,
  horario: h.horario,
  lembrete: h.lembrete,
  inicio: h.inicio,
  arquivado: h.arquivado,
  arquivado_em: h.arquivadoEm,
});

export const taskToRow = (t: Task, userId: string) => ({
  id: t.id,
  user_id: userId,
  area_id: t.areaId,
  titulo: t.titulo,
  prioridade: t.prioridade,
  dificuldade: t.dificuldade,
  data: t.data,
  concluida: t.concluida,
  concluida_em: t.concluidaEm,
});

export const logToRow = (l: HabitLog, userId: string) => ({
  id: l.id,
  user_id: userId,
  habit_id: l.habitId,
  data: l.data,
  status: l.status,
  valor: l.valor,
  concluido_em: l.concluidoEm,
});

export const summaryToRow = (s: DaySummary, userId: string) => ({
  user_id: userId,
  data: s.data,
  execucao: Math.min(1, Math.max(0, s.execucao)),
  pontuacao: s.pontuacao,
  xp_ganho: s.xpGanho,
  dia_perfeito: s.diaPerfeito,
  conta_sequencia: s.contaSequencia,
  atualizado_em: new Date().toISOString(),
});
