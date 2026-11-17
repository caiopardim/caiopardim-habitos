import type { DaySummary } from "./types";

export interface DayStatusInput {
  summary: DaySummary | null;
  /** Bons hábitos e tarefas do dia ainda não concluídos. */
  missoesPendentes: number;
  /** Hábitos a evitar previstos no dia e ainda sem registro (Evitei/Aconteceu). */
  mausSemRegistro: number;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Resumo curto do estado do dia, para o cabeçalho das missões.
 * "Dia completo" só com 100% de execução; "Dia perfeito" se, além disso, nenhum mau hábito ocorreu.
 */
export function dayStatusMessage({
  summary,
  missoesPendentes,
  mausSemRegistro,
}: DayStatusInput): string | null {
  if (!summary?.temItens) return null;
  if (summary.diaPerfeito) return "Dia perfeito ✨";
  if (summary.execucao >= 1) return "Dia completo 🎉";
  if (missoesPendentes > 0) return plural(missoesPendentes, "pendente", "pendentes");
  if (mausSemRegistro > 0) {
    return `Missões concluídas · falta registrar ${plural(mausSemRegistro, "hábito a evitar", "hábitos a evitar")}`;
  }
  return "Missões concluídas";
}

export type DayLevel = "vazio" | "baixo" | "bom" | "perfeito" | "descanso";

/** Classificação do dia para a faixa de datas (mini-anéis). */
export function dayLevel(summary: DaySummary | null, descanso: boolean): DayLevel {
  if (descanso && !summary?.contaSequencia) return "descanso";
  if (!summary?.temItens || summary.concluidos === 0) return "vazio";
  if (summary.diaPerfeito) return "perfeito";
  if (summary.contaSequencia) return "bom";
  return "baixo";
}
