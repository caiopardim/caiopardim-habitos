import { averageScore } from "./day";
import { addDays } from "./dates";
import type { DateStr, DaySummary } from "./types";

export interface AvatarStage {
  /** Nível mínimo para alcançar o estágio. */
  nivelMin: number;
  nome: string;
  descricao: string;
}

/**
 * Estágios de evolução do avatar, liberados pelo nível (XP acumulado).
 * O estágio nunca regride: um dia ruim não apaga a evolução.
 */
export const AVATAR_STAGES: AvatarStage[] = [
  { nivelMin: 1, nome: "Iniciante", descricao: "Todo mundo começa em algum lugar." },
  { nivelMin: 3, nome: "Aprendiz", descricao: "Os primeiros hábitos já estão criando raízes." },
  { nivelMin: 5, nome: "Determinado", descricao: "Faixa na cabeça: agora é sério." },
  { nivelMin: 8, nome: "Forte", descricao: "A constância virou músculo." },
  { nivelMin: 12, nome: "Guerreiro", descricao: "Encara os dias difíceis sem desistir." },
  { nivelMin: 17, nome: "Mestre", descricao: "Disciplina vestida como capa." },
  { nivelMin: 23, nome: "Lenda", descricao: "Uma inspiração para quem está começando." },
];

export type Energia = "cansado" | "normal" | "energizado";

export interface AvatarState {
  /** Índice em AVATAR_STAGES (0–6). */
  estagio: number;
  stage: AvatarStage;
  proximo: AvatarStage | null;
  /** 0–1: quanto do caminho entre o estágio atual e o próximo já foi feito (por nível). */
  progressoProximo: number;
  energia: Energia;
  /** Média da Pontuação do Dia nos últimos 7 dias (sem contar hoje), ou null sem dados. */
  mediaRecente: number | null;
}

export function stageForLevel(nivel: number): number {
  let idx = 0;
  AVATAR_STAGES.forEach((s, i) => {
    if (nivel >= s.nivelMin) idx = i;
  });
  return idx;
}

export function energyForScore(media: number | null): Energia {
  if (media === null) return "normal";
  if (media < 40) return "cansado";
  if (media >= 75) return "energizado";
  return "normal";
}

/**
 * Estado do avatar a partir do nível e do histórico.
 * `nivelProgresso` = fração do nível atual já concluída (para a barra até o próximo estágio).
 */
export function avatarState(
  nivel: number,
  nivelProgresso: number,
  summaries: Map<DateStr, DaySummary>,
  today: DateStr,
): AvatarState {
  const estagio = stageForLevel(nivel);
  const stage = AVATAR_STAGES[estagio];
  const proximo = AVATAR_STAGES[estagio + 1] ?? null;

  let progressoProximo = 1;
  if (proximo) {
    const total = proximo.nivelMin - stage.nivelMin;
    progressoProximo = Math.min(1, Math.max(0, (nivel - stage.nivelMin + nivelProgresso) / total));
  }

  const recentes: DaySummary[] = [];
  for (let i = 1; i <= 7; i++) {
    const s = summaries.get(addDays(today, -i));
    if (s) recentes.push(s);
  }
  const mediaRecente = averageScore(recentes);

  return { estagio, stage, proximo, progressoProximo, energia: energyForScore(mediaRecente), mediaRecente };
}
