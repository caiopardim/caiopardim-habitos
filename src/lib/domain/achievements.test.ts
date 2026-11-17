import { describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  bestAvoidRecord,
  crossedMilestone,
  evaluateAchievements,
  newlyUnlocked,
  type AchievementContext,
} from "./achievements";
import { habit, log } from "./test-helpers";

const zero: AchievementContext = {
  melhorSequencia: 0,
  diasRegistrados: 0,
  diasPerfeitos: 0,
  recordeEvitar: 0,
  temporadasConcluidas: 0,
  nivel: 1,
  totalConcluidos: 0,
};

describe("medalhas", () => {
  it("catálogo com códigos únicos", () => {
    const c = ACHIEVEMENTS.map((a) => a.codigo);
    expect(new Set(c).size).toBe(c.length);
  });

  it("desbloqueia por alvo e calcula o progresso das bloqueadas", () => {
    const r = evaluateAchievements({ ...zero, melhorSequencia: 8, totalConcluidos: 3, diasRegistrados: 15 });
    const by = (c: string) => r.find((x) => x.def.codigo === c)!;
    expect(by("primeiro_passo").desbloqueada).toBe(true);
    expect(by("seq_7").desbloqueada).toBe(true);
    expect(by("seq_14")).toMatchObject({ desbloqueada: false, atual: 8 });
    expect(by("seq_14").progresso).toBeCloseTo(8 / 14);
    expect(by("dias_10").desbloqueada).toBe(true);
    expect(by("dias_30").progresso).toBe(0.5);
    expect(by("nivel_5").desbloqueada).toBe(false);
  });

  it("recém-desbloqueadas: primeira sincronização entra em silêncio", () => {
    const estados = evaluateAchievements({ ...zero, totalConcluidos: 1, melhorSequencia: 7 });
    const primeira = newlyUnlocked(estados, [], true);
    expect(primeira.novas).toEqual([]);
    expect(primeira.registrar.sort()).toEqual(["primeiro_passo", "seq_3", "seq_7"]);

    const depois = newlyUnlocked(
      evaluateAchievements({ ...zero, totalConcluidos: 1, melhorSequencia: 14 }),
      primeira.registrar.map((codigo) => ({ codigo })),
      false,
    );
    expect(depois.novas.map((n) => n.def.codigo)).toEqual(["seq_14"]);
  });

  it("recorde entre os hábitos a evitar", () => {
    const a = habit({ id: "a", tipo: "mau", inicio: "2026-03-01" });
    const b = habit({ id: "b", tipo: "mau", inicio: "2026-03-01" });
    const logs = [log("a", "2026-03-05", { status: "aconteceu" })];
    expect(bestAvoidRecord([a, b, habit({ id: "c" })], logs, "2026-03-20")).toBe(19);
  });
});

describe("marcos de sequência", () => {
  it("detecta o marco cruzado", () => {
    expect(crossedMilestone(6, 7)).toBe(7);
    expect(crossedMilestone(7, 8)).toBeNull();
    expect(crossedMilestone(29, 30)).toBe(30);
    expect(crossedMilestone(5, 15)).toBe(14);
    expect(crossedMilestone(10, 5)).toBeNull();
  });
});
