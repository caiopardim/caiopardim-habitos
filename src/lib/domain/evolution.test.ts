import { describe, expect, it } from "vitest";
import {
  avoidStats,
  bucketize,
  daysWithRecords,
  habitStats,
  heatLevel,
  periodRange,
  periodSummary,
  previousPeriod,
  scoreSeries,
  yearHeatmap,
} from "./evolution";
import { addDays, eachDay } from "./dates";
import { habit, log, task } from "./test-helpers";
import type { DaySummary } from "./types";

function day(data: string, pontuacao: number, over: Partial<DaySummary> = {}): DaySummary {
  return {
    data,
    temItens: true,
    totalItens: 2,
    concluidos: pontuacao > 0 ? 1 : 0,
    execucao: pontuacao / 100,
    pontuacao,
    xpGanho: 10,
    diaPerfeito: false,
    contaSequencia: pontuacao >= 60,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
    ...over,
  };
}

const T = "2026-03-15"; // domingo

describe("períodos", () => {
  it("calcula os presets terminando hoje", () => {
    expect(periodRange("hoje", T)).toEqual({ from: T, to: T, dias: 1 });
    expect(periodRange("ontem", T)).toEqual({ from: "2026-03-14", to: "2026-03-14", dias: 1 });
    expect(periodRange("7d", T)).toEqual({ from: "2026-03-09", to: T, dias: 7 });
    expect(periodRange("3m", T).dias).toBe(90);
    expect(periodRange("1a", T).dias).toBe(365);
  });

  it("personalizado: corta o futuro e aceita datas invertidas", () => {
    expect(periodRange("custom", T, { from: "2026-03-01", to: "2026-04-01" })).toEqual({
      from: "2026-03-01",
      to: T,
      dias: 15,
    });
    expect(periodRange("custom", T, { from: "2026-03-10", to: "2026-03-05" }).from).toBe("2026-03-05");
  });

  it("período anterior tem o mesmo tamanho", () => {
    expect(previousPeriod(periodRange("7d", T))).toEqual({ from: "2026-03-02", to: "2026-03-08", dias: 7 });
  });
});

describe("resumo do período", () => {
  it("média ignora dias sem itens; soma XP, dias perfeitos e missões", () => {
    const m = new Map([
      ["2026-03-14", day("2026-03-14", 80, { diaPerfeito: true })],
      ["2026-03-15", day("2026-03-15", 40)],
      ["2026-03-13", day("2026-03-13", 0, { temItens: false })],
    ]);
    const bom = habit({ id: "b" });
    const r = periodSummary({
      summaries: m,
      habits: [bom],
      logs: [log("b", "2026-03-14"), log("b", "2026-03-15", { status: "parcial", valor: 1 })],
      tasks: [task({ data: "2026-03-15", concluida: true }), task({ data: "2026-03-01", concluida: true })],
      period: periodRange("7d", T),
    });
    expect(r).toEqual({
      mediaPontuacao: 60,
      diasRegistrados: 2,
      missoesConcluidas: 2,
      xpGanho: 30,
      diasPerfeitos: 1,
    });
    expect(scoreSeries(m, periodRange("7d", T)).find((p) => p.data === "2026-03-13")?.pontuacao).toBeNull();
  });

  it("hoje em andamento fica fora da linha e da média (exceto no filtro de um dia)", () => {
    const m = new Map([
      ["2026-03-14", day("2026-03-14", 80)],
      ["2026-03-15", day("2026-03-15", 10)],
    ]);
    const semana = periodRange("7d", T);
    expect(scoreSeries(m, semana, T).at(-1)?.pontuacao).toBeNull();
    const r = periodSummary({
      summaries: m,
      habits: [],
      logs: [],
      tasks: [],
      period: semana,
      emAndamento: T,
    });
    expect(r.mediaPontuacao).toBe(80);
    expect(scoreSeries(m, periodRange("hoje", T), T)[0].pontuacao).toBe(10);
  });
});

describe("por hábito", () => {
  it("volume, média diária, taxa e melhor sequência (dias não previstos não quebram)", () => {
    const agua = habit({
      id: "a",
      metaTipo: "quantidade",
      metaValor: 2000,
      diasSemana: [1, 2, 3, 4, 5], // seg–sex
      inicio: "2026-01-01",
    });
    // 09 (seg) a 15 (dom)
    const logs = [
      log("a", "2026-03-09", { valor: 2000 }),
      log("a", "2026-03-10", { valor: 2500 }),
      log("a", "2026-03-11", { status: "parcial", valor: 1000 }),
      log("a", "2026-03-12", { valor: 2000 }),
      log("a", "2026-03-13", { valor: 2000 }),
    ];
    const r = habitStats(agua, logs, periodRange("7d", T));
    expect(r.previstos).toBe(5);
    expect(r.concluidos).toBe(4);
    expect(r.taxa).toBe(0.8);
    expect(r.total).toBe(9500);
    expect(r.mediaDiaria).toBe(1900);
    expect(r.melhorSequencia).toBe(2);
  });

  it("check conta dias feitos como volume", () => {
    const ler = habit({ id: "l", inicio: "2026-01-01" });
    const r = habitStats(ler, [log("l", "2026-03-14"), log("l", "2026-03-15")], periodRange("7d", T));
    expect(r.total).toBe(2);
    expect(r.melhorSequencia).toBe(2);
  });

  it("agrupa por semana acima de 31 dias", () => {
    const dias = eachDay("2026-01-05", "2026-02-15").map((d) => ({ data: d, valor: 1 }));
    const r = bucketize(dias);
    expect(r.porSemana).toBe(true);
    expect(r.buckets).toHaveLength(6);
    expect(r.buckets[0]).toEqual({ inicio: "2026-01-05", fim: "2026-01-11", valor: 7 });
    expect(bucketize(dias.slice(0, 7)).porSemana).toBe(false);
  });
});

describe("hábitos a evitar", () => {
  it("taxa de sucesso por hábito no período", () => {
    const m = habit({ id: "m", tipo: "mau" });
    const r = avoidStats(
      [m, habit({ id: "b" })],
      [
        log("m", "2026-03-14", { status: "evitei" }),
        log("m", "2026-03-15", { status: "aconteceu" }),
        log("m", "2026-03-01", { status: "aconteceu" }),
      ],
      periodRange("7d", T),
    );
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ evitados: 1, registrados: 2, taxa: 0.5 });
  });
});

describe("heatmap anual", () => {
  it("níveis por desempenho", () => {
    expect(heatLevel(undefined)).toBe(0);
    expect(heatLevel(day("x", 20))).toBe(1);
    expect(heatLevel(day("x", 50))).toBe(2);
    expect(heatLevel(day("x", 90))).toBe(3);
    expect(heatLevel(day("x", 100, { diaPerfeito: true }))).toBe(4);
  });

  it("53 semanas, sem futuro, com melhor e pior mês", () => {
    const m = new Map<string, DaySummary>();
    for (const d of eachDay("2026-01-01", "2026-01-31")) m.set(d, day(d, 40));
    for (const d of eachDay("2026-02-01", "2026-02-28")) m.set(d, day(d, 90));
    for (const d of eachDay("2026-03-01", "2026-03-03")) m.set(d, day(d, 100)); // poucos dias: fora do ranking
    const r = yearHeatmap(m, T);
    expect(r.semanas).toHaveLength(53);
    expect(r.semanas.at(-1)!.filter(Boolean)).toHaveLength(7); // hoje é domingo: semana completa
    expect(r.melhorMes).toMatchObject({ mes: "2026-02", media: 90 });
    expect(r.piorMes).toMatchObject({ mes: "2026-01", media: 40 });
    const futuro = yearHeatmap(m, "2026-03-11").semanas.at(-1)!;
    expect(futuro.filter((c) => c === null)).toHaveLength(4);
  });

  it("conta dias com registro", () => {
    expect(
      daysWithRecords(
        [log("a", "2026-03-01"), log("b", "2026-03-01")],
        [task({ data: addDays(T, 0), concluida: true })],
      ),
    ).toBe(2);
  });
});
