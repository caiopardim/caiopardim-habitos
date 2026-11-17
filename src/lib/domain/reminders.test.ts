import { describe, expect, it } from "vitest";
import { minutesInTz } from "./format";
import { dueInWindow, inQuietHours, planReminders, toMinutes, type PlanInput } from "./reminders";
import { habit, log } from "./test-helpers";
import { DEFAULT_NOTIFICATION_PREFS, type DaySummary } from "./types";

const D = "2026-03-10";
function sum(over: Partial<DaySummary> = {}): DaySummary {
  return {
    data: D,
    temItens: true,
    totalItens: 5,
    concluidos: 2,
    execucao: 0.4,
    pontuacao: 40,
    xpGanho: 0,
    diaPerfeito: false,
    contaSequencia: false,
    maus: { previstos: 0, evitados: 0, aconteceram: 0 },
    ...over,
  };
}

const agua = habit({
  id: "agua",
  nome: "Beber água",
  emoji: "💧",
  metaTipo: "quantidade",
  metaValor: 3000,
  unidade: "ml",
  horario: "10:00",
  lembrete: true,
});

function input(over: Partial<PlanInput> = {}): PlanInput {
  return {
    date: D,
    nowMinutes: toMinutes("21:05"),
    prefs: { ...DEFAULT_NOTIFICATION_PREFS },
    lembreteHorario: "21:00",
    habits: [agua],
    logs: new Map(),
    summary: sum(),
    limiteSequencia: 0.6,
    sequenciaAtual: 0,
    sentToday: [],
    ...over,
  };
}

describe("horários", () => {
  it("horário silencioso atravessando a meia-noite", () => {
    expect(inQuietHours(toMinutes("23:00"), "22:30", "07:00")).toBe(true);
    expect(inQuietHours(toMinutes("06:59"), "22:30", "07:00")).toBe(true);
    expect(inQuietHours(toMinutes("07:00"), "22:30", "07:00")).toBe(false);
    expect(inQuietHours(toMinutes("13:00"), "12:00", "14:00")).toBe(true);
    expect(inQuietHours(toMinutes("13:00"), "08:00", "08:00")).toBe(false);
  });

  it("janela de 15 minutos", () => {
    expect(dueInWindow("21:00", toMinutes("21:00"))).toBe(true);
    expect(dueInWindow("21:00", toMinutes("21:14"))).toBe(true);
    expect(dueInWindow("21:00", toMinutes("21:15"))).toBe(false);
    expect(dueInWindow("21:00", toMinutes("20:59"))).toBe(false);
  });

  it("minutos no fuso do usuário", () => {
    expect(minutesInTz("America/Sao_Paulo", new Date("2026-03-11T00:30:00Z"))).toBe(21 * 60 + 30);
  });
});

describe("lembretes", () => {
  it("fechamento do dia no horário escolhido, com o que falta", () => {
    expect(planReminders(input())).toEqual([
      {
        tipo: "fechamento",
        ref: "",
        title: "Como foi seu dia?",
        body: "Registre o que você fez — 3 itens ainda abertos.",
        url: "/hoje",
      },
    ]);
  });

  it("não lembra de fechar um dia já completo", () => {
    expect(planReminders(input({ summary: sum({ execucao: 1, concluidos: 5 }) }))).toEqual([]);
  });

  it("lembrete do hábito no horário dele, só se não foi feito", () => {
    const r = planReminders(input({ nowMinutes: toMinutes("10:05") }));
    expect(r).toEqual([
      {
        tipo: "habito",
        ref: "agua",
        title: "💧 Hora de Beber água",
        body: "Meta de hoje: 3.000 ml",
        url: "/hoje",
      },
    ]);
    const feito = new Map([["agua", log("agua", D, { valor: 3000 })]]);
    expect(planReminders(input({ nowMinutes: toMinutes("10:05"), logs: feito }))).toEqual([]);
    expect(
      planReminders(input({ nowMinutes: toMinutes("10:05"), habits: [{ ...agua, lembrete: false }] })),
    ).toEqual([]);
  });

  it("sequência em risco às 20h substitui o fechamento no mesmo horário", () => {
    const r = planReminders(
      input({ nowMinutes: toMinutes("20:00"), lembreteHorario: "20:00", sequenciaAtual: 6 }),
    );
    expect(r.map((x) => x.tipo)).toEqual(["sequencia"]);
    expect(r[0].title).toBe("Sua sequência de 6 dias está em risco");
    expect(r[0].body).toBe("Mais 1 item e ela continua. Você consegue!");
  });

  it("respeita silêncio, tipos desligados, limite diário e não repete", () => {
    expect(planReminders(input({ nowMinutes: toMinutes("23:00"), lembreteHorario: "23:00" }))).toEqual([]);
    expect(planReminders(input({ prefs: { ...DEFAULT_NOTIFICATION_PREFS, fechamento: false } }))).toEqual([]);
    expect(
      planReminders(
        input({
          sentToday: [
            { tipo: "habito", ref: "a" },
            { tipo: "habito", ref: "b" },
            { tipo: "habito", ref: "c" },
          ],
        }),
      ),
    ).toEqual([]);
    expect(planReminders(input({ sentToday: [{ tipo: "fechamento", ref: "" }] }))).toEqual([]);
  });

  it("limite corta pela prioridade", () => {
    const outro = { ...agua, id: "ler", nome: "Ler", horario: "21:00" };
    const r = planReminders(
      input({
        habits: [outro],
        prefs: { ...DEFAULT_NOTIFICATION_PREFS, maxPorDia: 2 },
        sentToday: [{ tipo: "teste", ref: "" }],
      }),
    );
    expect(r.map((x) => x.tipo)).toEqual(["fechamento"]);
  });
});
