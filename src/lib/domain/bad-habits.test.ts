import { describe, expect, it } from "vitest";
import { badHabitStats, successRate } from "./bad-habits";
import { habit, log } from "./test-helpers";

describe("maus hábitos", () => {
  const h = habit({ tipo: "mau", inicio: "2026-03-01" });

  it("conta dias desde o início quando nunca aconteceu", () => {
    expect(badHabitStats(h, [], "2026-03-08")).toEqual({
      diasLimpo: 7,
      recorde: 7,
      proximoMarco: 14,
      ultimoMarco: 7,
    });
  });

  it("zera na ocorrência e guarda o recorde", () => {
    const logs = [
      log(h.id, "2026-03-11", { status: "aconteceu" }),
      log(h.id, "2026-03-12", { status: "evitei" }),
    ];
    const s = badHabitStats(h, logs, "2026-03-13");
    expect(s.diasLimpo).toBe(2);
    expect(s.recorde).toBe(10);
    expect(s.proximoMarco).toBe(3);
  });

  it("ocorrência hoje = 0 dias", () => {
    const s = badHabitStats(h, [log(h.id, "2026-03-05", { status: "aconteceu" })], "2026-03-05");
    expect(s.diasLimpo).toBe(0);
    expect(s.ultimoMarco).toBeNull();
    expect(s.proximoMarco).toBe(1);
  });

  it("taxa de sucesso = evitei / registrados no período", () => {
    const logs = [
      log(h.id, "2026-03-01", { status: "evitei" }),
      log(h.id, "2026-03-02", { status: "evitei" }),
      log(h.id, "2026-03-03", { status: "aconteceu" }),
      log(h.id, "2026-03-04", { status: "evitei" }),
      log(h.id, "2026-04-01", { status: "aconteceu" }),
    ];
    expect(successRate(logs, "2026-03-01", "2026-03-31")).toBe(0.75);
    expect(successRate([], "2026-03-01", "2026-03-31")).toBeNull();
  });
});
