import { describe, expect, it } from "vitest";
import { areaStats } from "./areas";
import { indexLogsByDate } from "./stats";
import { habit, log, task } from "./test-helpers";

describe("áreas da vida", () => {
  const agua = habit({ areaId: "saude", metaTipo: "quantidade", metaValor: 2000, inicio: "2026-03-01" });
  const ler = habit({ areaId: "mente", inicio: "2026-03-01" });
  const acucar = habit({ areaId: "saude", tipo: "mau", inicio: "2026-03-01" });

  it("agrega bons, maus e tarefas por área no período", () => {
    const logs = [
      log(agua.id, "2026-03-01", { status: "parcial", valor: 1000 }),
      log(agua.id, "2026-03-02", { valor: 2000 }),
      log(acucar.id, "2026-03-01", { status: "evitei" }),
      log(acucar.id, "2026-03-02", { status: "aconteceu" }),
      log(ler.id, "2026-03-02"),
    ];
    const r = areaStats({
      habits: [agua, ler, acucar],
      tasks: [
        task({ areaId: "mente", data: "2026-03-02", concluida: true }),
        task({ areaId: "mente", data: "2026-03-09" }),
      ],
      logsByDate: indexLogsByDate(logs),
      from: "2026-03-01",
      to: "2026-03-02",
    });
    // saúde: água 0,5 + 1 ; açúcar 1 + 0 → 2,5 / 4
    expect(r.get("saude")).toMatchObject({ previstos: 4, concluidos: 2.5, pct: 0.625 });
    // mente: ler 0 + 1 ; tarefa 1 → 2 / 3
    expect(r.get("mente")?.pct).toBeCloseTo(2 / 3);
  });

  it("área sem itens não aparece", () => {
    const r = areaStats({
      habits: [],
      tasks: [],
      logsByDate: new Map(),
      from: "2026-03-01",
      to: "2026-03-07",
    });
    expect(r.size).toBe(0);
  });
});
