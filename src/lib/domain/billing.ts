/**
 * Planos e direitos de acesso (Bloco 5.11). Regras puras: quem decide se a pessoa é
 * Premium é sempre o servidor, a partir das datas gravadas pelo webhook.
 */

export type Ciclo = "mensal" | "anual";
export type StatusAssinatura = "sem_assinatura" | "pendente" | "ativa" | "cancelada" | "pausada";
export type Plano = "premium" | "teste" | "gratis";

export const PRECOS: Record<Ciclo, number> = { mensal: 19.9, anual: 149.9 };
/** Dias de acesso liberados por pagamento aprovado. */
export const DIAS_POR_CICLO: Record<Ciclo, number> = { mensal: 30, anual: 365 };
export const DIAS_TESTE = 7;
export const PARCELAS_MAX: Record<Ciclo, number> = { mensal: 1, anual: 12 };
/** Folga após o vencimento da recorrência no cartão (o Mercado Pago pode retentar a cobrança). */
export const DIAS_TOLERANCIA_RECORRENTE = 3;

export const LIMITES_GRATIS = {
  /** Hábitos ativos (não arquivados) no plano grátis. */
  habitosAtivos: 3,
  /** Janela máxima da Evolução no plano grátis. */
  evolucaoDias: 7,
} as const;

export interface Assinatura {
  trialAte: string | null;
  premiumAte: string | null;
  ciclo: Ciclo | null;
  status: StatusAssinatura;
  /** Tem assinatura recorrente no cartão. */
  recorrente: boolean;
}

export interface Pagamento {
  id: string;
  ciclo: Ciclo;
  valor: number;
  metodo: string | null;
  status: string;
  criadoEm: string;
}

export interface Direito {
  plano: Plano;
  /** Recursos Premium liberados (premium ou teste). */
  premium: boolean;
  /** Até quando vale o plano atual (null no grátis). */
  ate: string | null;
  /** Dias restantes (arredondado para cima), 0 no grátis. */
  diasRestantes: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;

function diasAte(iso: string, now: Date): number {
  return Math.max(0, Math.ceil((Date.parse(iso) - now.getTime()) / DIA_MS));
}

function futuro(iso: string | null, now: Date): iso is string {
  return iso !== null && Date.parse(iso) > now.getTime();
}

/**
 * Direito de acesso agora. `null` = sem controle de planos (modo local, demonstração ou
 * cobrança desligada): tudo liberado.
 */
export function entitlement(a: Assinatura | null, now: Date): Direito {
  if (!a) return { plano: "premium", premium: true, ate: null, diasRestantes: 0 };
  if (futuro(a.premiumAte, now)) {
    return { plano: "premium", premium: true, ate: a.premiumAte, diasRestantes: diasAte(a.premiumAte, now) };
  }
  if (futuro(a.trialAte, now)) {
    return { plano: "teste", premium: true, ate: a.trialAte, diasRestantes: diasAte(a.trialAte, now) };
  }
  return { plano: "gratis", premium: false, ate: null, diasRestantes: 0 };
}

/** Pode criar (ou reativar) mais um hábito? Hábitos já existentes nunca são bloqueados. */
export function podeAdicionarHabito(d: Direito, habitosAtivos: number): boolean {
  return d.premium || habitosAtivos < LIMITES_GRATIS.habitosAtivos;
}

/** O período da Evolução (em dias) está liberado? */
export function periodoLiberado(d: Direito, dias: number): boolean {
  return d.premium || dias <= LIMITES_GRATIS.evolucaoDias;
}

/** Economia do anual frente a 12 mensalidades, em % inteiro (37). */
export function economiaAnual(): number {
  return Math.floor((1 - PRECOS.anual / (PRECOS.mensal * 12)) * 100);
}

/** Valor mensal equivalente do anual (12,49). */
export function mensalEquivalenteAnual(): number {
  return Math.floor((PRECOS.anual / 12) * 100) / 100;
}

/**
 * Nova data de fim do Premium após um pagamento: soma a partir do fim atual (se ainda
 * vale) ou de agora, para quem renova antes não perder dias.
 */
export function extendPremium(atual: string | null, now: Date, dias: number): string {
  const base = futuro(atual, now) ? Date.parse(atual) : now.getTime();
  return new Date(base + dias * DIA_MS).toISOString();
}

/**
 * Cobrança recorrente no cartão aprovada: garante acesso até a próxima cobrança mais uma
 * folga (o Mercado Pago pode retentar). Não acumula a folga mês a mês.
 */
export function premiumRecorrente(atual: string | null, now: Date): string {
  const alvo = now.getTime() + (DIAS_POR_CICLO.mensal + DIAS_TOLERANCIA_RECORRENTE) * DIA_MS;
  return new Date(Math.max(alvo, atual ? Date.parse(atual) : 0)).toISOString();
}

/** Desfaz os dias de um pagamento estornado (nunca antes de agora). */
export function revertPremium(atual: string | null, now: Date, dias: number): string | null {
  if (!futuro(atual, now)) return atual;
  return new Date(Math.max(now.getTime(), Date.parse(atual) - dias * DIA_MS)).toISOString();
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Referência gravada no pagamento para saber de quem é e qual ciclo. */
export function externalRef(userId: string, ciclo: Ciclo): string {
  return `${userId}:${ciclo}`;
}

export function parseExternalRef(ref: unknown): { userId: string; ciclo: Ciclo } | null {
  if (typeof ref !== "string") return null;
  const [userId, ciclo, ...resto] = ref.split(":");
  if (resto.length || !UUID.test(userId ?? "") || (ciclo !== "mensal" && ciclo !== "anual")) return null;
  return { userId: userId.toLowerCase(), ciclo };
}

/** O valor pago confere com o preço do ciclo? (aceita centavos de diferença por arredondamento) */
export function valorConfere(ciclo: Ciclo, valor: unknown): boolean {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    Math.round(valor * 100) >= Math.round(PRECOS[ciclo] * 100) - 1
  );
}

export function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const PLANO_LABEL: Record<Plano, string> = {
  premium: "Premium",
  teste: "Teste grátis",
  gratis: "Grátis",
};

export const STATUS_LABEL: Record<StatusAssinatura, string> = {
  sem_assinatura: "Sem assinatura",
  pendente: "Aguardando confirmação",
  ativa: "Renovação automática ativa",
  cancelada: "Renovação cancelada",
  pausada: "Renovação pausada",
};
