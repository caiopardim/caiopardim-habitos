/** Monitoramento de erros no servidor (rotas de API, cron). Inerte sem SENTRY_DSN. */
export async function register() {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    // sem dados pessoais: padrão do SDK (não envia IP, cookies nem cabeçalhos de usuário)
    tracesSampleRate: 0.1,
  });
}

export async function onRequestError(...args: unknown[]) {
  const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  const Sentry = await import("@sentry/nextjs");
  (Sentry.captureRequestError as (...a: unknown[]) => void)(...args);
}
