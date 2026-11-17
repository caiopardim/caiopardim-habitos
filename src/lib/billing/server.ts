import "server-only";
import { adminClient } from "../push/server";
import { mercadoPago } from "./mercadopago";
import type { BillingStore, WebhookDeps } from "./webhook";

function ok<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Gravações de cobrança com a service role (o usuário não tem permissão de escrita). */
export function billingStore(): BillingStore {
  const sb = adminClient();
  return {
    async inserirPagamento(p) {
      const rows = ok(
        await sb
          .from("pagamentos")
          .upsert(
            {
              user_id: p.userId,
              mp_payment_id: p.mpPaymentId,
              ciclo: p.ciclo,
              valor: p.valor,
              metodo: p.metodo,
              status: p.status,
            },
            { onConflict: "mp_payment_id", ignoreDuplicates: true },
          )
          .select("id"),
      );
      return (rows ?? []).length > 0;
    },
    async trocarStatus(id, para, apenasSe) {
      let q = sb.from("pagamentos").update({ status: para }).eq("mp_payment_id", id);
      if (apenasSe && "igual" in apenasSe) q = q.eq("status", apenasSe.igual);
      if (apenasSe && "diferente" in apenasSe) q = q.neq("status", apenasSe.diferente);
      const rows = ok(await q.select("id"));
      return (rows ?? []).length > 0;
    },
    async premiumAte(userId) {
      const row = ok(
        await sb.from("assinaturas").select("premium_ate").eq("user_id", userId).maybeSingle(),
      ) as { premium_ate: string | null } | null;
      return row?.premium_ate ?? null;
    },
    async atualizarAssinatura(userId, patch) {
      const row: Record<string, unknown> = { user_id: userId, atualizado_em: new Date().toISOString() };
      if (patch.premiumAte !== undefined) row.premium_ate = patch.premiumAte;
      if (patch.ciclo) row.ciclo = patch.ciclo;
      if (patch.status) row.status = patch.status;
      if (patch.mpPreapprovalId) row.mp_preapproval_id = patch.mpPreapprovalId;
      ok(await sb.from("assinaturas").upsert(row, { onConflict: "user_id" }));
    },
  };
}

export function webhookDeps(): WebhookDeps {
  return { mp: mercadoPago, store: billingStore(), now: () => new Date() };
}
