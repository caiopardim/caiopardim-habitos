"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { DEFAULT_TIMEZONE, isSupabaseConfigured } from "@/lib/config";
import { hasMeaningfulData, remapForImport } from "@/lib/data/import";
import { persistResilient } from "@/lib/data/sync";
import { clearLocalSnapshot, LocalRepository, readLocalSnapshot } from "@/lib/data/local-repository";
import { OfflineFirstRepository, type SyncStatus } from "@/lib/data/offline-repository";
import { SupabaseRepository } from "@/lib/data/supabase-repository";
import type { RepoKind, Repository, Snapshot } from "@/lib/data/types";
import { generateDemoData } from "@/lib/demo/generate";
import { exitDemo, isDemoActive } from "@/lib/demo/mode";
import { canEditDate, todayInTz } from "@/lib/domain/dates";
import { computeDay, statusForValue } from "@/lib/domain/day";
import { computeHistory, indexLogsByDate, type History } from "@/lib/domain/stats";
import type {
  DateStr,
  DaySummary,
  Habit,
  HabitLog,
  LifeArea,
  LogStatus,
  Profile,
  Task,
} from "@/lib/domain/types";
import { newId } from "@/lib/utils";

type Status = "loading" | "ready" | "error";

interface AppData {
  status: Status;
  /** Fila de sincronização da conta (null nos modos local e demonstração). */
  sync: SyncStatus | null;
  repoKind: RepoKind | null;
  snapshot: Snapshot | null;
  today: DateStr;
  history: History | null;
  /** Resumo de qualquer dia (inclusive futuro, que não entra no histórico). */
  summaryFor: (date: DateStr) => DaySummary | null;
  logFor: (habitId: string, date: DateStr) => HabitLog | undefined;
  canEdit: (date: DateStr) => boolean;

  updateProfile: (patch: Partial<Omit<Profile, "id" | "criadoEm">>) => Promise<void>;
  /** Onboarding, etapa 1: grava perfil, áreas e hábitos (o usuário ainda faz o 1º check-in). */
  setupOnboarding: (input: {
    nome: string;
    fuso: string;
    objetivo: string | null;
    lembreteHorario: string | null;
    areas: LifeArea[];
    habits: Habit[];
  }) => Promise<void>;
  /** Onboarding, etapa final: libera o app. */
  finishOnboarding: () => Promise<void>;
  /** Dados salvos neste navegador (modo local) que podem ir para a conta. */
  localImport: Snapshot | null;
  importLocalData: () => Promise<void>;
  dismissLocalImport: () => void;
  setCheck: (habit: Habit, date: DateStr, done: boolean) => void;
  setQuantity: (habit: Habit, date: DateStr, valor: number) => void;
  setBadStatus: (habit: Habit, date: DateStr, status: "evitei" | "aconteceu" | null) => void;
  saveHabit: (habit: Habit) => Promise<void>;
  setArchived: (habit: Habit, arquivado: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  saveTask: (task: Task) => Promise<void>;
  toggleTask: (task: Task) => void;
  deleteTask: (id: string) => Promise<void>;
  toggleRestDay: (date: DateStr) => void;
  deleteAccount: () => Promise<void>;
  /** Registra medalhas conquistadas (ignora as que já existem). */
  addAchievements: (codigos: string[]) => void;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

const IMPORT_DISMISSED_KEY = "zoryka:importacao-recusada";

/**
 * Escolhe de onde vêm os dados: conta real (logado) → demonstração (cookie) → modo local
 * (sem Supabase). Sem nenhum dos três, retorna null e o usuário vai para o login.
 */
async function createRepository(): Promise<Repository | null> {
  if (isSupabaseConfigured) {
    // Carregado sob demanda: o cliente do Supabase não pesa nos modos local e demonstração.
    const { createClient } = await import("@/lib/supabase/client");
    const sb = createClient();
    // Sessão salva no aparelho: funciona sem internet (a RLS no banco continua garantindo o acesso).
    const {
      data: { session },
    } = await sb.auth.getSession();
    const user = session?.user;
    if (user) {
      if (isDemoActive()) exitDemo(); // entrou na conta: sai da demonstração
      return new OfflineFirstRepository(new SupabaseRepository(sb, user.id), user.id);
    }
  }
  if (isDemoActive()) {
    return new LocalRepository("demo", () =>
      generateDemoData({ userId: "demo-user", today: todayInTz(DEFAULT_TIMEZONE), newId }),
    );
  }
  if (!isSupabaseConfigured) return new LocalRepository("local");
  return null;
}

function importDismissed(): boolean {
  try {
    return window.localStorage.getItem(IMPORT_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const repoRef = useRef<Repository | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [localImport, setLocalImport] = useState<Snapshot | null>(null);
  const [sync, setSync] = useState<SyncStatus | null>(null);

  const reload = useCallback(async () => {
    try {
      const repo = repoRef.current ?? (await createRepository());
      if (!repo) {
        window.location.href = "/entrar";
        return;
      }
      repoRef.current = repo;
      const snap = await repo.load();
      // Conta nova + dados no navegador (modo local) → oferece importar.
      if (repo.kind === "supabase" && snap.habits.length === 0 && !importDismissed()) {
        const local = readLocalSnapshot();
        setLocalImport(hasMeaningfulData(local) ? local : null);
      } else {
        setLocalImport(null);
      }
      setSnapshot(snap);
      setStatus("ready");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Vira o dia sem precisar recarregar a página.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const fuso = snapshot?.profile.fuso ?? "America/Sao_Paulo";
  const today = todayInTz(fuso, now);

  const logsIdx = useMemo(() => indexLogsByDate(snapshot?.logs ?? []), [snapshot?.logs]);

  const history = useMemo(() => {
    if (!snapshot) return null;
    return computeHistory({
      habits: snapshot.habits,
      tasks: snapshot.tasks,
      logs: snapshot.logs,
      restDays: snapshot.restDays,
      limiteSequencia: snapshot.profile.limiteSequencia,
      start: todayInTz(fuso, new Date(snapshot.profile.criadoEm)),
      today,
    });
  }, [snapshot, fuso, today]);

  const summaryFor = useCallback(
    (date: DateStr) => {
      if (!snapshot) return null;
      return (
        history?.summaries.get(date) ??
        computeDay({
          date,
          habits: snapshot.habits,
          tasks: snapshot.tasks,
          logs: logsIdx.get(date) ?? new Map(),
          limiteSequencia: snapshot.profile.limiteSequencia,
        })
      );
    },
    [snapshot, history, logsIdx],
  );

  const logFor = useCallback((habitId: string, date: DateStr) => logsIdx.get(date)?.get(habitId), [logsIdx]);
  const canEdit = useCallback((date: DateStr) => canEditDate(date, today), [today]);

  // ── Offline: acompanha a fila, envia quando a conexão volta, guarda o estado no aparelho ──
  const offline =
    status === "ready" && repoRef.current instanceof OfflineFirstRepository ? repoRef.current : null;
  useEffect(() => {
    if (!offline) return;
    setSync(offline.status());
    const unsub = offline.subscribe((s) => {
      setSync(s);
      if (s.erro && offline.takeError()) {
        toast.error("Uma alteração foi recusada pelo servidor e foi desfeita.");
        void reload();
      }
    });
    const tentar = () => void offline.flush().catch(() => undefined);
    window.addEventListener("online", tentar);
    const t = setInterval(() => offline.status().pendentes && tentar(), 30_000);
    return () => {
      unsub();
      window.removeEventListener("online", tentar);
      clearInterval(t);
    };
  }, [offline, reload]);

  useEffect(() => {
    if (!offline || !snapshot) return;
    const t = setTimeout(() => offline.remember(snapshot), 400);
    return () => clearTimeout(t);
  }, [offline, snapshot]);

  // ── Persistência dos resumos diários e do XP (Supabase) ────────────────
  const savedRef = useRef<Map<DateStr, string> | null>(null);
  useEffect(() => {
    const repo = repoRef.current;
    if (!history || !repo || repo.kind !== "supabase") return;
    const key = (s: DaySummary) =>
      `${s.execucao}|${s.pontuacao}|${s.xpGanho}|${s.diaPerfeito}|${s.contaSequencia}`;
    if (!savedRef.current) {
      // Primeira carga: só registra o estado atual como referência.
      savedRef.current = new Map([...history.summaries].map(([d, s]) => [d, key(s)]));
      return;
    }
    const changed = [...history.summaries.values()].filter((s) => savedRef.current!.get(s.data) !== key(s));
    if (!changed.length) return;
    const t = setTimeout(() => {
      for (const s of changed) savedRef.current!.set(s.data, key(s));
      Promise.all([
        repo.saveSummaries(changed),
        repo.updateProfile({ xpTotal: history.xpTotal, nivel: history.level.nivel }),
      ]).catch((e) => console.error("Falha ao salvar resumos", e));
    }, 800);
    return () => clearTimeout(t);
  }, [history]);

  // ── Mutação otimista: aplica na hora, sincroniza em segundo plano ──────
  // As gravações passam por uma fila serial, para que toques rápidos (+/−)
  // cheguem ao banco na mesma ordem em que aconteceram.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const mutate = useCallback(
    (apply: (s: Snapshot) => Snapshot, persist: (repo: Repository) => Promise<void>) => {
      const repo = repoRef.current;
      if (!repo) return Promise.resolve();
      setSnapshot((s) => (s ? apply(s) : s));
      const job = queueRef.current.then(() =>
        persistResilient(() => persist(repo)).catch(async (e: unknown) => {
          console.error(e);
          toast.error("Não foi possível salvar. Verifique sua conexão.");
          await reload();
        }),
      );
      queueRef.current = job;
      return job;
    },
    [reload],
  );

  const upsertLogLocal = (s: Snapshot, log: HabitLog): Snapshot => ({
    ...s,
    logs: [...s.logs.filter((l) => !(l.habitId === log.habitId && l.data === log.data)), log],
  });
  const removeLogLocal = (s: Snapshot, habitId: string, data: DateStr): Snapshot => ({
    ...s,
    logs: s.logs.filter((l) => !(l.habitId === habitId && l.data === data)),
  });

  const writeLog = useCallback(
    (habit: Habit, date: DateStr, status: LogStatus | null, valor: number | null) => {
      if (!canEditDate(date, today)) {
        toast.error("Só é possível editar registros dos últimos 7 dias.");
        return;
      }
      if (status === null) {
        void mutate(
          (s) => removeLogLocal(s, habit.id, date),
          (r) => r.deleteLog(habit.id, date),
        );
        return;
      }
      const existing = logsIdx.get(date)?.get(habit.id);
      const log: HabitLog = {
        id: existing?.id ?? newId(),
        habitId: habit.id,
        data: date,
        status,
        valor,
        concluidoEm: status === "feito" || status === "evitei" ? new Date().toISOString() : null,
      };
      void mutate(
        (s) => upsertLogLocal(s, log),
        (r) => r.upsertLog(log),
      );
    },
    [logsIdx, mutate, today],
  );

  const value: AppData = {
    status,
    repoKind: repoRef.current?.kind ?? null,
    sync,
    snapshot,
    today,
    history,
    summaryFor,
    logFor,
    canEdit,
    reload,

    updateProfile: (patch) =>
      mutate(
        (s) => ({ ...s, profile: { ...s.profile, ...patch } }),
        (r) => r.updateProfile(patch),
      ),

    setupOnboarding: async ({ nome, fuso: novoFuso, objetivo, lembreteHorario, areas, habits }) => {
      const patch = { nome, fuso: novoFuso, objetivo, lembreteHorario };
      await mutate(
        (s) => ({
          ...s,
          profile: { ...s.profile, ...patch },
          areas,
          habits: [...s.habits, ...habits],
        }),
        async (r) => {
          await r.replaceAreas(areas);
          await r.upsertHabits(habits);
          await r.updateProfile(patch);
        },
      );
    },

    finishOnboarding: () =>
      mutate(
        (s) => ({ ...s, profile: { ...s.profile, onboardingConcluido: true } }),
        (r) => r.updateProfile({ onboardingConcluido: true }),
      ),

    localImport,

    importLocalData: async () => {
      const repo = repoRef.current;
      if (!repo || !snapshot || !localImport) return;
      const pronto = remapForImport(localImport, snapshot.profile.id, newId);
      await repo.importAll(pronto);
      clearLocalSnapshot();
      setLocalImport(null);
      await reload();
    },

    dismissLocalImport: () => {
      try {
        window.localStorage.setItem(IMPORT_DISMISSED_KEY, "1");
      } catch {
        // sem armazenamento: só esconde nesta sessão
      }
      setLocalImport(null);
    },

    setCheck: (habit, date, done) => writeLog(habit, date, done ? "feito" : null, null),

    setQuantity: (habit, date, valor) => {
      if (valor <= 0) return writeLog(habit, date, null, null);
      writeLog(habit, date, statusForValue(valor, habit.metaValor ?? 1), valor);
    },

    setBadStatus: (habit, date, st) => writeLog(habit, date, st, null),

    saveHabit: (habit) =>
      mutate(
        (s) => ({ ...s, habits: upsertById(s.habits, habit) }),
        (r) => r.upsertHabits([habit]),
      ),

    setArchived: (habit, arquivado) => {
      const h: Habit = { ...habit, arquivado, arquivadoEm: arquivado ? today : null };
      return mutate(
        (s) => ({ ...s, habits: upsertById(s.habits, h) }),
        (r) => r.upsertHabits([h]),
      );
    },

    deleteHabit: (id) =>
      mutate(
        (s) => ({
          ...s,
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habitId !== id),
        }),
        (r) => r.deleteHabit(id),
      ),

    saveTask: (task) =>
      mutate(
        (s) => ({ ...s, tasks: upsertById(s.tasks, task) }),
        (r) => r.upsertTask(task),
      ),

    toggleTask: (task) => {
      if (!canEditDate(task.data, today)) {
        toast.error(
          task.data > today ? "Essa tarefa é de um dia futuro." : "Só é possível editar os últimos 7 dias.",
        );
        return;
      }
      const t: Task = {
        ...task,
        concluida: !task.concluida,
        concluidaEm: task.concluida ? null : new Date().toISOString(),
      };
      void mutate(
        (s) => ({ ...s, tasks: upsertById(s.tasks, t) }),
        (r) => r.upsertTask(t),
      );
    },

    deleteTask: (id) =>
      mutate(
        (s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }),
        (r) => r.deleteTask(id),
      ),

    toggleRestDay: (date) => {
      const ativo = !snapshot?.restDays.includes(date);
      void mutate(
        (s) => ({ ...s, restDays: ativo ? [...s.restDays, date] : s.restDays.filter((d) => d !== date) }),
        (r) => r.setRestDay(date, ativo),
      );
    },

    addAchievements: (codigos) => {
      const ja = new Set(snapshot?.achievements.map((a) => a.codigo));
      const novas = codigos
        .filter((c) => !ja.has(c))
        .map((codigo) => ({ codigo, conquistadoEm: new Date().toISOString() }));
      if (!novas.length) return;
      void mutate(
        (s) => ({ ...s, achievements: [...s.achievements, ...novas] }),
        (r) => r.addAchievements(novas),
      );
    },

    deleteAccount: async () => {
      const kind = repoRef.current?.kind;
      await repoRef.current?.deleteAccount();
      if (kind === "demo") exitDemo();
      window.location.href = isSupabaseConfigured ? "/entrar?conta=excluida" : "/onboarding";
    },

    /** Conta: sai da sessão · Demonstração: sai e apaga os dados fictícios · Local: apaga os dados. */
    signOut: async () => {
      const kind = repoRef.current?.kind;
      await repoRef.current?.signOut();
      if (kind === "demo") exitDemo();
      window.location.href = isSupabaseConfigured ? "/entrar" : "/onboarding";
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i < 0) return [...list, item];
  const copy = [...list];
  copy[i] = item;
  return copy;
}

export function useAppData(): AppData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppData precisa estar dentro de <AppDataProvider>");
  return ctx;
}

/** Atalho para telas que só renderizam com dados carregados. */
export function useReadyData() {
  const d = useAppData();
  if (!d.snapshot || !d.history) throw new Error("Dados ainda não carregados");
  return { ...d, snapshot: d.snapshot, history: d.history };
}
