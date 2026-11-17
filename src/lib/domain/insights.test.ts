import { describe, expect, it } from "vitest";
import { eachDay, weekday } from "./dates";
import { buildInsights, isReviewDay, reducedGoal, reviewRef, weeklyReview } from "./insights";
import { computeHistory } from "./stats";
import { habit, log } from "./test-helpers";
import type { HabitLog } from "./types";

const FROM = "2026-01-05"; // segunda
const TO = "2026-03-01"; // domingo (8 semanas)
const dias = eachDay(FROM, TO);

function hist(habits: ReturnType<typeof habit>[], logs: HabitLog[]) {
  return computeHistory({
    habits,
    tasks: [],
    logs,
    restDays: [],
    limiteSequencia: 0.6,
    start: FROM,
    today: TO,
  }).summaries;
}

describe("insights", () => {
  it("compara dias da semana de um hábito", () => {
    // seg, qua e sex: faz toda segunda, metade das quartas e 2 de 8 sextas
    const treinar = habit({ id: "t", nome: "Treinar", inicio: FROM, diasSemana: [1, 3, 5] });
    let quartas = 0;
    const logs = dias
      .filter((d) => {
        const wd = weekday(d);
        if (wd === 1) return true;
        if (wd === 3) return quartas++ % 2 === 0;
        if (wd === 5) return d === "2026-01-09" || d === "2026-01-30";
        return false;
      })
      .map((d) => log("t", d));
    const r = buildInsights({
      habits: [treinar],
      logs,
      summaries: hist([treinar], logs),
      from: FROM,
      to: TO,
      fuso: "UTC",
    });
    expect(r.map((i) => i.texto)).toContain("Você faz Treinar 300% mais às segundas do que às sextas.");
  });

  it("efeito de um hábito nas outras missões, com horário", () => {
    const meditar = habit({ id: "m", nome: "Meditar / Orar", inicio: FROM });
    const outros = ["a", "b", "c"].map((id) => habit({ id, nome: id, inicio: FROM }));
    const logs: HabitLog[] = [];
    dias.forEach((d, i) => {
      const medita = i % 2 === 0;
      if (medita) {
        logs.push(log("m", d, { concluidoEm: `${d}T06:30:00Z` }));
        for (const o of outros) logs.push(log(o.id, d));
      } else {
        logs.push(log("a", d));
      }
    });
    const todos = [meditar, ...outros];
    const r = buildInsights({
      habits: todos,
      logs,
      summaries: hist(todos, logs),
      from: FROM,
      to: TO,
      fuso: "UTC",
    });
    const t = r.find((i) => i.id === "efeito-m")?.texto;
    expect(t).toMatch(
      /^Nos dias em que você faz Meditar \/ Orar \(geralmente antes das 9h\), cumpre \d+ pontos/,
    );
  });

  it("hábito a evitar mais aos fins de semana", () => {
    const redes = habit({ id: "r", nome: "Redes sociais em excesso", tipo: "mau", inicio: FROM });
    const logs = dias.map((d) =>
      log("r", d, {
        status:
          weekday(d) === 0 || weekday(d) === 6 ? "aconteceu" : weekday(d) === 3 ? "aconteceu" : "evitei",
      }),
    );
    const r = buildInsights({
      habits: [redes],
      logs,
      summaries: hist([redes], logs),
      from: FROM,
      to: TO,
      fuso: "UTC",
    });
    expect(r.map((i) => i.texto)).toContain(
      "Redes sociais em excesso acontece mais nos fins de semana (100% dos dias, contra 20% nos dias úteis).",
    );
  });

  it("tendência e silêncio quando não há dados suficientes", () => {
    const r = buildInsights({
      habits: [],
      logs: [],
      summaries: new Map(),
      from: FROM,
      to: TO,
      fuso: "UTC",
      mediaAtual: 66,
      mediaAnterior: 60,
    });
    expect(r.map((i) => i.texto)).toEqual([
      "Sua pontuação média subiu 10% em relação ao período anterior. Continue assim!",
    ]);
    expect(
      buildInsights({ habits: [], logs: [], summaries: new Map(), from: FROM, to: TO, fuso: "UTC" }),
    ).toEqual([]);
  });
});

describe("revisão semanal", () => {
  it("resume a semana e sugere reduzir a meta do hábito que mais faltou", () => {
    const agua = habit({
      id: "a",
      nome: "Beber água",
      metaTipo: "quantidade",
      metaValor: 3000,
      unidade: "ml",
      inicio: FROM,
    });
    const ler = habit({ id: "l", nome: "Ler", inicio: FROM });
    const semana = eachDay("2026-02-23", "2026-03-01");
    const logs = [
      ...semana.map((d) => log("l", d)),
      log("a", "2026-02-23", { valor: 3000 }),
      log("a", "2026-02-24", { status: "parcial", valor: 1000 }),
    ];
    const r = weeklyReview({ habits: [agua, ler], logs, summaries: hist([agua, ler], logs), ref: TO });
    expect(r.inicio).toBe("2026-02-23");
    expect(r.melhor?.habit.nome).toBe("Ler");
    expect(r.pior?.habit.nome).toBe("Beber água");
    expect(r.ajuste).toMatchObject({ tipo: "reduzir_meta", novaMeta: 2100 });
    expect(r.media).not.toBeNull();
  });

  it("hábito de check todo dia: sugere menos dias", () => {
    const t = habit({ id: "t", nome: "Treinar", inicio: FROM });
    const r = weeklyReview({ habits: [t], logs: [log("t", "2026-02-23")], summaries: new Map(), ref: TO });
    expect(r.ajuste).toMatchObject({ tipo: "menos_dias", diasSemana: [1, 3, 5] });
  });

  it("meta reduzida e dia de revisão", () => {
    expect(reducedGoal(3000)).toBe(2100);
    expect(reducedGoal(20)).toBe(14);
    expect(reducedGoal(1)).toBe(0.7);
    expect(isReviewDay("2026-03-01")).toBe(true);
    expect(isReviewDay("2026-03-02")).toBe(false);
    expect(reviewRef("2026-03-01")).toBe("2026-03-01"); // domingo: semana atual
    expect(reviewRef("2026-03-03")).toBe("2026-03-01"); // terça: semana passada completa
  });
});
