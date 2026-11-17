import { describe, expect, it } from "vitest";
import { addDays } from "./dates";
import { computeSeasons, seasonGoal } from "./seasons";
import type { DaySummary } from "./types";

function day(data: string, pontuacao: number, temItens = true): DaySummary {
  return {
    data,
    temItens,
    totalItens: 1,
    concluidos: 0,
    execucao: pontuacao / 100,
    pontuacao,
    xpGanho: 0,
    diaPerfeito: false,
    contaSequencia: false,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
  };
}

/** Preenche `n` dias a partir de `start` com as pontuações dadas (repete a última). */
function fill(start: string, scores: number[], n: number) {
  const m = new Map<string, DaySummary>();
  for (let i = 0; i < n; i++) {
    const d = addDays(start, i);
    m.set(d, day(d, scores[Math.min(i, scores.length - 1)]));
  }
  return m;
}

const S = "2026-03-02";

describe("temporadas", () => {
  it("meta começa em 50, sobe 3 por temporada, teto 90", () => {
    expect(seasonGoal(1)).toBe(50);
    expect(seasonGoal(2)).toBe(53);
    expect(seasonGoal(14)).toBe(89);
    expect(seasonGoal(15)).toBe(90);
    expect(seasonGoal(40)).toBe(90);
  });

  it("primeiro dia: temporada 1, dia 1, em andamento", () => {
    const r = computeSeasons(new Map(), [], S, S);
    expect(r.atual).toMatchObject({ numero: 1, dia: 1, meta: 50, status: "em_andamento", fim: "2026-03-08" });
    expect(r.historico).toEqual([]);
  });

  it("avança ao atingir a meta e repete ao não atingir, sem perder as anteriores", () => {
    // semana 1: média 60 (≥50) → avança; semana 2: média 40 (<53) → repete a 2; semana 3: 70 → avança para 3
    const scores = [...Array(7).fill(60), ...Array(7).fill(40), ...Array(7).fill(70)];
    const m = fill(S, scores, 21);
    const r = computeSeasons(m, [], S, addDays(S, 21));
    expect(r.historico.map((h) => [h.numero, h.status])).toEqual([
      [1, "concluida"],
      [2, "nao_atingida"],
      [2, "concluida"],
    ]);
    expect(r.atual.numero).toBe(3);
    expect(r.atual.meta).toBe(56);
    expect(r.recorde).toBe(3);
    expect(r.concluidas).toBe(2);
  });

  it("status parcial usa só os dias antes de hoje", () => {
    const m = fill(S, [80, 80, 80, 0], 4); // hoje (dia 4) com 0 não derruba
    expect(computeSeasons(m, [], S, addDays(S, 3)).atual).toMatchObject({
      dia: 4,
      diasContados: 3,
      status: "no_caminho",
      media: 80,
    });
    const ruim = fill(S, [20, 30], 3);
    expect(computeSeasons(ruim, [], S, addDays(S, 2)).atual.status).toBe("em_risco");
  });

  it("dias sem itens e dia de descanso não entram na média", () => {
    const m = fill(S, [60], 7);
    m.set(addDays(S, 1), day(addDays(S, 1), 0, false));
    m.set(addDays(S, 2), day(addDays(S, 2), 0)); // dia ruim, mas protegido pelo descanso
    const r = computeSeasons(m, [addDays(S, 2)], S, addDays(S, 7));
    expect(r.historico[0]).toMatchObject({ media: 60, status: "concluida" });
  });

  it("semana sem nenhum dia válido não conclui", () => {
    const r = computeSeasons(new Map(), [], S, addDays(S, 7));
    expect(r.historico[0]).toMatchObject({ media: null, status: "nao_atingida" });
    expect(r.atual.numero).toBe(1);
  });
});
