import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { habit, log, task } from "../domain/test-helpers";
import { emptySnapshot, LocalRepository, LOCAL_KEY, DEMO_KEY, readLocalSnapshot } from "./local-repository";

/** localStorage em memória (o Vitest roda em Node). */
function instalarStorage() {
  const m = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
      removeItem: (k: string) => void m.delete(k),
    },
  };
  return m;
}

describe("repositório no navegador", () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = instalarStorage();
  });
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("grava e lê hábitos, registros, tarefas, descansos e medalhas", async () => {
    const r = new LocalRepository("local");
    const h = habit({ id: "h1" });
    await r.upsertHabits([h]);
    await r.upsertHabits([{ ...h, nome: "Renomeado" }]);
    await r.upsertLog(log("h1", "2026-03-01"));
    await r.upsertLog(log("h1", "2026-03-01", { status: "parcial" })); // mesmo dia: substitui
    await r.upsertTask(task({ id: "t1" }));
    await r.setRestDay("2026-03-02", true);
    await r.addAchievements([{ codigo: "seq_7", conquistadoEm: "x" }]);
    await r.addAchievements([{ codigo: "seq_7", conquistadoEm: "y" }]); // não duplica
    await r.updateProfile({ nome: "Ana" });

    const s = await new LocalRepository("local").load();
    expect(s.habits.map((x) => x.nome)).toEqual(["Renomeado"]);
    expect(s.logs).toHaveLength(1);
    expect(s.logs[0].status).toBe("parcial");
    expect(s.tasks).toHaveLength(1);
    expect(s.restDays).toEqual(["2026-03-02"]);
    expect(s.achievements).toEqual([{ codigo: "seq_7", conquistadoEm: "x" }]);
    expect(s.profile.nome).toBe("Ana");

    await r.deleteLog("h1", "2026-03-01");
    await r.deleteTask("t1");
    await r.setRestDay("2026-03-02", false);
    await r.deleteHabit("h1");
    const vazio = await r.load();
    expect([vazio.habits.length, vazio.logs.length, vazio.tasks.length, vazio.restDays.length]).toEqual([
      0, 0, 0, 0,
    ]);
  });

  it("migra a chave antiga do modo local", () => {
    store.set("habitos:demo:v1", JSON.stringify({ profile: { nome: "Antigo" }, habits: [habit()] }));
    const s = readLocalSnapshot();
    expect(s?.profile.nome).toBe("Antigo");
    expect(s?.habits[0].lembrete).toBe(false);
    expect(s?.achievements).toEqual([]);
  });

  it("demonstração usa outra chave, gera os dados na 1ª abertura e não toca no modo local", async () => {
    store.set(
      LOCAL_KEY,
      JSON.stringify({ ...emptySnapshot(), profile: { ...emptySnapshot().profile, nome: "Real" } }),
    );
    const demo = new LocalRepository("demo", () => ({
      ...emptySnapshot(),
      habits: [habit({ nome: "Fictício" })],
    }));
    expect((await demo.load()).habits[0].nome).toBe("Fictício");
    expect(store.has(DEMO_KEY)).toBe(true);
    await demo.signOut();
    expect(store.has(DEMO_KEY)).toBe(false);
    expect(readLocalSnapshot()?.profile.nome).toBe("Real");
  });

  it("apagar dados do modo local limpa tudo", async () => {
    const r = new LocalRepository("local");
    await r.upsertHabits([habit()]);
    await r.deleteAccount();
    expect(store.has(LOCAL_KEY)).toBe(false);
    expect((await r.load()).habits).toEqual([]);
  });

  it("dado corrompido na demonstração é gerado de novo", async () => {
    store.set(DEMO_KEY, "{não é json");
    const demo = new LocalRepository("demo", () => ({
      ...emptySnapshot(),
      habits: [habit({ nome: "Novo" })],
    }));
    expect((await demo.load()).habits[0].nome).toBe("Novo");
  });
});
