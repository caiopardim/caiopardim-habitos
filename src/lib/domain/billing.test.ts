import { describe, expect, it } from "vitest";
import {
  economiaAnual,
  entitlement,
  extendPremium,
  externalRef,
  formatBRL,
  mensalEquivalenteAnual,
  parseExternalRef,
  premiumRecorrente,
  periodoLiberado,
  podeAdicionarHabito,
  revertPremium,
  valorConfere,
  type Assinatura,
} from "./billing";

const now = new Date("2026-11-17T12:00:00Z");
const base: Assinatura = {
  trialAte: null,
  premiumAte: null,
  ciclo: null,
  status: "sem_assinatura",
  recorrente: false,
};
const UID = "11111111-2222-3333-4444-555555555555";

describe("entitlement", () => {
  it("sem controle de planos libera tudo", () => {
    expect(entitlement(null, now)).toMatchObject({ plano: "premium", premium: true });
  });
  it("teste grátis em andamento", () => {
    const d = entitlement({ ...base, trialAte: "2026-11-20T12:00:00Z" }, now);
    expect(d).toEqual({ plano: "teste", premium: true, ate: "2026-11-20T12:00:00Z", diasRestantes: 3 });
  });
  it("arredonda dias restantes para cima", () => {
    expect(entitlement({ ...base, trialAte: "2026-11-17T13:00:00Z" }, now).diasRestantes).toBe(1);
  });
  it("premium vence o teste", () => {
    const d = entitlement(
      { ...base, trialAte: "2026-11-20T00:00:00Z", premiumAte: "2027-01-01T00:00:00Z" },
      now,
    );
    expect(d.plano).toBe("premium");
  });
  it("tudo vencido = grátis", () => {
    const d = entitlement(
      { ...base, trialAte: "2026-11-10T00:00:00Z", premiumAte: "2026-11-17T11:59:59Z" },
      now,
    );
    expect(d).toEqual({ plano: "gratis", premium: false, ate: null, diasRestantes: 0 });
  });
});

describe("limites do grátis", () => {
  const gratis = entitlement(base, now);
  const premium = entitlement(null, now);
  it("até 3 hábitos ativos", () => {
    expect(podeAdicionarHabito(gratis, 2)).toBe(true);
    expect(podeAdicionarHabito(gratis, 3)).toBe(false);
    expect(podeAdicionarHabito(premium, 30)).toBe(true);
  });
  it("Evolução até 7 dias", () => {
    expect(periodoLiberado(gratis, 7)).toBe(true);
    expect(periodoLiberado(gratis, 30)).toBe(false);
    expect(periodoLiberado(premium, 365)).toBe(true);
  });
});

describe("preços", () => {
  it("anual economiza 37% e sai 12,49/mês", () => {
    expect(economiaAnual()).toBe(37);
    expect(mensalEquivalenteAnual()).toBe(12.49);
    expect(formatBRL(19.9).replace(/\s/g, " ")).toBe("R$ 19,90");
  });
  it("valor pago confere", () => {
    expect(valorConfere("mensal", 19.9)).toBe(true);
    expect(valorConfere("anual", 149.89)).toBe(true);
    expect(valorConfere("anual", 19.9)).toBe(false);
    expect(valorConfere("mensal", "19.9")).toBe(false);
    expect(valorConfere("mensal", Number.NaN)).toBe(false);
  });
});

describe("extendPremium / revertPremium", () => {
  it("sem premium: conta a partir de agora", () => {
    expect(extendPremium(null, now, 30)).toBe("2026-12-17T12:00:00.000Z");
    expect(extendPremium("2026-01-01T00:00:00Z", now, 30)).toBe("2026-12-17T12:00:00.000Z");
  });
  it("renovação antecipada soma ao fim atual", () => {
    expect(extendPremium("2026-11-27T12:00:00Z", now, 365)).toBe("2027-11-27T12:00:00.000Z");
  });
  it("recorrente garante 30 + 3 dias sem acumular a folga", () => {
    expect(premiumRecorrente(null, now)).toBe("2026-12-20T12:00:00.000Z");
    expect(premiumRecorrente("2026-12-19T12:00:00.000Z", now)).toBe("2026-12-20T12:00:00.000Z");
    expect(premiumRecorrente("2027-03-01T00:00:00.000Z", now)).toBe("2027-03-01T00:00:00.000Z");
  });
  it("estorno tira os dias, sem passar de agora", () => {
    expect(revertPremium("2027-01-16T12:00:00Z", now, 30)).toBe("2026-12-17T12:00:00.000Z");
    expect(revertPremium("2026-11-20T12:00:00Z", now, 30)).toBe(now.toISOString());
    expect(revertPremium(null, now, 30)).toBeNull();
  });
});

describe("external_reference", () => {
  it("ida e volta", () => {
    expect(parseExternalRef(externalRef(UID, "anual"))).toEqual({ userId: UID, ciclo: "anual" });
  });
  it.each([undefined, 1, "", "x:mensal", `${UID}:semanal`, `${UID}:mensal:extra`, UID])("rejeita %s", (r) => {
    expect(parseExternalRef(r)).toBeNull();
  });
});
