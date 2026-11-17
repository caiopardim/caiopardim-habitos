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
