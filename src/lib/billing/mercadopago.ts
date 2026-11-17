import "server-only";
import type { MpAuthorizedPayment, MpPayment, MpPreapproval } from "./webhook";

const API = "https://api.mercadopago.com";
const TIMEOUT_MS = 10_000;

export function mercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.MERCADOPAGO_WEBHOOK_SECRET);
}

export class MercadoPagoError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function mp<T>(method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    // Não devolve o corpo ao cliente: pode ter dados do pagador.
    throw new MercadoPagoError(res.status, `Mercado Pago ${method} ${path.split("?")[0]}: ${res.status}`);
  }
  return (await res.json()) as T;
}

const enc = encodeURIComponent;

export const mercadoPago = {
  payment: (id: string) => mp<MpPayment>("GET", `/v1/payments/${enc(id)}`),
  preapproval: (id: string) => mp<MpPreapproval>("GET", `/preapproval/${enc(id)}`),
  authorizedPayment: (id: string) => mp<MpAuthorizedPayment>("GET", `/authorized_payments/${enc(id)}`),

  /** Checkout Pro: pagamento único (Pix ou cartão, com parcelas no anual). */
  createPreference: (body: unknown, key: string) =>
    mp<{ id: string; init_point: string }>("POST", "/checkout/preferences", body, key),
  /** Assinatura recorrente no cartão. */
  createPreapproval: (body: unknown, key: string) =>
    mp<{ id: string; init_point: string; status: string }>("POST", "/preapproval", body, key),
  cancelPreapproval: (id: string) =>
    mp<{ id: string; status: string }>("PUT", `/preapproval/${enc(id)}`, { status: "cancelled" }),
};
