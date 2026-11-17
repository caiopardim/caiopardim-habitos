import { describe, expect, it } from "vitest";
import { handleWebhook, type BillingStore, type MpPayment, type WebhookDeps } from "./webhook";

const UID = "11111111-2222-3333-4444-555555555555";
const NOW = new Date("2026-11-17T12:00:00Z");

function fakeStore() {
  const pagamentos = new Map<string, { status: string; userId: string }>();
  const assinaturas = new Map<string, Record<string, unknown>>();
  const store: BillingStore = {
    async inserirPagamento(p) {
      if (pagamentos.has(p.mpPaymentId)) return false;
      pagamentos.set(p.mpPaymentId, { status: p.status, userId: p.userId });
      return true;
    },
    async trocarStatus(id, para, apenasSe) {
      const p = pagamentos.get(id);
      if (!p) return false;
      if (apenasSe && "igual" in apenasSe && p.status !== apenasSe.igual) return false;
      if (apenasSe && "diferente" in apenasSe && p.status === apenasSe.diferente) return false;
      p.status = para;
      return true;
    },
    async premiumAte(userId) {
      return (assinaturas.get(userId)?.premiumAte as string | undefined) ?? null;
    },
    async atualizarAssinatura(userId, patch) {
      assinaturas.set(userId, { ...assinaturas.get(userId), ...patch });
    },
  };
  return { store, pagamentos, assinaturas };
}

function setup(payments: Record<string, MpPayment> = {}) {
  const f = fakeStore();
  const deps: WebhookDeps = {
    store: f.store,
    now: () => NOW,
    mp: {
      payment: async (id) => payments[id],
      preapproval: async (id) => ({ id, status: "authorized", external_reference: `${UID}:mensal` }),
      authorizedPayment: async (id) => ({
        id,
        preapproval_id: "pre-1",
        transaction_amount: 19.9,
        payment: { id: `ap-${id}`, status: "approved" },
      }),
    },
  };
  return { ...f, deps };
}

const pix = (status: string, extra: Partial<MpPayment> = {}): MpPayment => ({
  id: 42,
  status,
  external_reference: `${UID}:anual`,
  transaction_amount: 149.9,
  payment_type_id: "bank_transfer",
  ...extra,
});

describe("handleWebhook: pagamento avulso", () => {
  it("aprovado libera 365 dias no anual", async () => {
    const { deps, assinaturas } = setup({ "42": pix("approved") });
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("liberado");
    expect(assinaturas.get(UID)).toEqual({ premiumAte: "2027-11-17T12:00:00.000Z", ciclo: "anual" });
  });

  it("notificação repetida não libera dias duas vezes", async () => {
    const { deps, assinaturas } = setup({ "42": pix("approved") });
    await handleWebhook({ type: "payment", id: "42" }, deps);
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("status_atualizado");
    expect(assinaturas.get(UID)?.premiumAte).toBe("2027-11-17T12:00:00.000Z");
  });

  it("Pix pendente e depois aprovado libera uma vez", async () => {
    const pays = { "42": pix("pending") };
    const { deps, assinaturas } = setup(pays);
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("status_atualizado");
    expect(assinaturas.get(UID)).toBeUndefined();
    pays["42"] = pix("approved");
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("liberado");
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("status_atualizado");
  });

  it("estorno devolve os dias uma vez", async () => {
    const pays = { "42": pix("approved") };
    const { deps, assinaturas } = setup(pays);
    await handleWebhook({ type: "payment", id: "42" }, deps);
    pays["42"] = pix("refunded");
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("estornado");
    expect(assinaturas.get(UID)?.premiumAte).toBe(NOW.toISOString());
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("status_atualizado");
  });

  it("valor menor que o preço não libera", async () => {
    const { deps, pagamentos } = setup({ "42": pix("approved", { transaction_amount: 19.9 }) });
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("valor_divergente");
    expect(pagamentos.size).toBe(0);
  });

  it("pagamento de outro sistema é ignorado", async () => {
    const { deps } = setup({ "42": pix("approved", { external_reference: "pedido-123" }) });
    expect(await handleWebhook({ type: "payment", id: "42" }, deps)).toBe("ignorado");
  });

  it("tipos desconhecidos são ignorados", async () => {
    const { deps } = setup();
    expect(await handleWebhook({ type: "merchant_order", id: "1" }, deps)).toBe("ignorado");
  });
});

describe("handleWebhook: assinatura no cartão", () => {
  it("autorização atualiza o status sem liberar dias", async () => {
    const { deps, assinaturas } = setup();
    expect(await handleWebhook({ type: "subscription_preapproval", id: "pre-1" }, deps)).toBe(
      "assinatura_atualizada",
    );
    expect(assinaturas.get(UID)).toEqual({ mpPreapprovalId: "pre-1", status: "ativa", ciclo: "mensal" });
  });

  it("cobrança mensal aprovada garante 33 dias, sem duplicar", async () => {
    const { deps, assinaturas } = setup();
    expect(await handleWebhook({ type: "subscription_authorized_payment", id: "7" }, deps)).toBe("liberado");
    expect(assinaturas.get(UID)?.premiumAte).toBe("2026-12-20T12:00:00.000Z");
    expect(await handleWebhook({ type: "subscription_authorized_payment", id: "7" }, deps)).toBe(
      "status_atualizado",
    );
  });
});
