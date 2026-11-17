import type { DaySummary } from "./types";

/** "Bom amanhecer" (5h–11h), "Boa tarde" (12h–17h), "Boa noite" (18h–4h). */
export function greeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "Bom amanhecer";
  if (hour >= 12 && hour < 18) return "Boa tarde";
  return "Boa noite";
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Quantos itens ainda faltam para o dia atingir o limite da sequência. */
export function itemsToStreak(summary: DaySummary, limite: number): number {
  const falta = limite * summary.totalItens - summary.concluidos;
  return Math.max(0, Math.ceil(falta - 1e-9));
}

/**
 * Frase curta e acolhedora sobre o dia de hoje, abaixo da saudação.
 * Prioridade: dia perfeito → completo → falta pouco para a sequência → pendências → registrar maus hábitos.
 */
export function todayPhrase(input: {
  summary: DaySummary | null;
  missoesPendentes: number;
  mausSemRegistro: number;
  limiteSequencia: number;
  sequenciaAtual: number;
  hour: number;
}): string {
  const { summary, missoesPendentes, mausSemRegistro, limiteSequencia, sequenciaAtual, hour } = input;
  if (!summary?.temItens) return "Nada previsto hoje. Que tal criar uma missão?";
  if (summary.diaPerfeito) return "Dia perfeito. Aproveite: você merece ✨";
  if (summary.execucao >= 1) return "Dia completo! Mais um passo na sua evolução.";

  if (!summary.contaSequencia) {
    const faltam = itemsToStreak(summary, limiteSequencia);
    if (faltam > 0 && (sequenciaAtual > 0 || hour >= 18)) {
      return sequenciaAtual > 0
        ? `Mais ${plural(faltam, "item", "itens")} e sua sequência de ${plural(sequenciaAtual, "dia", "dias")} continua.`
        : `Mais ${plural(faltam, "item", "itens")} e o dia entra na sequência.`;
    }
  }
  if (missoesPendentes > 0) {
    return missoesPendentes === 1
      ? "Falta 1 missão para fechar o dia."
      : `Faltam ${missoesPendentes} missões para fechar o dia.`;
  }
  if (mausSemRegistro > 0) return "Só falta registrar os hábitos a evitar.";
  return "Missões concluídas. Bom trabalho!";
}
