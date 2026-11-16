import { describe, expect, it } from "vitest";
import { AVATAR_STAGES, avatarState, energyForScore, stageForLevel } from "./avatar";
import type { DaySummary } from "./types";

function day(data: string, pontuacao: number, temItens = true): DaySummary {
  return {
    data,
    temItens,
    totalItens: temItens ? 1 : 0,
    concluidos: 0,
    execucao: pontuacao / 100,
    pontuacao,
    xpGanho: 0,
    diaPerfeito: false,
    contaSequencia: false,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
  };
}

describe("avatar", () => {
  it("estágio cresce com o nível e nunca passa do último", () => {
    expect(stageForLevel(1)).toBe(0);
    expect(stageForLevel(2)).toBe(0);
    expect(stageForLevel(3)).toBe(1);
    expect(stageForLevel(8)).toBe(3);
    expect(stageForLevel(23)).toBe(6);
    expect(stageForLevel(99)).toBe(AVATAR_STAGES.length - 1);
  });

  it("disposição segue a média recente", () => {
    expect(energyForScore(null)).toBe("normal");
    expect(energyForScore(20)).toBe("cansado");
    expect(energyForScore(60)).toBe("normal");
    expect(energyForScore(80)).toBe("energizado");
  });

  it("usa os 7 dias anteriores a hoje e ignora dias sem itens", () => {
    const m = new Map([
      ["2026-03-10", day("2026-03-10", 0)], // hoje: ignorado
      ["2026-03-09", day("2026-03-09", 90)],
      ["2026-03-08", day("2026-03-08", 70)],
      ["2026-03-07", day("2026-03-07", 0, false)],
      ["2026-03-01", day("2026-03-01", 0)], // fora da janela
    ]);
    const s = avatarState(4, 0.5, m, "2026-03-10");
    expect(s.mediaRecente).toBe(80);
    expect(s.energia).toBe("energizado");
  });

  it("calcula o progresso até o próximo estágio", () => {
    // Aprendiz (nível 3) → Determinado (nível 5): no nível 4 com metade = 1,5 / 2
    const s = avatarState(4, 0.5, new Map(), "2026-03-10");
    expect(s.stage.nome).toBe("Aprendiz");
    expect(s.proximo?.nome).toBe("Determinado");
    expect(s.progressoProximo).toBeCloseTo(0.75);
    expect(avatarState(30, 0, new Map(), "2026-03-10").proximo).toBeNull();
  });
});
