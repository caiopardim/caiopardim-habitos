import { describe, expect, it } from "vitest";
import { CHANGELOG } from "./changelog";

describe("changelog", () => {
  it("ids únicos, datas válidas, mais recente primeiro", () => {
    expect(new Set(CHANGELOG.map((n) => n.id)).size).toBe(CHANGELOG.length);
    for (const n of CHANGELOG) {
      expect(n.data).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(n.itens.length).toBeGreaterThan(0);
    }
    const datas = CHANGELOG.map((n) => n.data);
    expect([...datas].sort().reverse()).toEqual(datas);
  });
  it("sem cobrança ligada, a novidade de planos não aparece", () => {
    expect(CHANGELOG.some((n) => n.requer === "billing")).toBe(false);
  });
});
