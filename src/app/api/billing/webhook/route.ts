import { NextResponse, type NextRequest } from "next/server";
import { mercadoPagoConfigured } from "@/lib/billing/mercadopago";
import { webhookDeps } from "@/lib/billing/server";
import { verifyMercadoPagoSignature } from "@/lib/billing/signature";
import { handleWebhook } from "@/lib/billing/webhook";

export const runtime = "nodejs";

/**
 * Notificações do Mercado Pago. A assinatura `x-signature` é conferida com o segredo do
 * painel e, mesmo assim, o recurso é buscado de novo na API antes de liberar qualquer coisa.
 */
export async function POST(req: NextRequest) {
  if (!mercadoPagoConfigured()) return NextResponse.json({ erro: "não configurado" }, { status: 503 });

  const q = req.nextUrl.searchParams;
  const corpo = (await req.json().catch(() => null)) as { type?: string; data?: { id?: unknown } } | null;
  const dataId = q.get("data.id") ?? (corpo?.data?.id != null ? String(corpo.data.id) : null);
  const type = q.get("type") ?? corpo?.type ?? null;

  const valida = verifyMercadoPagoSignature({
    xSignature: req.headers.get("x-signature"),
    xRequestId: req.headers.get("x-request-id"),
    dataId,
    secret: process.env.MERCADOPAGO_WEBHOOK_SECRET!,
  });
  if (!valida) return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
  if (!dataId || !type || dataId.length > 64) return NextResponse.json({ ok: true, resultado: "ignorado" });

  try {
    const resultado = await handleWebhook({ type, id: dataId }, webhookDeps());
    return NextResponse.json({ ok: true, resultado });
  } catch (e) {
    // 500 faz o Mercado Pago tentar de novo mais tarde.
    console.error("Webhook do Mercado Pago falhou", type, e);
    return NextResponse.json({ erro: "falha temporária" }, { status: 500 });
  }
}
