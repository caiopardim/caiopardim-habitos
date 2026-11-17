/** Sincronização resiliente: offline espera a conexão voltar; falha de rede tenta de novo. */

export interface SyncEnv {
  isOnline: () => boolean;
  waitOnline: () => Promise<void>;
  sleep: (ms: number) => Promise<void>;
}

export const browserSyncEnv: SyncEnv = {
  isOnline: () => typeof navigator === "undefined" || navigator.onLine,
  waitOnline: () =>
    typeof navigator === "undefined" || navigator.onLine
      ? Promise.resolve()
      : new Promise((resolve) => window.addEventListener("online", () => resolve(), { once: true })),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
};

export function isNetworkError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /failed to fetch|fetch failed|network|load failed|timeout|ECONNRESET/i.test(msg);
}

/**
 * Executa `fn` até dar certo, em caso de problema de rede (até `maxRetries` novas tentativas,
 * com espera crescente). Erros que não são de rede (ex.: RLS, validação) sobem na hora.
 */
export async function persistResilient(
  fn: () => Promise<void>,
  env: SyncEnv = browserSyncEnv,
  maxRetries = 5,
) {
  for (let tentativa = 0; ; tentativa++) {
    await env.waitOnline();
    try {
      return await fn();
    } catch (e) {
      const rede = isNetworkError(e) || !env.isOnline();
      if (rede && tentativa < maxRetries) {
        await env.sleep(1000 * 2 ** tentativa);
        continue;
      }
      throw e;
    }
  }
}
