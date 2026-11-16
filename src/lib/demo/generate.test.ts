import { describe, expect, it } from "vitest";
import { computeHistory } from "../domain/stats";
import { generateDemoData } from "./generate";

describe("dados de exemplo", () => {
  let n = 0;
  const data = generateDemoData({ userId: "u1", today: "2026-03-31", newId: () => `id${++n}` });

  it("gera 60 dias de histórico e deixa hoje em aberto", () => {
    const datas = new Set(data.logs.map((l) => l.data));
    expect(datas.size).toBeGreaterThan(50);
    expect([...datas].sort()[0]).toBe("2026-01-31");
    expect(datas.has("2026-03-31")).toBe(false);
  });

  it("registros referenciam hábitos existentes e são únicos por dia", () => {
    const ids = new Set(data.habits.map((h) => h.id));
    expect(data.logs.every((l) => ids.has(l.habitId))).toBe(true);
    const keys = data.logs.map((l) => `${l.habitId}|${l.data}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("produz um histórico coerente", () => {
    const h = computeHistory({ ...data, limiteSequencia: 0.6, start: "2026-01-31", today: "2026-03-31" });
    expect(h.xpTotal).toBeGreaterThan(0);
    expect(h.summaries.size).toBe(60);
    expect(h.streak.melhor).toBeGreaterThan(0);
  });
});
