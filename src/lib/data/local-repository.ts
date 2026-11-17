import { DEFAULT_STREAK_THRESHOLD, DEFAULT_TIMEZONE } from "../config";
import type { Profile } from "../domain/types";
import type { Repository, Snapshot } from "./types";

const KEY = "zoryka:demo:v1";
/** Chave antiga (antes do nome Zoryka): migrada na primeira leitura. */
const OLD_KEY = "habitos:demo:v1";

function emptySnapshot(): Snapshot {
  const profile: Profile = {
    id: "demo-user",
    nome: "",
    fuso: DEFAULT_TIMEZONE,
    limiteSequencia: DEFAULT_STREAK_THRESHOLD,
    xpTotal: 0,
    nivel: 1,
    onboardingConcluido: false,
    criadoEm: new Date().toISOString(),
  };
  return { profile, areas: [], habits: [], tasks: [], logs: [], restDays: [] };
}

/** Modo demonstração: tudo fica no localStorage deste navegador. */
export class LocalRepository implements Repository {
  readonly kind = "local" as const;
  private data: Snapshot = emptySnapshot();

  private read(): Snapshot {
    try {
      const raw = window.localStorage.getItem(KEY) ?? window.localStorage.getItem(OLD_KEY);
      if (raw) this.data = JSON.parse(raw) as Snapshot;
    } catch {
      // armazenamento indisponível (aba anônima etc.): segue só em memória
    }
    return this.data;
  }

  private write() {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch {
      // idem
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
    // No modo local os resumos são sempre recalculados em memória.
    return Promise.resolve();
  }

  importAll(snapshot: Snapshot) {
    this.data = structuredClone(snapshot);
    this.write();
    return Promise.resolve();
  }

  signOut() {
    try {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(OLD_KEY);
    } catch {
      // idem
    }
    this.data = emptySnapshot();
    return Promise.resolve();
  }
}
