import { describe, expect, it } from "vitest";
import { addDays, canEditDate, diffDays, eachDay, todayInTz, weekStart, weekday } from "./dates";

describe("datas", () => {
  it("usa o dia do fuso do usuário, não o UTC", () => {
    // 02:30 UTC de 11/03 ainda é 10/03 em São Paulo (UTC−3)
    const now = new Date("2026-03-11T02:30:00Z");
    expect(todayInTz("America/Sao_Paulo", now)).toBe("2026-03-10");
    expect(todayInTz("UTC", now)).toBe("2026-03-11");
    expect(todayInTz("Asia/Tokyo", now)).toBe("2026-03-11");
  });

  it("soma e subtrai dias atravessando meses e anos", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(diffDays("2025-12-30", "2026-01-02")).toBe(3);
  });

  it("calcula dia da semana e início da semana (segunda)", () => {
    expect(weekday("2026-03-15")).toBe(0); // domingo
    expect(weekStart("2026-03-15")).toBe("2026-03-09");
    expect(weekStart("2026-03-09")).toBe("2026-03-09");
    expect(weekStart("2026-03-11")).toBe("2026-03-09");
  });

  it("lista dias inclusive", () => {
    expect(eachDay("2026-03-01", "2026-03-03")).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
    expect(eachDay("2026-03-03", "2026-03-01")).toEqual([]);
  });

  it("permite editar até 7 dias atrás e nunca o futuro", () => {
    expect(canEditDate("2026-03-10", "2026-03-10")).toBe(true);
    expect(canEditDate("2026-03-03", "2026-03-10")).toBe(true);
    expect(canEditDate("2026-03-02", "2026-03-10")).toBe(false);
    expect(canEditDate("2026-03-11", "2026-03-10")).toBe(false);
  });
});
