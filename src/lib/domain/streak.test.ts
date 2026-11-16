import { describe, expect, it } from "vitest";
import { canUseRestDay, computeStreak, validRestDays } from "./streak";
import type { DaySummary } from "./types";

function day(data: string, conta: boolean, temItens = true): DaySummary {
  return {
    data,
    temItens,
    totalItens: temItens ? 1 : 0,
    concluidos: conta ? 1 : 0,
    execucao: conta ? 1 : 0,
    pontuacao: conta ? 100 : 0,
    xpGanho: 0,
    diaPerfeito: conta,
    contaSequencia: conta,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
  };
}

function map(...days: DaySummary[]) {
  return new Map(days.map((d) => [d.data, d]));
}

describe("sequência", () => {
  it("conta dias seguidos e guarda a melhor", () => {
    const s = map(
      day("2026-03-01", true),
      day("2026-03-02", true),
      day("2026-03-03", true),
      day("2026-03-04", false),
      day("2026-03-05", true),
      day("2026-03-06", true),
    );
    expect(computeStreak(s, [], "2026-03-01", "2026-03-06")).toEqual({ atual: 2, melhor: 3 });
  });

  it("hoje ainda não concluído não quebra a sequência", () => {
    const s = map(day("2026-03-01", true), day("2026-03-02", true), day("2026-03-03", false));
    expect(computeStreak(s, [], "2026-03-01", "2026-03-03").atual).toBe(2);
  });

  it("dias sem itens previstos são neutros", () => {
    const s = map(day("2026-03-01", true), day("2026-03-02", false, false), day("2026-03-03", true));
    expect(computeStreak(s, [], "2026-03-01", "2026-03-03").atual).toBe(2);
  });

  it("dia de descanso não quebra, mas só 1 por semana vale", () => {
    // semana de 02/03 (seg) a 08/03 (dom)
    const umaFalha = map(day("2026-03-02", true), day("2026-03-03", false), day("2026-03-04", true));
    expect(computeStreak(umaFalha, ["2026-03-03"], "2026-03-02", "2026-03-04").atual).toBe(2);
    expect(computeStreak(umaFalha, [], "2026-03-02", "2026-03-04").atual).toBe(1);

    // o segundo descanso na mesma semana é ignorado → quebra em 05/03
    const duasFalhas = map(
      day("2026-03-02", true),
      day("2026-03-03", false),
      day("2026-03-04", true),
      day("2026-03-05", false),
      day("2026-03-06", true),
    );
    expect(computeStreak(duasFalhas, ["2026-03-03", "2026-03-05"], "2026-03-02", "2026-03-06").atual).toBe(1);
  });

  it("valida descanso semanal", () => {
    expect([...validRestDays(["2026-03-05", "2026-03-03", "2026-03-10"])]).toEqual([
      "2026-03-03",
      "2026-03-10",
    ]);
    expect(canUseRestDay(["2026-03-03"], "2026-03-05")).toBe(false);
    expect(canUseRestDay(["2026-03-03"], "2026-03-03")).toBe(true);
    expect(canUseRestDay(["2026-03-03"], "2026-03-09")).toBe(true);
  });
});
