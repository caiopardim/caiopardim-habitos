import type { DateStr, DaySummary, Habit, HabitLog, LifeArea, Profile, Task } from "../domain/types";
import { isNetworkError } from "./sync";
import type { Repository, Snapshot, UnlockedAchievement } from "./types";

/** Armazenamento chave-valor (localStorage no navegador; um Map nos testes). */
export interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const browserKV: KV = {
  get: (k) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      // cheio ou indisponível: segue só em memória
    }
  },
  remove: (k) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // idem
    }
  },
};

/** Operações que podem esperar na fila (todas com argumentos serializáveis). */
type QueuedOp =
  | { m: "updateProfile"; a: [Partial<Omit<Profile, "id" | "criadoEm">>] }
  | { m: "replaceAreas"; a: [LifeArea[]] }
  | { m: "upsertHabits"; a: [Habit[]] }
  | { m: "deleteHabit"; a: [string] }
  | { m: "upsertTask"; a: [Task] }
  | { m: "deleteTask"; a: [string] }
  | { m: "upsertLog"; a: [HabitLog] }
  | { m: "deleteLog"; a: [string, DateStr] }
  | { m: "setRestDay"; a: [DateStr, boolean] }
  | { m: "saveSummaries"; a: [DaySummary[]] }
  | { m: "addAchievements"; a: [UnlockedAchievement[]] };

export interface SyncStatus {
  pendentes: number;
  sincronizando: boolean;
  /** Última falha que não é de rede (a operação foi descartada). */
  erro: string | null;
}

/**
 * Conta com funcionamento offline:
 * - As gravações entram numa fila salva no aparelho e são enviadas em ordem. Sem conexão,
 *   continuam na fila (inclusive se o app for fechado) e saem quando a internet volta.
 * - O último estado dos dados fica guardado no aparelho: sem conexão, o app abre com ele.
 */
export class OfflineFirstRepository implements Repository {
  readonly kind = "supabase" as const;
  private queue: QueuedOp[];
  private flushing: Promise<void> | null = null;
  private listeners = new Set<(s: SyncStatus) => void>();
  private erro: string | null = null;

  constructor(
    private readonly inner: Repository,
    private readonly userId: string,
    private readonly kv: KV = browserKV,
    private readonly loadTimeoutMs = 8000,
  ) {
    this.queue = this.readQueue();
  }

  private get queueKey() {
    return `zoryka:fila:${this.userId}`;
  }
  private get cacheKey() {
    return `zoryka:cache:${this.userId}`;
  }

  private readQueue(): QueuedOp[] {
    try {
      return JSON.parse(this.kv.get(this.queueKey) ?? "[]") as QueuedOp[];
    } catch {
      return [];
    }
  }

  private saveQueue() {
    if (this.queue.length) this.kv.set(this.queueKey, JSON.stringify(this.queue));
    else this.kv.remove(this.queueKey);
    this.emit();
  }

  status(): SyncStatus {
    return { pendentes: this.queue.length, sincronizando: this.flushing !== null, erro: this.erro };
  }

  /** Lê e limpa o último erro (para avisar o usuário uma vez). */
  takeError(): string | null {
    const e = this.erro;
    this.erro = null;
    if (e) this.emit();
    return e;
  }

  subscribe(fn: (s: SyncStatus) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit() {
    const s = this.status();
    for (const fn of this.listeners) fn(s);
  }

  /** Guarda o estado atual (já com as mudanças otimistas) para abrir offline. */
  remember(snapshot: Snapshot) {
    this.kv.set(this.cacheKey, JSON.stringify(snapshot));
  }

  cached(): Snapshot | null {
    try {
      const raw = this.kv.get(this.cacheKey);
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  }

  /**
   * Envia a fila em ordem. Para no primeiro erro de rede (tenta de novo depois);
   * erro que não é de rede (ex.: dado rejeitado pelo banco) descarta a operação e segue.
   */
  flush(): Promise<void> {
    if (this.flushing) return this.flushing;
    if (!this.queue.length) return Promise.resolve();
    this.flushing = (async () => {
      this.emit();
      try {
        while (this.queue.length) {
          const op = this.queue[0];
          try {
            await (this.inner[op.m] as (...args: unknown[]) => Promise<void>)(...op.a);
          } catch (e) {
            if (isNetworkError(e)) throw e;
            console.error("Operação descartada da fila", op.m, e);
            this.erro = e instanceof Error ? e.message : String(e);
          }
          this.queue.shift();
          this.saveQueue();
        }
      } finally {
        this.flushing = null;
        this.emit();
      }
    })();
    return this.flushing;
  }

  private enqueue(op: QueuedOp): Promise<void> {
    this.queue.push(op);
    this.saveQueue();
    // Tenta enviar já; falha de rede fica para depois (a mudança está salva na fila).
    this.flush().catch(() => undefined);
    return Promise.resolve();
  }

  /**
   * Online: envia o que estava pendente e busca os dados do servidor.
   * Sem conexão (ou servidor lento demais): abre com os dados guardados no aparelho.
   */
  async load(): Promise<Snapshot> {
    try {
      await this.flush();
      const snap = await withTimeout(this.inner.load(), this.loadTimeoutMs);
      // Algo foi marcado enquanto carregava? Mantém a versão local até sincronizar.
      if (this.queue.length) return this.cached() ?? snap;
      this.remember(snap);
      return snap;
    } catch (e) {
      const cache = this.cached();
      if (cache && (isNetworkError(e) || e instanceof TimeoutError)) return cache;
      throw e;
    }
  }

  updateProfile(patch: Partial<Omit<Profile, "id" | "criadoEm">>) {
    return this.enqueue({ m: "updateProfile", a: [patch] });
  }
  replaceAreas(areas: LifeArea[]) {
    return this.enqueue({ m: "replaceAreas", a: [areas] });
  }
  upsertHabits(habits: Habit[]) {
    return this.enqueue({ m: "upsertHabits", a: [habits] });
  }
  deleteHabit(id: string) {
    return this.enqueue({ m: "deleteHabit", a: [id] });
  }
  upsertTask(task: Task) {
    return this.enqueue({ m: "upsertTask", a: [task] });
  }
  deleteTask(id: string) {
    return this.enqueue({ m: "deleteTask", a: [id] });
  }
  upsertLog(log: HabitLog) {
    return this.enqueue({ m: "upsertLog", a: [log] });
  }
  deleteLog(habitId: string, data: DateStr) {
    return this.enqueue({ m: "deleteLog", a: [habitId, data] });
  }
  setRestDay(data: DateStr, ativo: boolean) {
    return this.enqueue({ m: "setRestDay", a: [data, ativo] });
  }
  saveSummaries(summaries: DaySummary[]) {
    return this.enqueue({ m: "saveSummaries", a: [summaries] });
  }
  addAchievements(list: UnlockedAchievement[]) {
    return this.enqueue({ m: "addAchievements", a: [list] });
  }

  // Estas precisam de conexão e acontecem na hora.
  async importAll(snapshot: Snapshot) {
    await this.flush();
    await this.inner.importAll(snapshot);
  }
  async deleteAccount() {
    await this.inner.deleteAccount();
    this.clearLocal();
  }
  async signOut() {
    await this.flush().catch(() => undefined);
    await this.inner.signOut();
    this.clearLocal();
  }

  /** Apaga cache e fila deste usuário do aparelho (ao sair ou excluir a conta). */
  clearLocal() {
    this.queue = [];
    this.kv.remove(this.queueKey);
    this.kv.remove(this.cacheKey);
    this.emit();
  }
}

export class TimeoutError extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError("tempo esgotado")), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
