import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyMercadoPagoSignature } from "./signature";

const secret = "segredo-de-teste";
const assinar = (manifest: string) => createHmac("sha256", secret).update(manifest).digest("hex");

describe("verifyMercadoPagoSignature", () => {
  const v1 = assinar("id:123456;request-id:req-1;ts:1704908010;");
  const ok = { xSignature: `ts=1704908010,v1=${v1}`, xRequestId: "req-1", dataId: "123456", secret };

  it("aceita assinatura correta", () => {
    expect(verifyMercadoPagoSignature(ok)).toBe(true);
    expect(verifyMercadoPagoSignature({ ...ok, xSignature: ` ts=1704908010 , v1=${v1}` })).toBe(true);
  });
  it("id alfanumérico é assinado em minúsculas", () => {
    const sig = assinar("id:abc123;request-id:req-1;ts:1;");
    expect(verifyMercadoPagoSignature({ ...ok, dataId: "ABC123", xSignature: `ts=1,v1=${sig}` })).toBe(true);
  });
  it("omite partes ausentes do manifesto", () => {
    const sig = assinar("ts:99;");
    expect(
      verifyMercadoPagoSignature({ xSignature: `ts=99,v1=${sig}`, xRequestId: null, dataId: null, secret }),
    ).toBe(true);
  });
  it.each([
    ["outro id", { dataId: "999" }],
    ["outro request-id", { xRequestId: "req-2" }],
    ["outro segredo", { secret: "x" }],
    ["sem segredo", { secret: "" }],
    ["sem cabeçalho", { xSignature: null }],
    ["sem v1", { xSignature: "ts=1704908010" }],
    ["v1 malformado", { xSignature: "ts=1704908010,v1=zz" }],
    ["ts trocado", { xSignature: `ts=1704908011,v1=${v1}` }],
  ])("rejeita: %s", (_, patch) => {
    expect(verifyMercadoPagoSignature({ ...ok, ...patch })).toBe(false);
  });
});
