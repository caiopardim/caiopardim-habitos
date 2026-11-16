/** Passo dos botões +/− de uma meta numérica: ~10% da meta, arredondado a 1 algarismo. */
export function suggestedStep(meta: number): number {
  if (!Number.isFinite(meta) || meta <= 0) return 1;
  const bruto = meta / 10;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = Math.round(bruto / mag) * mag;
  // evita 0.30000000000000004
  return Number(passo.toPrecision(2));
}

export function clampValue(valor: number): number {
  if (!Number.isFinite(valor) || valor < 0) return 0;
  return Math.min(Number(valor.toFixed(2)), 1_000_000);
}
