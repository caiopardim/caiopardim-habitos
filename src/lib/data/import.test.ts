import { describe, expect, it } from "vitest";
import { habit, log, task } from "../domain/test-helpers";
import { emptySnapshot, normalizeSnapshot } from "./local-repository";
import { hasMeaningfulData, remapForImport, snapshotSummary } from "./import";
import type { Snapshot } from "./types";

function sample(): Snapshot {
  const s = emptySnapshot();
  s.areas = [{ id: "a1", nome: "Saúde", cor: "#000", ordem: 0, emFoco: true }];
  const h = habit({ id: "h1", areaId: "a1" });
  s.habits = [h];
  s.logs = [log("h1", "2026-03-01"), log("h1", "2026-03-02"), log("apagado", "2026-03-02")];
  s.tasks = [task({ id: "t1", areaId: "a1" }), task({ id: "t2", areaId: "nao-existe" })];
  s.restDays = ["2026-03-03", "2026-03-03"];
  return s;
}

describe("importação de dados do navegador", () => {
  it("gera ids novos mantendo as referências", () => {
    let n = 0;
    const r = remapForImport(sample(), "user-1", () => `n${++n}`);
    expect(r.profile.id).toBe("user-1");
    const areaId = r.areas[0].id;
    expect(areaId).not.toBe("a1");
    expect(r.habits[0].areaId).toBe(areaId);
    expect(r.habits[0].id).not.toBe("h1");
    expect(r.logs.every((l) => l.habitId === r.habits[0].id)).toBe(true);
    expect(r.tasks[0].areaId).toBe(areaId);
    expect(r.tasks[1].areaId).toBeNull();
    const ids = [...r.areas, ...r.habits, ...r.tasks, ...r.logs].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("descarta registros órfãos e descansos repetidos", () => {
    const r = remapForImport(sample(), "u", () => crypto.randomUUID());
    expect(r.logs).toHaveLength(2);
    expect(r.restDays).toEqual(["2026-03-03"]);
  });

  it("resume e detecta dados relevantes", () => {
    expect(snapshotSummary(sample())).toEqual({ habitos: 1, registros: 3, tarefas: 2, dias: 2 });
    expect(hasMeaningfulData(emptySnapshot())).toBe(false);
    expect(hasMeaningfulData(null)).toBe(false);
    expect(hasMeaningfulData(sample())).toBe(true);
  });

  it("completa snapshots antigos com os campos novos do perfil", () => {
    const antigo = { profile: { nome: "Ana", onboardingConcluido: true } } as unknown as Partial<Snapshot>;
    const s = normalizeSnapshot(antigo);
    expect(s.profile).toMatchObject({
      nome: "Ana",
      onboardingConcluido: true,
      objetivo: null,
      lembreteHorario: null,
    });
    expect(s.logs).toEqual([]);
  });
});
