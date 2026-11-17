import { describe, expect, it } from "vitest";
import { habit, log, task } from "../domain/test-helpers";
import { DEFAULT_NOTIFICATION_PREFS } from "../domain/types";
import { emptyProfile } from "./local-repository";
import {
  assinaturaRow,
  pagamentoRow,
  areaRow,
  areaToRow,
  habitRow,
  habitToRow,
  logRow,
  logToRow,
  profileRow,
  profileToRow,
  summaryToRow,
  taskRow,
  taskToRow,
} from "./mappers";

/** Simula o que o Postgres devolve: tipos numéricos como string, horários com segundos. */
const comoBanco = <T extends Record<string, unknown>>(row: T) => ({ ...row, user_id: "u1" });

describe("conversão banco ⇄ app", () => {
  it("hábito: ida e volta preserva tudo (horário com segundos, numeric como string)", () => {
    const h = habit({
      metaTipo: "quantidade",
      metaValor: 3000,
      unidade: "ml",
      horario: "07:30",
      lembrete: true,
      diasSemana: [1, 3],
    });
    const row = {
      ...comoBanco(habitToRow(h, "u1")),
      meta_valor: "3000.00",
      horario: "07:30:00",
      criado_em: h.criadoEm,
    };
    expect(habitRow.parse(row)).toEqual(h);
  });

  it("hábito de check não envia meta nem unidade", () => {
    const row = habitToRow(habit({ metaTipo: "check", metaValor: 5, unidade: "x" }), "u1");
    expect(row.meta_valor).toBeNull();
    expect(row.unidade).toBeNull();
  });

  it("hábito antigo sem a coluna lembrete vira lembrete=false", () => {
    const h = habit();
    const row = { ...comoBanco(habitToRow(h, "u1")), criado_em: h.criadoEm } as Record<string, unknown>;
    delete row.lembrete;
    expect(habitRow.parse(row).lembrete).toBe(false);
  });

  it("registro, tarefa e área", () => {
    const l = log("h1", "2026-03-10", { status: "parcial", valor: 1500 });
    expect(logRow.parse({ ...logToRow(l, "u1"), valor: "1500.00" })).toEqual(l);
    const t = task({ titulo: "Pagar contas", concluida: true, concluidaEm: "2026-03-10T18:00:00Z" });
    expect(taskRow.parse(taskToRow(t, "u1"))).toEqual(t);
    const a = { id: "a1", nome: "Saúde", cor: "#059669", ordem: 1, emFoco: true };
    expect(areaRow.parse(areaToRow(a, "u1"))).toEqual(a);
  });

  it("perfil: padrões para colunas novas e envio só do que mudou", () => {
    const base = {
      id: "u1",
      nome: "Ana",
      fuso: "America/Sao_Paulo",
      limite_sequencia: "0.60",
      xp_total: 120,
      nivel: 2,
      onboarding_concluido: true,
      criado_em: "2026-03-01T00:00:00Z",
    };
    const p = profileRow.parse(base);
    expect(p).toMatchObject({
      limiteSequencia: 0.6,
      objetivo: null,
      lembreteHorario: null,
      notificacoes: DEFAULT_NOTIFICATION_PREFS,
    });
    const completo = profileRow.parse({
      ...base,
      lembrete_horario: "21:00:00",
      silencio_inicio: "23:00:00",
      notif_max_dia: "2",
    });
    expect(completo.lembreteHorario).toBe("21:00");
    expect(completo.notificacoes).toMatchObject({ silencioInicio: "23:00", maxPorDia: 2 });

    expect(profileToRow({ nome: "Bia" })).toEqual({ nome: "Bia" });
    const prefs = { ...emptyProfile().notificacoes, habitos: false };
    expect(profileToRow({ notificacoes: prefs })).toMatchObject({
      notif_habitos: false,
      silencio_inicio: "22:30",
    });
  });

  it("resumo do dia limita a execução entre 0 e 1", () => {
    const r = summaryToRow(
      {
        data: "2026-03-10",
        temItens: true,
        totalItens: 2,
        concluidos: 2,
        execucao: 1.0000001,
        pontuacao: 100,
        xpGanho: 70,
        diaPerfeito: true,
        contaSequencia: true,
        maus: { previstos: 0, evitados: 0, aconteceram: 0 },
      },
      "u1",
    );
    expect(r.execucao).toBe(1);
    expect(r).toMatchObject({ user_id: "u1", pontuacao: 100, dia_perfeito: true });
  });
});

describe("assinaturaRow / pagamentoRow", () => {
  it("converte a assinatura", () => {
    expect(
      assinaturaRow.parse({
        trial_ate: "2026-11-24T00:00:00Z",
        premium_ate: null,
        ciclo: null,
        status: "sem_assinatura",
        mp_preapproval_id: null,
      }),
    ).toEqual({
      trialAte: "2026-11-24T00:00:00Z",
      premiumAte: null,
      ciclo: null,
      status: "sem_assinatura",
      recorrente: false,
    });
  });
  it("recorrente só com preapproval não cancelado", () => {
    const base = { trial_ate: null, premium_ate: null, ciclo: "mensal", mp_preapproval_id: "pre-1" };
    expect(assinaturaRow.parse({ ...base, status: "ativa" }).recorrente).toBe(true);
    expect(assinaturaRow.parse({ ...base, status: "cancelada" }).recorrente).toBe(false);
  });
  it("converte pagamento com valor numeric (string)", () => {
    expect(
      pagamentoRow.parse({
        mp_payment_id: "42",
        ciclo: "anual",
        valor: "149.90",
        metodo: "bank_transfer",
        status: "approved",
        criado_em: "2026-11-17T12:00:00Z",
      }),
    ).toMatchObject({ id: "42", valor: 149.9 });
  });
});
