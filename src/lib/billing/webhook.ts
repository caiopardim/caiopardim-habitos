import {
  DIAS_POR_CICLO,
  extendPremium,
  parseExternalRef,
  premiumRecorrente,
  revertPremium,
  valorConfere,
  type Ciclo,
  type StatusAssinatura,
} from "../domain/billing";

/** Recursos do Mercado Pago (só os campos que usamos). */
export interface MpPayment {
  id: number | string;
  status: string;
  external_reference?: string | null;
  transaction_amount?: number;
  payment_type_id?: string | null;
}
export interface MpPreapproval {
  id: string;
  status: string;
  external_reference?: string | null;
}
export interface MpAuthorizedPayment {
  id: number | string;
  preapproval_id: string;
  transaction_amount?: number;
  payment?: { id: number | string; status: string } | null;
}

export interface BillingStore {
  /** Grava o pagamento se for novo. true = inserido agora. */
  inserirPagamento(p: {
    userId: string;
    mpPaymentId: string;
    ciclo: Ciclo;
    valor: number;
    metodo: string | null;
    status: string;
  }): Promise<boolean>;
  /**
   * Troca o status de um pagamento existente de forma atômica. Com `apenasSe`, só troca se
   * o status atual satisfizer a condição. true = trocou.
   */
  trocarStatus(
    mpPaymentId: string,
    para: string,
    apenasSe?: { igual: string } | { diferente: string },
  ): Promise<boolean>;
  premiumAte(userId: string): Promise<string | null>;
  atualizarAssinatura(
    userId: string,
    patch: Partial<{
      premiumAte: string | null;
      ciclo: Ciclo;
      status: StatusAssinatura;
      mpPreapprovalId: string;
    }>,
  ): Promise<void>;
}

export interface WebhookDeps {
  mp: {
    payment(id: string): Promise<MpPayment>;
    preapproval(id: string): Promise<MpPreapproval>;
    authorizedPayment(id: string): Promise<MpAuthorizedPayment>;
  };
  store: BillingStore;
  now(): Date;
}

export type WebhookResult =
  "liberado" | "estornado" | "status_atualizado" | "assinatura_atualizada" | "valor_divergente" | "ignorado";

const APROVADO = "approved";
const ESTORNOS = new Set(["refunded", "charged_back", "cancelled"]);

const STATUS_PREAPPROVAL: Record<string, StatusAssinatura> = {
  pending: "pendente",
  authorized: "ativa",
  paused: "pausada",
  cancelled: "cancelada",
};

/**
 * Processa uma notificação. Nunca confia no corpo do webhook: busca o recurso no Mercado
 * Pago pelo ID e decide a partir dele. Idempotente: a mesma notificação repetida não
 * libera dias duas vezes (o ID do pagamento é único no banco).
 */
export async function handleWebhook(
  evt: { type: string; id: string },
  deps: WebhookDeps,
): Promise<WebhookResult> {
  switch (evt.type) {
    case "payment": {
      const p = await deps.mp.payment(evt.id);
      const ref = parseExternalRef(p.external_reference);
      if (!ref) return "ignorado";
      return registrarPagamento(deps, {
        userId: ref.userId,
        ciclo: ref.ciclo,
        mpPaymentId: String(p.id),
        status: p.status,
        valor: p.transaction_amount,
        metodo: p.payment_type_id ?? null,
        recorrente: false,
      });
    }
    case "subscription_preapproval": {
      const pre = await deps.mp.preapproval(evt.id);
      const ref = parseExternalRef(pre.external_reference);
      const status = STATUS_PREAPPROVAL[pre.status];
      if (!ref || !status) return "ignorado";
      await deps.store.atualizarAssinatura(ref.userId, {
        mpPreapprovalId: pre.id,
        status,
        ciclo: ref.ciclo,
      });
      return "assinatura_atualizada";
    }
    case "subscription_authorized_payment": {
      const ap = await deps.mp.authorizedPayment(evt.id);
      if (!ap.payment) return "ignorado";
      const pre = await deps.mp.preapproval(ap.preapproval_id);
      const ref = parseExternalRef(pre.external_reference);
      if (!ref) return "ignorado";
      return registrarPagamento(deps, {
        userId: ref.userId,
        ciclo: ref.ciclo,
        mpPaymentId: String(ap.payment.id),
        status: ap.payment.status,
        valor: ap.transaction_amount,
        metodo: "credit_card",
        recorrente: true,
      });
    }
    default:
      return "ignorado";
  }
}

async function registrarPagamento(
  { store, now }: WebhookDeps,
  p: {
    userId: string;
    ciclo: Ciclo;
    mpPaymentId: string;
    status: string;
    valor: number | undefined;
    metodo: string | null;
    recorrente: boolean;
  },
): Promise<WebhookResult> {
  const aprovado = p.status === APROVADO;
  if (aprovado && !valorConfere(p.ciclo, p.valor)) return "valor_divergente";

  const novo = await store.inserirPagamento({
    userId: p.userId,
    mpPaymentId: p.mpPaymentId,
    ciclo: p.ciclo,
    valor: p.valor ?? 0,
    metodo: p.metodo,
    status: p.status,
  });

  let creditar = false;
  let debitar = false;
  if (novo) creditar = aprovado;
  else if (aprovado) creditar = await store.trocarStatus(p.mpPaymentId, p.status, { diferente: APROVADO });
  else if (ESTORNOS.has(p.status))
    debitar = await store.trocarStatus(p.mpPaymentId, p.status, { igual: APROVADO });
  else await store.trocarStatus(p.mpPaymentId, p.status, { diferente: APROVADO });

  if (!creditar && !debitar) return "status_atualizado";
  const agora = now();
  const atual = await store.premiumAte(p.userId);
  const dias = DIAS_POR_CICLO[p.ciclo];
  const premiumAte = creditar
    ? p.recorrente
      ? premiumRecorrente(atual, agora)
      : extendPremium(atual, agora, dias)
    : revertPremium(atual, agora, dias);
  await store.atualizarAssinatura(p.userId, creditar ? { premiumAte, ciclo: p.ciclo } : { premiumAte });
  return creditar ? "liberado" : "estornado";
}
