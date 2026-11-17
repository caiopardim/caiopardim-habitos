/**
 * Métricas de produto (PostHog), respeitando a LGPD:
 * - nada é carregado nem enviado sem consentimento explícito;
 * - sem gravação de sessão nem captura automática de textos digitados;
 * - a pessoa é identificada só pelo id da conta (pseudônimo), nunca por e-mail ou nome.
 */

export type Evento =
  | "cadastro"
  | "onboarding_concluido"
  | "primeiro_checkin"
  | "dia_ativo"
  | "habito_criado"
  | "lembretes_ativados"
  | "app_instalado"
  | "dados_exportados"
  | "conta_excluida"
  | "demo_iniciada";

export type Consentimento = "aceito" | "recusado" | null;

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";
const CONSENT_KEY = "zoryka:consentimento-analytics";
const DIA_ATIVO_KEY = "zoryka:ultimo-dia-ativo";

type PostHog = (typeof import("posthog-js"))["default"];
let ph: Promise<PostHog | null> | null = null;
const listeners = new Set<() => void>();

export const analyticsConfigured = () => Boolean(KEY);

export function getConsent(): Consentimento {
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: "aceito" | "recusado") {
  try {
    window.localStorage.setItem(CONSENT_KEY, v);
  } catch {
    // sem armazenamento: vale só nesta sessão
  }
  if (v === "aceito") void load();
  else void ph?.then((p) => p?.opt_out_capturing());
  listeners.forEach((l) => l());
}

export function onConsentChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function load(): Promise<PostHog | null> {
  if (!KEY || typeof window === "undefined" || getConsent() !== "aceito") return Promise.resolve(null);
  ph ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(KEY, {
      api_host: HOST,
      person_profiles: "identified_only",
      autocapture: false,
      capture_pageview: true,
      disable_session_recording: true,
      mask_all_text: true,
      persistence: "localStorage",
      ip: false,
    } as Parameters<typeof posthog.init>[1]);
    posthog.opt_in_capturing();
    return posthog;
  });
  return ph;
}

export function track(evento: Evento, props?: Record<string, string | number | boolean>) {
  if (!KEY || getConsent() !== "aceito") return;
  void load().then((p) => p?.capture(evento, props));
}

/** Liga os eventos à conta (id pseudônimo) — base dos gráficos de retenção D1/D7/D30. */
export function identify(userId: string | null) {
  if (!KEY || getConsent() !== "aceito") return;
  void load().then((p) => (userId ? p?.identify(userId) : p?.reset()));
}

/** "dia_ativo" no máximo uma vez por dia (do fuso do usuário). */
export function trackDiaAtivo(dia: string) {
  try {
    if (window.localStorage.getItem(DIA_ATIVO_KEY) === dia) return;
    window.localStorage.setItem(DIA_ATIVO_KEY, dia);
  } catch {
    // segue sem deduplicar
  }
  track("dia_ativo", { dia });
}
