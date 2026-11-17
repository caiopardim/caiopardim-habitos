import type { Snapshot } from "./types";

/** Resumo do que existe num snapshot, para a pergunta "importar para sua conta?". */
export function snapshotSummary(s: Snapshot) {
  const dias = new Set(s.logs.map((l) => l.data)).size;
  return { habitos: s.habits.length, registros: s.logs.length, tarefas: s.tasks.length, dias };
}

/** Há algo que valha a pena importar? */
export function hasMeaningfulData(s: Snapshot | null): s is Snapshot {
  return !!s && (s.habits.length > 0 || s.tasks.length > 0);
}

/**
 * Prepara dados do navegador para entrarem numa conta:
 * gera IDs novos (mantendo as referências) e adota o id do usuário no perfil.
 * IDs novos evitam conflito se os mesmos dados forem importados em mais de uma conta.
 */
export function remapForImport(s: Snapshot, userId: string, newId: () => string): Snapshot {
  const areaIds = new Map(s.areas.map((a) => [a.id, newId()]));
  const habitIds = new Map(s.habits.map((h) => [h.id, newId()]));
  const area = (id: string | null) => (id ? (areaIds.get(id) ?? null) : null);

  return {
    profile: { ...s.profile, id: userId },
    areas: s.areas.map((a) => ({ ...a, id: areaIds.get(a.id)! })),
    habits: s.habits.map((h) => ({ ...h, id: habitIds.get(h.id)!, areaId: area(h.areaId) })),
    tasks: s.tasks.map((t) => ({ ...t, id: newId(), areaId: area(t.areaId) })),
    // registros de hábitos que não existem mais são descartados
    logs: s.logs
      .filter((l) => habitIds.has(l.habitId))
      .map((l) => ({ ...l, id: newId(), habitId: habitIds.get(l.habitId)! })),
    restDays: [...new Set(s.restDays)],
    achievements: s.achievements ?? [],
  };
}
