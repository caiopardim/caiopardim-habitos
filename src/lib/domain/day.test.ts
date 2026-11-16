import { describe, expect, it } from "vitest";
import { computeDay, habitProgress, isHabitScheduled, percentChange, statusForValue } from "./day";
import { habit, log, logsMap, task } from "./test-helpers";

const D = "2026-03-10"; // terça
const base = { date: D, tasks: [], limiteSequencia: 0.6 };

describe("agenda", () => {
  it("respeita dias da semana, início e arquivamento", () => {
    expect(isHabitScheduled(habit(), D)).toBe(true);
    expect(isHabitScheduled(habit({ diasSemana: [1, 3] }), D)).toBe(false);
    expect(isHabitScheduled(habit({ diasSemana: [2] }), D)).toBe(true);
    expect(isHabitScheduled(habit({ inicio: "2026-03-11" }), D)).toBe(false);
    expect(isHabitScheduled(habit({ arquivado: true, arquivadoEm: "2026-03-10" }), D)).toBe(false);
    expect(isHabitScheduled(habit({ arquivado: true, arquivadoEm: "2026-03-11" }), D)).toBe(true);
    // mau hábito vale todos os dias, mesmo com dias_semana preenchido
    expect(isHabitScheduled(habit({ tipo: "mau", diasSemana: [1] }), D)).toBe(true);
  });
});

describe("progresso", () => {
  it("meta numérica parcial conta proporcionalmente, com teto 1", () => {
    const h = habit({ metaTipo: "quantidade", metaValor: 3000, unidade: "ml" });
    expect(habitProgress(h, log(h.id, D, { status: "parcial", valor: 1500 }))).toBe(0.5);
    expect(habitProgress(h, log(h.id, D, { valor: 4500 }))).toBe(1);
    expect(habitProgress(h, undefined)).toBe(0);
  });

  it("status segue o valor", () => {
    expect(statusForValue(3000, 3000)).toBe("feito");
    expect(statusForValue(10, 3000)).toBe("parcial");
    expect(statusForValue(0, 3000)).toBe("nao_feito");
  });
});

describe("execução e pontuação", () => {
  it("dia sem itens não conta", () => {
    const s = computeDay({ ...base, habits: [], logs: new Map() });
    expect(s).toMatchObject({ temItens: false, execucao: 0, pontuacao: 0, contaSequencia: false });
  });

  it("execução = concluídos / previstos, incluindo maus hábitos e tarefas", () => {
    const agua = habit({ metaTipo: "quantidade", metaValor: 3000 });
    const ler = habit();
    const alcool = habit({ tipo: "mau" });
    const t = task({ data: D, concluida: true });
    const s = computeDay({
      ...base,
      habits: [agua, ler, alcool],
      tasks: [t, task({ data: "2026-03-11" })],
      logs: logsMap(
        log(agua.id, D, { status: "parcial", valor: 1500 }),
        log(alcool.id, D, { status: "evitei" }),
      ),
    });
    // (0,5 + 0 + 1 + 1) / 4
    expect(s.totalItens).toBe(4);
    expect(s.execucao).toBe(0.625);
    expect(s.contaSequencia).toBe(true);
  });

  it("pontuação: 70% bons ponderados pela dificuldade + 30% maus", () => {
    const facil = habit({ dificuldade: "facil" });
    const dificil = habit({ dificuldade: "dificil" });
    const mau1 = habit({ tipo: "mau" });
    const mau2 = habit({ tipo: "mau" });
    const s = computeDay({
      ...base,
      habits: [facil, dificil, mau1, mau2],
      logs: logsMap(
        log(dificil.id, D),
        log(mau1.id, D, { status: "evitei" }),
        log(mau2.id, D, { status: "aconteceu" }),
      ),
    });
    // bons: 3/4 = 0,75 → 52,5 ; maus: 1/2 → 15 ⇒ 67,5 → 68
    expect(s.pontuacao).toBe(68);
  });

  it("sem maus hábitos, 100% vem da execução", () => {
    const a = habit({ dificuldade: "facil" });
    const b = habit({ dificuldade: "facil" });
    const s = computeDay({ ...base, habits: [a, b], logs: logsMap(log(a.id, D)) });
    expect(s.pontuacao).toBe(50);
  });

  it("só maus hábitos: 100% vem do sucesso neles", () => {
    const m = habit({ tipo: "mau" });
    const s = computeDay({ ...base, habits: [m], logs: logsMap(log(m.id, D, { status: "evitei" })) });
    expect(s.pontuacao).toBe(100);
  });
});

describe("XP e dia perfeito", () => {
  it("XP por dificuldade, parcial proporcional arredondado, +10 por mau evitado, +50 perfeito", () => {
    const ler = habit({ dificuldade: "dificil" });
    const agua = habit({ dificuldade: "media", metaTipo: "quantidade", metaValor: 3000 });
    const m = habit({ tipo: "mau" });
    const s = computeDay({
      ...base,
      habits: [ler, agua, m],
      logs: logsMap(
        log(ler.id, D),
        log(agua.id, D, { status: "parcial", valor: 1000 }),
        log(m.id, D, { status: "evitei" }),
      ),
    });
    // 30 + round(20/3)=7 + 10
    expect(s.xpGanho).toBe(47);
    expect(s.diaPerfeito).toBe(false);
  });

  it("dia perfeito: tudo feito e nenhum mau hábito ocorrido", () => {
    const a = habit({ dificuldade: "facil" });
    const m = habit({ tipo: "mau" });
    const t = task({ data: D, concluida: true, dificuldade: "dificil" });
    const s = computeDay({
      ...base,
      habits: [a, m],
      tasks: [t],
      logs: logsMap(log(a.id, D), log(m.id, D, { status: "evitei" })),
    });
    expect(s.diaPerfeito).toBe(true);
    expect(s.execucao).toBe(1);
    expect(s.pontuacao).toBe(100);
    expect(s.xpGanho).toBe(10 + 30 + 10 + 50);
  });

  it("mau hábito ocorrido impede dia perfeito", () => {
    const m = habit({ tipo: "mau" });
    const s = computeDay({ ...base, habits: [m], logs: logsMap(log(m.id, D, { status: "aconteceu" })) });
    expect(s.diaPerfeito).toBe(false);
    expect(s.xpGanho).toBe(0);
  });
});

describe("variação", () => {
  it("calcula variação percentual", () => {
    expect(percentChange(56, 50)).toBeCloseTo(12);
    expect(percentChange(40, 50)).toBeCloseTo(-20);
    expect(percentChange(40, null)).toBeNull();
    expect(percentChange(40, 0)).toBeNull();
  });
});
