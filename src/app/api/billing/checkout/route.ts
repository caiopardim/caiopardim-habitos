import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { mercadoPago, mercadoPagoConfigured } from "@/lib/billing/mercadopago";
import { billingStore } from "@/lib/billing/server";
import { BILLING_ENABLED } from "@/lib/config";
import { externalRef, PARCELAS_MAX, PRECOS } from "@/lib/domain/billing";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const body = z.object({
  ciclo: z.enum(["mensal", "anual"]),
  /** avulso = Pix ou cartão (anual em até 12x) · recorrente = cartão todo mês */
  forma: z.enum(["avulso", "recorrente"]),
});

function siteUrl(req: NextRequest): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, "");
}

/** Cria o checkout no Mercado Pago e devolve o link de pagamento. */
export async function POST(req: NextRequest) {
  if (!BILLING_ENABLED || !mercadoPagoConfigured()) {
    return NextResponse.json({ erro: "Pagamentos indisponíveis no momento." }, { status: 503 });
  }
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user?.email) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: "plano inválido" }, { status: 400 });
  const { ciclo, forma } = parsed.data;
  if (forma === "recorrente" && ciclo !== "mensal") {
    return NextResponse.json({ erro: "A renovação automática é só no plano mensal." }, { status: 400 });
  }

  const site = siteUrl(req);
  const ref = externalRef(user.id, ciclo);
  const titulo = `Zoryka Premium ${ciclo === "anual" ? "anual" : "mensal"}`;

  try {
    if (forma === "recorrente") {
      const { data: atual } = await sb
        .from("assinaturas")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();
      if (atual?.status === "ativa") {
        return NextResponse.json({ erro: "Você já tem a renovação automática ativa." }, { status: 409 });
      }
      const pre = await mercadoPago.createPreapproval(
        {
          reason: titulo,
          external_reference: ref,
          payer_email: user.email,
          auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: PRECOS.mensal,
            currency_id: "BRL",
          },
          back_url: `${site}/assinatura?retorno=cartao`,
          status: "pending",
        },
        randomUUID(),
      );
      await billingStore().atualizarAssinatura(user.id, {
        mpPreapprovalId: pre.id,
        status: "pendente",
        ciclo: "mensal",
      });
      return NextResponse.json({ url: pre.init_point });
    }

    const pref = await mercadoPago.createPreference(
      {
        items: [
          {
            id: `zoryka-${ciclo}`,
            title: titulo,
            quantity: 1,
            unit_price: PRECOS[ciclo],
            currency_id: "BRL",
          },
        ],
        external_reference: ref,
        payer: { email: user.email },
        back_urls: {
          success: `${site}/assinatura?retorno=aprovado`,
          pending: `${site}/assinatura?retorno=pendente`,
          failure: `${site}/assinatura?retorno=falhou`,
        },
        auto_return: "approved",
        notification_url: `${site}/api/billing/webhook`,
        statement_descriptor: "ZORYKA",
        // Pix e cartão; boleto fica de fora (leva dias para compensar).
        payment_methods: { installments: PARCELAS_MAX[ciclo], excluded_payment_types: [{ id: "ticket" }] },
      },
      randomUUID(),
    );
    return NextResponse.json({ url: pref.init_point });
  } catch (e) {
    console.error("Checkout falhou", e);
    return NextResponse.json({ erro: "Não foi possível abrir o pagamento agora." }, { status: 502 });
  }
}
