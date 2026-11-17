import type { Assinatura } from "../domain/billing";

/** Na demonstração dá para ver o app como cada plano (só visual; nenhuma conta é afetada). */
export type PlanoPreview = "premium" | "teste" | "gratis";

const CHAVE = "zoryka:demo-plano";
const ouvintes = new Set<() => void>();

export function getPlanoPreview(): PlanoPreview {
  try {
    const v = window.localStorage.getItem(CHAVE);
    return v === "teste" || v === "gratis" ? v : "premium";
  } catch {
    return "premium";
  }
}

export function setPlanoPreview(p: PlanoPreview) {
  try {
    window.localStorage.setItem(CHAVE, p);
  } catch {}
  ouvintes.forEach((f) => f());
}

export function subscribePlanoPreview(f: () => void) {
  ouvintes.add(f);
  return () => {
    ouvintes.delete(f);
  };
}

/** Assinatura fictícia para o plano escolhido (null = tudo liberado). */
export function assinaturaPreview(p: PlanoPreview, now: Date): Assinatura | null {
  const dia = 24 * 60 * 60 * 1000;
  if (p === "premium") return null;
  // Ancorado no início do dia (UTC): a data não muda a cada carregamento.
  const inicioDoDia = Math.floor(now.getTime() / dia) * dia;
  return {
    trialAte: new Date(inicioDoDia + (p === "teste" ? 2 * dia : -3 * dia)).toISOString(),
    premiumAte: null,
    ciclo: null,
    status: "sem_assinatura",
    recorrente: false,
  };
}
