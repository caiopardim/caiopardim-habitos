import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Confere a assinatura `x-signature` do webhook do Mercado Pago.
 * Formato do cabeçalho: "ts=1704908010,v1=<hmac sha256 hex>".
 * Manifesto assinado: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" (partes ausentes são omitidas).
 */
export function verifyMercadoPagoSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  const { xSignature, xRequestId, secret } = input;
  if (!xSignature || !secret) return false;
  const parts = new Map(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")] as const;
    }),
  );
  const ts = parts.get("ts");
  const v1 = parts.get("v1");
  if (!ts || !v1 || !/^[0-9a-f]{64}$/i.test(v1)) return false;

  // IDs alfanuméricos são assinados em minúsculas.
  const dataId =
    input.dataId && /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  let manifest = "";
  if (dataId) manifest += `id:${dataId};`;
  if (xRequestId) manifest += `request-id:${xRequestId};`;
  manifest += `ts:${ts};`;

  const esperado = createHmac("sha256", secret).update(manifest).digest();
  const recebido = Buffer.from(v1, "hex");
  return recebido.length === esperado.length && timingSafeEqual(recebido, esperado);
}
