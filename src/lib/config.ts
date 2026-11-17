/** Nome do produto — troque aqui para renomear o app inteiro. */
export const APP_NAME = "Zoryka";
export const APP_TAGLINE = "sua evolução, um dia de cada vez";
export const APP_DESCRIPTION =
  "Sua evolução, um dia de cada vez: acompanhe hábitos, evite o que te atrapalha e veja seu progresso em dados.";

export const DEFAULT_TIMEZONE = "America/Sao_Paulo";
/** Execução mínima (0–1) para um dia contar na sequência. */
export const DEFAULT_STREAK_THRESHOLD = 0.6;
/** Quantos dias para trás o usuário pode editar registros. */
export const EDIT_WINDOW_DAYS = 7;

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Mostra blocos de "em breve" (recursos de fases futuras). Desligado por padrão:
 * em produção, recurso que não existe não aparece. Ligue com NEXT_PUBLIC_SHOW_ROADMAP=true no .env.local.
 */
export const SHOW_ROADMAP = process.env.NEXT_PUBLIC_SHOW_ROADMAP === "true";

/**
 * Planos e cobrança (Mercado Pago). Desligado por padrão: o app funciona 100% grátis.
 * Ligue com NEXT_PUBLIC_BILLING_ENABLED=true depois de configurar o Mercado Pago.
 */
export const BILLING_ENABLED = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** Endereço público do app (SEO, cartões de compartilhamento, links do pagamento). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
