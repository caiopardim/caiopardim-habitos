import { track } from "@/lib/analytics";
import type { Ciclo } from "@/lib/domain/billing";

export type Forma = "avulso" | "recorrente";

/** Pede o link de pagamento ao servidor e vai para o Mercado Pago. Retorna a mensagem de erro, se houver. */
export async function iniciarCheckout(ciclo: Ciclo, forma: Forma): Promise<string | null> {
  try {
    const r = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ciclo, forma }),
    });
    const j = (await r.json().catch(() => ({}))) as { url?: string; erro?: string };
    if (!r.ok || !j.url) return j.erro ?? "Não foi possível abrir o pagamento agora.";
    track("checkout_iniciado", { ciclo, forma });
    window.location.assign(j.url);
    return null;
  } catch {
    return "Sem conexão. Verifique a internet e tente de novo.";
  }
}

export async function cancelarRenovacao(): Promise<string | null> {
  try {
    const r = await fetch("/api/billing/cancel", { method: "POST" });
    if (r.ok) {
      track("renovacao_cancelada");
      return null;
    }
    const j = (await r.json().catch(() => ({}))) as { erro?: string };
    return j.erro ?? "Não foi possível cancelar agora.";
  } catch {
    return "Sem conexão. Verifique a internet e tente de novo.";
  }
}
