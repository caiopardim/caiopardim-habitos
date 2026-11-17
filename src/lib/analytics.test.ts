import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();
const init = vi.fn();
vi.mock("posthog-js", () => ({
  default: {
    init,
    capture,
    identify: vi.fn(),
    reset: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

function instalarStorage() {
  const m = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    },
  };
}

async function carregar() {
  vi.resetModules();
  return import("./analytics");
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("analytics (LGPD)", () => {
  beforeEach(() => {
    instalarStorage();
    capture.mockClear();
    init.mockClear();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as { window?: unknown }).window;
  });

  it("sem chave configurada, nada acontece", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const a = await carregar();
    a.setConsent("aceito");
    a.track("cadastro");
    await flush();
    expect(init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("sem consentimento, nada é carregado nem enviado", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_teste");
    const a = await carregar();
    expect(a.getConsent()).toBeNull();
    a.track("cadastro");
    await flush();
    expect(init).not.toHaveBeenCalled();
    a.setConsent("recusado");
    a.track("cadastro");
    await flush();
    expect(capture).not.toHaveBeenCalled();
  });

  it("com consentimento: inicia sem captura automática nem gravação de tela e envia", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_teste");
    const a = await carregar();
    a.setConsent("aceito");
    a.track("habito_criado", { tipo: "bom" });
    await flush();
    await flush();
    expect(init).toHaveBeenCalledTimes(1);
    expect(init.mock.calls[0][1]).toMatchObject({ autocapture: false, disable_session_recording: true });
    expect(capture).toHaveBeenCalledWith("habito_criado", { tipo: "bom" });
  });

  it("dia ativo é enviado no máximo uma vez por dia", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_teste");
    const a = await carregar();
    a.setConsent("aceito");
    a.trackDiaAtivo("2026-03-10");
    a.trackDiaAtivo("2026-03-10");
    a.trackDiaAtivo("2026-03-11");
    await flush();
    await flush();
    expect(capture.mock.calls.filter((c) => c[0] === "dia_ativo")).toHaveLength(2);
  });
});
