import { describe, expect, it, vi } from "vitest";
import { isNetworkError, persistResilient, type SyncEnv } from "./sync";

function env(over: Partial<SyncEnv> = {}): SyncEnv {
  return {
    isOnline: () => true,
    waitOnline: () => Promise.resolve(),
    sleep: () => Promise.resolve(),
    ...over,
  };
}

describe("sincronização resiliente", () => {
  it("reconhece erros de rede", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("TypeError: Load failed"))).toBe(true);
    expect(isNetworkError(new Error("new row violates row-level security policy"))).toBe(false);
  });

  it("tenta de novo em falha de rede até dar certo", async () => {
    const fn = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce();
    const sleep = vi.fn(() => Promise.resolve());
    await persistResilient(fn, env({ sleep }));
    expect(fn).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c) => (c as unknown as [number])[0])).toEqual([1000, 2000]);
  });

  it("erro que não é de rede sobe na hora", async () => {
    const fn = vi.fn<() => Promise<void>>().mockRejectedValue(new Error("violates row-level security"));
    await expect(persistResilient(fn, env())).rejects.toThrow("row-level");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("offline: espera a conexão voltar antes de gravar", async () => {
    const ordem: string[] = [];
    const fn = vi.fn(async () => {
      ordem.push("gravou");
    });
    await persistResilient(
      fn,
      env({
        waitOnline: async () => {
          ordem.push("esperou conexão");
        },
      }),
    );
    expect(ordem).toEqual(["esperou conexão", "gravou"]);
  });

  it("desiste depois do limite de tentativas", async () => {
    const fn = vi.fn<() => Promise<void>>().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(persistResilient(fn, env(), 2)).rejects.toThrow("Failed to fetch");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
