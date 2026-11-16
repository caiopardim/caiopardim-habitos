import { describe, expect, it } from "vitest";
import { clampValue, suggestedStep } from "./quantity";

describe("metas numéricas", () => {
  it("sugere passo de ~10% da meta", () => {
    expect(suggestedStep(3000)).toBe(300);
    expect(suggestedStep(20)).toBe(2);
    expect(suggestedStep(5)).toBe(0.5);
    expect(suggestedStep(4)).toBe(0.4);
    expect(suggestedStep(0)).toBe(1);
  });

  it("limita valores inválidos", () => {
    expect(clampValue(-5)).toBe(0);
    expect(clampValue(Number.NaN)).toBe(0);
    expect(clampValue(1.239)).toBe(1.24);
  });
});
