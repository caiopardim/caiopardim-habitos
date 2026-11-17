import { describe, expect, it } from "vitest";
import { dayStatusMessage } from "./day-status";
import type { DaySummary } from "./types";

function s(over: Partial<DaySummary>): DaySummary {
  return {
    data: "2026-03-10",
    temItens: true,
    totalItens: 10,
    concluidos: 7,
    execucao: 0.7,
    pontuacao: 70,
    xpGanho: 0,
    diaPerfeito: false,
    contaSequencia: true,
    maus: { previstos: 3, evitados: 0, aconteceram: 0 },
    ...over,
  };
}

describe("status do dia", () => {
  it("não diz 'tudo feito' com 70% só porque as missões acabaram", () => {
    expect(dayStatusMessage({ summary: s({}), missoesPendentes: 0, mausSemRegistro: 3 })).toBe(
      "Missões concluídas · falta registrar 3 hábitos a evitar",
    );
    expect(dayStatusMessage({ summary: s({}), missoesPendentes: 0, mausSemRegistro: 1 })).toBe(
      "Missões concluídas · falta registrar 1 hábito a evitar",
    );
  });

  it("mostra pendências enquanto houver missões", () => {
    expect(dayStatusMessage({ summary: s({}), missoesPendentes: 2, mausSemRegistro: 3 })).toBe("2 pendentes");
    expect(dayStatusMessage({ summary: s({}), missoesPendentes: 1, mausSemRegistro: 0 })).toBe("1 pendente");
  });

  it("missões feitas e maus hábitos registrados, mas algum aconteceu", () => {
    const sum = s({ execucao: 0.9, maus: { previstos: 3, evitados: 2, aconteceram: 1 } });
    expect(dayStatusMessage({ summary: sum, missoesPendentes: 0, mausSemRegistro: 0 })).toBe(
      "Missões concluídas",
    );
  });

  it("dia completo só com 100% e perfeito sem ocorrências", () => {
    expect(dayStatusMessage({ summary: s({ execucao: 1 }), missoesPendentes: 0, mausSemRegistro: 0 })).toBe(
      "Dia completo 🎉",
    );
    expect(
      dayStatusMessage({
        summary: s({ execucao: 1, diaPerfeito: true }),
        missoesPendentes: 0,
        mausSemRegistro: 0,
      }),
    ).toBe("Dia perfeito ✨");
  });

  it("dia sem itens não mostra mensagem", () => {
    expect(
      dayStatusMessage({ summary: s({ temItens: false }), missoesPendentes: 0, mausSemRegistro: 0 }),
    ).toBeNull();
    expect(dayStatusMessage({ summary: null, missoesPendentes: 0, mausSemRegistro: 0 })).toBeNull();
  });
});
