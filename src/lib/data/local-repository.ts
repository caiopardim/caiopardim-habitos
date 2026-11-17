import { DEFAULT_STREAK_THRESHOLD, DEFAULT_TIMEZONE } from "../config";
import { DEFAULT_NOTIFICATION_PREFS, type Profile } from "../domain/types";
import type { Repository, Snapshot } from "./types";

/** Dados do usuário no modo local (sem Supabase). Podem ser importados para uma conta. */
export const LOCAL_KEY = "zoryka:local:v1";
/** Chaves antigas do modo local, lidas uma vez e migradas para LOCAL_KEY. */
const LEGACY_KEYS = ["zoryka:demo:v1", "habitos:demo:v1"];
/** Demonstração com dados fictícios: armazenamento separado, nunca importado. */
export const DEMO_KEY = "zoryka:demonstracao:v1";

export function emptyProfile(): Profile {
  return {
    id: "local-user",
    nome: "",
    fuso: DEFAULT_TIMEZONE,
    limiteSequencia: DEFAULT_STREAK_THRESHOLD,
    xpTotal: 0,
    nivel: 1,
    onboardingConcluido: false,
    objetivo: null,
    lembreteHorario: null,
    notificacoes: { ...DEFAULT_NOTIFICATION_PREFS },
    criadoEm: new Date().toISOString(),
  };
}

export function emptySnapshot(): Snapshot {
  return { profile: emptyProfile(), areas: [], habits: [], tasks: [], logs: [], restDays: [] };
}

/** Completa snapshots salvos por versões antigas (campos novos ficam com o padrão). */
export function normalizeSnapshot(raw: Partial<Snapshot>): Snapshot {
  const base = emptySnapshot();
  return {
    profile: {
      ...base.profile,
      ...(raw.profile ?? {}),
      notificacoes: { ...base.profile.notificacoes, ...(raw.profile?.notificacoes ?? {}) },
    },
    areas: raw.areas ?? [],
    habits: (raw.habits ?? []).map((h) => ({ ...h, lembrete: h.lembrete ?? false })),
    tasks: raw.tasks ?? [],
    logs: raw.logs ?? [],
    restDays: raw.restDays ?? [],
  };
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Lê os dados do modo local (inclusive de chaves antigas), sem instanciar repositório. */
export function readLocalSnapshot(): Snapshot | null {
  const raw = safeGet(LOCAL_KEY) ?? LEGACY_KEYS.map(safeGet).find((v) => v !== null) ?? null;
  if (!raw) return null;
  try {
    return normalizeSnapshot(JSON.parse(raw) as Partial<Snapshot>);
  } catch {
    return null;
  }
}

export function clearLocalSnapshot() {
  try {
    for (const k of [LOCAL_KEY, ...LEGACY_KEYS]) window.localStorage.removeItem(k);
  } catch {
    // armazenamento indisponível
  }
}

/**
 * Repositório no localStorage deste navegador.
 * - kind "local": modo sem Supabase; os dados são do usuário.
 * - kind "demo": demonstração com dados fictícios (gerados na primeira abertura).
 */
export class LocalRepository implements Repository {
  private data: Snapshot = emptySnapshot();

  constructor(
    readonly kind: "local" | "demo" = "local",
    private readonly seed?: () => Snapshot,
  ) {}

  private get key() {
    return this.kind === "demo" ? DEMO_KEY : LOCAL_KEY;
  }

  private read(): Snapshot {
    if (this.kind === "local") {
      this.data = readLocalSnapshot() ?? this.data;
      return this.data;
    }
    const raw = safeGet(this.key);
    if (raw) {
      try {
        this.data = normalizeSnapshot(JSON.parse(raw) as Partial<Snapshot>);
        return this.data;
      } catch {
        // dado corrompido: gera de novo
      }
    }
    if (this.seed) {
      this.data = this.seed();
      this.write();
    }
    return this.data;
  }

  private write() {
    try {
      window.localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      // armazenamento indisponível (aba anônima etc.): segue só em memória
    }
  }

  private mutate(fn: (s: Snapshot) => void): Promise<void> {
    fn(this.data);
    this.write();
    return Promise.resolve();
  }

  load(): Promise<Snapshot> {
    return Promise.resolve(structuredClone(this.read()));
  }

  updateProfile(patch: Partial<Profile>) {
    return this.mutate((s) => {
      s.profile = { ...s.profile, ...patch };
    });
  }

  replaceAreas(areas: Snapshot["areas"]) {
    return this.mutate((s) => {
      s.areas = areas;
    });
  }

  upsertHabits(habits: Snapshot["habits"]) {
    return this.mutate((s) => {
      for (const h of habits) {
        const i = s.habits.findIndex((x) => x.id === h.id);
        if (i >= 0) s.habits[i] = h;
        else s.habits.push(h);
      }
    });
  }

  deleteHabit(id: string) {
    return this.mutate((s) => {
      s.habits = s.habits.filter((h) => h.id !== id);
      s.logs = s.logs.filter((l) => l.habitId !== id);
    });
  }

  upsertTask(task: Snapshot["tasks"][number]) {
    return this.mutate((s) => {
      const i = s.tasks.findIndex((x) => x.id === task.id);
      if (i >= 0) s.tasks[i] = task;
      else s.tasks.push(task);
    });
  }

  deleteTask(id: string) {
    return this.mutate((s) => {
      s.tasks = s.tasks.filter((t) => t.id !== id);
    });
  }

  upsertLog(log: Snapshot["logs"][number]) {
    return this.mutate((s) => {
      const i = s.logs.findIndex((l) => l.habitId === log.habitId && l.data === log.data);
      if (i >= 0) s.logs[i] = log;
      else s.logs.push(log);
    });
  }

  deleteLog(habitId: string, data: string) {
    return this.mutate((s) => {
      s.logs = s.logs.filter((l) => !(l.habitId === habitId && l.data === data));
    });
  }

  setRestDay(data: string, ativo: boolean) {
    return this.mutate((s) => {
      s.restDays = s.restDays.filter((d) => d !== data);
      if (ativo) s.restDays.push(data);
    });
  }

  saveSummaries() {
    // No navegador os resumos são sempre recalculados em memória.
    return Promise.resolve();
  }

  importAll(snapshot: Snapshot) {
    this.data = structuredClone(snapshot);
    this.write();
    return Promise.resolve();
  }

  /** Apaga os dados deste modo (local ou demonstração) neste navegador. */
  deleteAccount() {
    try {
      if (this.kind === "local") clearLocalSnapshot();
      else window.localStorage.removeItem(this.key);
    } catch {
      // idem
    }
    this.data = emptySnapshot();
    return Promise.resolve();
  }

  signOut() {
    return this.deleteAccount();
  }
}
