import type { DateStr, DaySummary, Habit, HabitLog, LifeArea, Profile, Task } from "../domain/types";

export interface Snapshot {
  profile: Profile;
  areas: LifeArea[];
  habits: Habit[];
  tasks: Task[];
  logs: HabitLog[];
  restDays: DateStr[];
}

/**
 * Acesso a dados. Há duas implementações:
 * - Supabase (produção; RLS garante que cada usuário só vê os próprios dados)
 * - Local (modo demonstração, sem Supabase configurado; salva no navegador)
 */
export interface Repository {
  readonly kind: "supabase" | "local";
  load(): Promise<Snapshot>;
  updateProfile(patch: Partial<Omit<Profile, "id" | "criadoEm">>): Promise<void>;
  replaceAreas(areas: LifeArea[]): Promise<void>;
  upsertHabits(habits: Habit[]): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  upsertTask(task: Task): Promise<void>;
  deleteTask(id: string): Promise<void>;
  upsertLog(log: HabitLog): Promise<void>;
  deleteLog(habitId: string, data: DateStr): Promise<void>;
  setRestDay(data: DateStr, ativo: boolean): Promise<void>;
  saveSummaries(summaries: DaySummary[]): Promise<void>;
  /** Substitui tudo pelos dados informados (usado para carregar o exemplo). */
  importAll?(snapshot: Snapshot): Promise<void>;
  signOut(): Promise<void>;
}
