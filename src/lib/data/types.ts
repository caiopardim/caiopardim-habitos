import type { Assinatura, Pagamento } from "../domain/billing";
import type { DateStr, DaySummary, Habit, HabitLog, LifeArea, Profile, Task } from "../domain/types";

export interface Snapshot {
  profile: Profile;
  areas: LifeArea[];
  habits: Habit[];
  tasks: Task[];
  logs: HabitLog[];
  restDays: DateStr[];
  /** Medalhas conquistadas (permanentes). */
  achievements: UnlockedAchievement[];
  /**
   * Plano da conta (só no modo conta). Ausente = sem controle de planos (local, demonstração
   * ou tabela ainda não criada): tudo liberado.
   */
  billing?: { assinatura: Assinatura; pagamentos: Pagamento[] } | null;
}

export interface UnlockedAchievement {
  codigo: string;
  conquistadoEm: string;
}

/**
 * Acesso a dados. Implementações:
 * - SupabaseRepository: conta real (RLS garante que cada usuário só vê os próprios dados)
 * - LocalRepository "local": sem Supabase configurado; dados do usuário neste navegador
 * - LocalRepository "demo": demonstração com dados fictícios, separada de tudo
 */
export type RepoKind = "supabase" | "local" | "demo";

export interface Repository {
  /** supabase = conta real · local = sem Supabase, dados no navegador · demo = demonstração fictícia */
  readonly kind: RepoKind;
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
  addAchievements(list: UnlockedAchievement[]): Promise<void>;
  /** Grava um snapshot inteiro (importação de dados do navegador para a conta). */
  importAll(snapshot: Snapshot): Promise<void>;
  /** Exclui a conta e todos os dados (no navegador: apaga os dados locais). */
  deleteAccount(): Promise<void>;
  signOut(): Promise<void>;
}
