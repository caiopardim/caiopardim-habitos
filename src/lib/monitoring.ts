/**
 * Monitoramento de erros (Sentry). Inerte sem DSN; o SDK só é baixado quando há DSN.
 * Privacidade: não envia dados pessoais (sem e-mail, IP ou conteúdo dos hábitos).
 */
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

type SentryLike = typeof import("@sentry/nextjs");
let sentry: Promise<SentryLike | null> | null = null;

/** Carrega e inicia o Sentry no navegador (uma vez). */
export function loadSentry(): Promise<SentryLike | null> {
  if (!DSN || typeof window === "undefined") return Promise.resolve(null);
  sentry ??= import("@sentry/nextjs").then((S) => {
    S.init({
      dsn: DSN,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
      // sem dados pessoais: padrão do SDK (não envia IP, cookies nem cabeçalhos de usuário)
      tracesSampleRate: 0.1,
      beforeSend(event) {
        // nunca mandar dados de pessoa: só o id pseudônimo, se houver
        if (event.user) event.user = event.user.id ? { id: event.user.id } : undefined;
        if (event.request) delete event.request.cookies;
        return event;
      },
    });
    return S;
  });
  return sentry;
}

export function captureError(error: unknown, contexto?: Record<string, unknown>) {
  console.error(error);
  void loadSentry().then((S) => S?.captureException(error, contexto ? { extra: contexto } : undefined));
}

/** Associa os erros ao id da conta (pseudônimo, sem e-mail). */
export function setMonitoringUser(id: string | null) {
  void loadSentry().then((S) => S?.setUser(id ? { id } : null));
}
