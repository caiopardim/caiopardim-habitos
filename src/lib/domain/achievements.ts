import { badHabitStats } from "./bad-habits";
import type { DateStr, Habit, HabitLog } from "./types";

/** Tudo o que as medalhas observam (derivado do histórico). */
export interface AchievementContext {
  melhorSequencia: number;
  diasRegistrados: number;
  diasPerfeitos: number;
  /** Maior número de dias seguidos sem um hábito a evitar (qualquer um deles). */
  recordeEvitar: number;
  temporadasConcluidas: number;
  nivel: number;
  totalConcluidos: number;
}

export type AchievementCategoria =
  "sequencia" | "constancia" | "perfeicao" | "evitar" | "temporada" | "nivel";

export interface AchievementDef {
  codigo: string;
  nome: string;
  descricao: string;
  emoji: string;
  categoria: AchievementCategoria;
  alvo: number;
  valor: (c: AchievementContext) => number;
}

export const CATEGORIA_LABEL: Record<AchievementCategoria, string> = {
  sequencia: "Dias seguidos",
  constancia: "Constância",
  perfeicao: "Dias perfeitos",
  evitar: "Hábitos evitados",
  temporada: "Temporadas",
  nivel: "Níveis",
};

const seq = (n: number, emoji: string, nome: string): AchievementDef => ({
  codigo: `seq_${n}`,
  nome,
  descricao: `${n} dias seguidos na sequência`,
  emoji,
  categoria: "sequencia",
  alvo: n,
  valor: (c) => c.melhorSequencia,
});

/** Catálogo de medalhas (a ordem é a de exibição). */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    codigo: "primeiro_passo",
    nome: "Primeiro passo",
    descricao: "Concluir sua primeira missão",
    emoji: "🌱",
    categoria: "constancia",
    alvo: 1,
    valor: (c) => c.totalConcluidos,
  },
  {
    codigo: "dias_10",
    nome: "Pegando o ritmo",
    descricao: "10 dias com registro",
    emoji: "📈",
    categoria: "constancia",
    alvo: 10,
    valor: (c) => c.diasRegistrados,
  },
  {
    codigo: "dias_30",
    nome: "Um mês de você",
    descricao: "30 dias com registro",
    emoji: "🗓️",
    categoria: "constancia",
    alvo: 30,
    valor: (c) => c.diasRegistrados,
  },
  {
    codigo: "dias_100",
    nome: "Cem dias",
    descricao: "100 dias com registro",
    emoji: "💯",
    categoria: "constancia",
    alvo: 100,
    valor: (c) => c.diasRegistrados,
  },
  {
    codigo: "dias_365",
    nome: "Uma volta ao sol",
    descricao: "365 dias com registro",
    emoji: "☀️",
    categoria: "constancia",
    alvo: 365,
    valor: (c) => c.diasRegistrados,
  },

  seq(3, "✨", "Começou a girar"),
  seq(7, "🔥", "Uma semana inteira"),
  seq(14, "⚡", "Duas semanas firmes"),
  seq(30, "🏅", "Um mês seguido"),
  seq(60, "🚀", "Dois meses seguidos"),
  seq(90, "💎", "Trimestre de ouro"),
  seq(180, "🌋", "Meio ano seguido"),
  seq(365, "👑", "Um ano seguido"),

  {
    codigo: "perfeito_1",
    nome: "Dia perfeito",
    descricao: "Seu primeiro dia perfeito",
    emoji: "🌟",
    categoria: "perfeicao",
    alvo: 1,
    valor: (c) => c.diasPerfeitos,
  },
  {
    codigo: "perfeito_7",
    nome: "Sete perfeitos",
    descricao: "7 dias perfeitos",
    emoji: "🌠",
    categoria: "perfeicao",
    alvo: 7,
    valor: (c) => c.diasPerfeitos,
  },
  {
    codigo: "perfeito_30",
    nome: "Perfeição constante",
    descricao: "30 dias perfeitos",
    emoji: "🌌",
    categoria: "perfeicao",
    alvo: 30,
    valor: (c) => c.diasPerfeitos,
  },

  {
    codigo: "evitar_7",
    nome: "Uma semana livre",
    descricao: "7 dias seguidos sem um hábito a evitar",
    emoji: "🛡️",
    categoria: "evitar",
    alvo: 7,
    valor: (c) => c.recordeEvitar,
  },
  {
    codigo: "evitar_30",
    nome: "Trinta dias livre",
    descricao: "30 dias seguidos sem um hábito a evitar",
    emoji: "🔓",
    categoria: "evitar",
    alvo: 30,
    valor: (c) => c.recordeEvitar,
  },
  {
    codigo: "evitar_90",
    nome: "Novo hábito, nova vida",
    descricao: "90 dias seguidos sem um hábito a evitar",
    emoji: "🕊️",
    categoria: "evitar",
    alvo: 90,
    valor: (c) => c.recordeEvitar,
  },

  {
    codigo: "temporada_1",
    nome: "Primeira temporada",
    descricao: "Concluir uma temporada",
    emoji: "🏆",
    categoria: "temporada",
    alvo: 1,
    valor: (c) => c.temporadasConcluidas,
  },
  {
    codigo: "temporada_5",
    nome: "Veterano",
    descricao: "Concluir 5 temporadas",
    emoji: "🎖️",
    categoria: "temporada",
    alvo: 5,
    valor: (c) => c.temporadasConcluidas,
  },
  {
    codigo: "temporada_10",
    nome: "Campeão",
    descricao: "Concluir 10 temporadas",
    emoji: "🥇",
    categoria: "temporada",
    alvo: 10,
    valor: (c) => c.temporadasConcluidas,
  },

  {
    codigo: "nivel_5",
    nome: "Nível 5",
    descricao: "Alcançar o nível 5",
    emoji: "⭐",
    categoria: "nivel",
    alvo: 5,
    valor: (c) => c.nivel,
  },
  {
    codigo: "nivel_10",
    nome: "Nível 10",
    descricao: "Alcançar o nível 10",
    emoji: "🌞",
    categoria: "nivel",
    alvo: 10,
    valor: (c) => c.nivel,
  },
  {
    codigo: "nivel_20",
    nome: "Nível 20",
    descricao: "Alcançar o nível 20",
    emoji: "🪐",
    categoria: "nivel",
    alvo: 20,
    valor: (c) => c.nivel,
  },
];

export interface AchievementState {
  def: AchievementDef;
  desbloqueada: boolean;
  atual: number;
  /** 0–1 */
  progresso: number;
}

export function evaluateAchievements(c: AchievementContext): AchievementState[] {
  return ACHIEVEMENTS.map((def) => {
    const atual = def.valor(c);
    return { def, desbloqueada: atual >= def.alvo, atual, progresso: Math.min(1, atual / def.alvo) };
  });
}

/** Maior recorde "dias sem" entre os hábitos a evitar. */
export function bestAvoidRecord(habits: Habit[], logs: HabitLog[], today: DateStr): number {
  let melhor = 0;
  for (const h of habits) {
    if (h.tipo !== "mau") continue;
    melhor = Math.max(
      melhor,
      badHabitStats(
        h,
        logs.filter((l) => l.habitId === h.id),
        today,
      ).recorde,
    );
  }
  return melhor;
}

/** Marcos de sequência celebrados em tela cheia. */
export const MARCOS_SEQUENCIA = [7, 14, 30, 60, 90, 180, 365];

/** Marco alcançado ao passar de `antes` para `agora` (o maior, se pular vários). */
export function crossedMilestone(antes: number, agora: number, marcos = MARCOS_SEQUENCIA): number | null {
  const cruzados = marcos.filter((m) => antes < m && agora >= m);
  return cruzados.length ? cruzados[cruzados.length - 1] : null;
}

/**
 * Medalhas recém-desbloqueadas: estão desbloqueadas agora e ainda não foram registradas.
 * Na primeira sincronização (nada registrado ainda) não há "novas": tudo entra em silêncio,
 * para não celebrar o histórico importado/antigo de uma vez.
 */
export function newlyUnlocked(
  estados: AchievementState[],
  registradas: { codigo: string }[],
  primeiraVez: boolean,
): { novas: AchievementState[]; registrar: string[] } {
  const ja = new Set(registradas.map((r) => r.codigo));
  const registrar = estados.filter((e) => e.desbloqueada && !ja.has(e.def.codigo)).map((e) => e.def.codigo);
  const novas = primeiraVez ? [] : estados.filter((e) => registrar.includes(e.def.codigo));
  return { novas, registrar };
}
