import { describe, expect, it } from "vitest";
import { computeHistory } from "./stats";
import { habit, log } from "./test-helpers";

describe("histórico", () => {
  it("soma XP, calcula sequência e nível a partir dos registros", () => {
    const h = habit({ dificuldade: "dificil", inicio: "2026-03-01" });
    const logs = ["2026-03-01", "2026-03-02", "2026-03-03"].map((d) => log(h.id, d));
    const r = computeHistory({
      habits: [h],
      tasks: [],
      logs,
      restDays: [],
      limiteSequencia: 0.6,
      start: "2026-03-01",
      today: "2026-03-04",
    });
    // 3 dias perfeitos: (30 + 50) * 3
    expect(r.xpTotal).toBe(240);
    expect(r.level.nivel).toBe(2);
    expect(r.diasPerfeitos).toBe(3);
    expect(r.streak).toEqual({ atual: 3, melhor: 3 });
    expect(r.summaries.size).toBe(4);
  });
});
