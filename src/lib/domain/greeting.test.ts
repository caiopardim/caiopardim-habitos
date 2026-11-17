import { describe, expect, it } from "vitest";
import { greeting, itemsToStreak, todayPhrase } from "./greeting";
import type { DaySummary } from "./types";

function s(over: Partial<DaySummary>): DaySummary {
  return {
    data: "2026-03-10",
    temItens: true,
    totalItens: 10,
    concluidos: 4,
    execucao: 0.4,
    pontuacao: 40,
    xpGanho: 0,
    diaPerfeito: false,
    contaSequencia: false,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
    ...over,
  };
}

const base = { missoesPendentes: 6, mausSemRegistro: 0, limiteSequencia: 0.6, sequenciaAtual: 0, hour: 10 };

describe("saudação", () => {
  it("bom amanhecer, boa tarde, boa noite", () => {
    expect(greeting(4)).toBe("Boa noite");
    expect(greeting(5)).toBe("Bom amanhecer");
    expect(greeting(11)).toBe("Bom amanhecer");
    expect(greeting(12)).toBe("Boa tarde");
    expect(greeting(18)).toBe("Boa noite");
  });

  it("calcula quantos itens faltam para a sequência", () => {
    expect(itemsToStreak(s({}), 0.6)).toBe(2);
    expect(itemsToStreak(s({ concluidos: 5.5 }), 0.6)).toBe(1);
    expect(itemsToStreak(s({ concluidos: 6 }), 0.6)).toBe(0);
  });

  it("frase contextual por prioridade", () => {
    expect(todayPhrase({ ...base, summary: s({ diaPerfeito: true, execucao: 1 }) })).toMatch(/perfeito/);
    expect(todayPhrase({ ...base, summary: s({ execucao: 1 }) })).toMatch(/completo/);
    expect(todayPhrase({ ...base, sequenciaAtual: 5, summary: s({}) })).toBe(
      "Mais 2 itens e sua sequência de 5 dias continua.",
    );
    expect(todayPhrase({ ...base, hour: 20, summary: s({}) })).toBe(
      "Mais 2 itens e o dia entra na sequência.",
    );
    expect(todayPhrase({ ...base, summary: s({}) })).toBe("Faltam 6 missões para fechar o dia.");
    expect(todayPhrase({ ...base, missoesPendentes: 1, summary: s({ contaSequencia: true }) })).toBe(
      "Falta 1 missão para fechar o dia.",
    );
    expect(
      todayPhrase({ ...base, missoesPendentes: 0, mausSemRegistro: 2, summary: s({ contaSequencia: true }) }),
    ).toBe("Só falta registrar os hábitos a evitar.");
    expect(todayPhrase({ ...base, summary: null })).toMatch(/Nada previsto/);
  });
});
