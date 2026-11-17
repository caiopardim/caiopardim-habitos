import { NextResponse } from "next/server";
import { mercadoPago, mercadoPagoConfigured } from "@/lib/billing/mercadopago";
import { billingStore } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Cancela a renovação automática. O Premium já pago continua até o fim do período. */
export async function POST() {
  if (!mercadoPagoConfigured()) {
    return NextResponse.json({ erro: "Pagamentos indisponíveis no momento." }, { status: 503 });
  }
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  // Lido com a RLS: só a assinatura do próprio usuário.
  const { data } = await sb
    .from("assinaturas")
    .select("mp_preapproval_id, status")
    .eq("user_id", user.id)
    .maybeSingle();
  const id = data?.mp_preapproval_id as string | null | undefined;
  if (!id || data?.status === "cancelada") {
    return NextResponse.json({ erro: "Não há renovação automática para cancelar." }, { status: 404 });
  }
  try {
    await mercadoPago.cancelPreapproval(id);
    await billingStore().atualizarAssinatura(user.id, { status: "cancelada" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Cancelamento falhou", e);
    return NextResponse.json({ erro: "Não foi possível cancelar agora. Tente de novo." }, { status: 502 });
  }
}
