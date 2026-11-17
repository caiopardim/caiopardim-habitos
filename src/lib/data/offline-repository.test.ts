import { describe, expect, it } from "vitest";
import { habit, log } from "../domain/test-helpers";
import { emptySnapshot } from "./local-repository";
import { OfflineFirstRepository, type KV } from "./offline-repository";
import type { Repository, Snapshot } from "./types";

function memoryKV(): KV & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    get: (k) => data.get(k) ?? null,
    set: (k, v) => void data.set(k, v),
    remove: (k) => void data.delete(k),
  };
}

/** Repositório falso: registra chamadas e pode simular rede fora do ar. */
function fakeInner() {
  const calls: string[] = [];
  let online = true;
  let rejeitar: string | null = null;
  const server: Snapshot = emptySnapshot();
  const op =
    (nome: string) =>
    async (...args: unknown[]) => {
      if (!online) throw new TypeError("Failed to fetch");
      if (rejeitar === nome) throw new Error("new row violates row-level security policy");
      calls.push(`${nome}:${String(JSON.stringify(args[0])).slice(0, 30)}`);
    };
  const inner = {
    kind: "supabase",
    load: async () => {
      if (!online) throw new TypeError("Failed to fetch");
      return structuredClone(server);
    },
    updateProfile: op("updateProfile"),
    replaceAreas: op("replaceAreas"),
    upsertHabits: op("upsertHabits"),
    deleteHabit: op("deleteHabit"),
    upsertTask: op("upsertTask"),
    deleteTask: op("deleteTask"),
    upsertLog: op("upsertLog"),
    deleteLog: op("deleteLog"),
    setRestDay: op("setRestDay"),
    saveSummaries: op("saveSummaries"),
    importAll: op("importAll"),
    deleteAccount: op("deleteAccount"),
    signOut: op("signOut"),
  } as unknown as Repository;
  return {
    inner,
    calls,
    server,
    setOnline: (v: boolean) => (online = v),
    rejeitar: (m: string | null) => (rejeitar = m),
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("conta offline", () => {
  it("online: grava na hora, em ordem", async () => {
    const f = fakeInner();
    const r = new OfflineFirstRepository(f.inner, "u1", memoryKV());
    await r.upsertLog(log("h", "2026-03-01"));
    await r.deleteLog("h", "2026-03-01");
    await r.flush();
    expect(f.calls.map((c) => c.split(":")[0])).toEqual(["upsertLog", "deleteLog"]);
    expect(r.status().pendentes).toBe(0);
  });

  it("offline: guarda na fila (sobrevive a fechar o app) e envia quando volta", async () => {
    const f = fakeInner();
    const kv = memoryKV();
    f.setOnline(false);
    const r1 = new OfflineFirstRepository(f.inner, "u1", kv);
    await r1.upsertLog(log("h", "2026-03-01"));
    await r1.setRestDay("2026-03-02", true);
    await tick();
    expect(r1.status().pendentes).toBe(2);

    // "fechou o app": nova instância lê a fila salva
    const r2 = new OfflineFirstRepository(f.inner, "u1", kv);
    expect(r2.status().pendentes).toBe(2);
    f.setOnline(true);
    await r2.flush();
    expect(f.calls.map((c) => c.split(":")[0])).toEqual(["upsertLog", "setRestDay"]);
    expect(r2.status().pendentes).toBe(0);
    expect(kv.data.has("zoryka:fila:u1")).toBe(false);
  });

  it("erro que não é de rede descarta só aquela operação", async () => {
    const f = fakeInner();
    const r = new OfflineFirstRepository(f.inner, "u1", memoryKV());
    f.rejeitar("upsertHabits");
    await r.upsertHabits([habit()]);
    await r.upsertLog(log("h", "2026-03-01"));
    await r.flush();
    expect(f.calls.map((c) => c.split(":")[0])).toEqual(["upsertLog"]);
    expect(r.status().erro).toMatch(/row-level/);
    expect(r.takeError()).toMatch(/row-level/);
    expect(r.status().erro).toBeNull();
    expect(r.status().pendentes).toBe(0);
  });

  it("sem conexão, abre com os dados guardados; sem cache, falha", async () => {
    const f = fakeInner();
    const kv = memoryKV();
    const r = new OfflineFirstRepository(f.inner, "u1", kv);
    const online = await r.load();
    expect(online.profile.id).toBe(f.server.profile.id);

    const local = { ...online, habits: [habit({ nome: "marcado offline" })] };
    r.remember(local);
    f.setOnline(false);
    expect((await r.load()).habits[0].nome).toBe("marcado offline");

    const semCache = new OfflineFirstRepository(f.inner, "outro", memoryKV());
    await expect(semCache.load()).rejects.toThrow("Failed to fetch");
  });

  it("ao voltar online, envia a fila antes de buscar do servidor", async () => {
    const f = fakeInner();
    const r = new OfflineFirstRepository(f.inner, "u1", memoryKV());
    f.setOnline(false);
    await r.upsertTask({
      id: "t",
      areaId: null,
      titulo: "x",
      prioridade: "media",
      dificuldade: "facil",
      data: "2026-03-01",
      concluida: true,
      concluidaEm: null,
    });
    await tick();
    f.setOnline(true);
    await r.load();
    expect(f.calls.map((c) => c.split(":")[0])).toEqual(["upsertTask"]);
  });

  it("servidor lento demais: usa o cache", async () => {
    const f = fakeInner();
    const kv = memoryKV();
    const r = new OfflineFirstRepository(f.inner, "u1", kv, 20);
    r.remember(emptySnapshot());
    (f.inner as { load: () => Promise<Snapshot> }).load = () => new Promise(() => undefined);
    await expect(r.load()).resolves.toBeTruthy();
  });

  it("sair apaga fila e cache do aparelho", async () => {
    const f = fakeInner();
    const kv = memoryKV();
    const r = new OfflineFirstRepository(f.inner, "u1", kv);
    r.remember(emptySnapshot());
    await r.signOut();
    expect(kv.data.size).toBe(0);
  });
});
