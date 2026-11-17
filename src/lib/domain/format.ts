const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Número no formato brasileiro (3.000; 1,5). Usado também no servidor. */
export function formatNumberPtBr(n: number): string {
  return nf.format(n);
}

/** Minutos desde a meia-noite no fuso informado. */
export function minutesInTz(timeZone: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  return (Number(parts.hour) % 24) * 60 + Number(parts.minute);
}
