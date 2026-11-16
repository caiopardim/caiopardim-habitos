import { describe, expect, it } from "vitest";
import { levelFromXp, xpParaProximoNivel } from "./xp";

describe("níveis", () => {
  it("curva 100 * nivel^1.5 arredondada", () => {
    expect(xpParaProximoNivel(1)).toBe(100);
    expect(xpParaProximoNivel(2)).toBe(283);
    expect(xpParaProximoNivel(3)).toBe(520);
  });

  it("calcula nível e progresso a partir do XP total", () => {
    expect(levelFromXp(0)).toMatchObject({ nivel: 1, xpNoNivel: 0, xpDoNivel: 100 });
    expect(levelFromXp(99).nivel).toBe(1);
    expect(levelFromXp(100)).toMatchObject({ nivel: 2, xpNoNivel: 0, xpDoNivel: 283 });
    expect(levelFromXp(383)).toMatchObject({ nivel: 3, xpNoNivel: 0 });
    expect(levelFromXp(500).progresso).toBeCloseTo(117 / 520);
    expect(levelFromXp(-10).nivel).toBe(1);
  });
});
