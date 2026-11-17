import type { SupabaseClient } from "@supabase/supabase-js";
import type { DaySummary, Habit, HabitLog, LifeArea, Profile, Task } from "../domain/types";
import {
  areaRow,
  areaToRow,
  habitRow,
  habitToRow,
  logRow,
  logToRow,
  profileRow,
  profileToRow,
  summaryToRow,
  taskRow,
  taskToRow,
} from "./mappers";
import type { Repository, Snapshot, UnlockedAchievement } from "./types";

class DataError extends Error {}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new DataError(res.error.message);
  return res.data;
}

/** PostgREST devolve no máximo 1000 linhas por requisição: pagina até acabar. */
async function fetchAll(
  query: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>,
): Promise<unknown[]> {
  const page = 1000;
  const out: unknown[] = [];
  for (let from = 0; ; from += page) {
    const rows = check(await query(from, from + page - 1)) ?? [];
    out.push(...rows);
    if (rows.length < page) return out;
  }
}

export class SupabaseRepository implements Repository {
  readonly kind = "supabase" as const;
  constructor(
    private readonly sb: SupabaseClient,
    private readonly userId: string,
  ) {}

  async load(): Promise<Snapshot> {
    const [p, areas, habits, tasks, logs, rest, conquistas] = await Promise.all([
      this.sb.from("profiles").select("*").eq("id", this.userId).single(),
      this.sb.from("life_areas").select("*").order("ordem"),
      this.sb.from("habits").select("*").order("criado_em"),
      fetchAll((a, b) => this.sb.from("tasks").select("*").order("data").range(a, b)),
      fetchAll((a, b) => this.sb.from("habit_logs").select("*").order("data").range(a, b)),
      this.sb.from("rest_days").select("data"),
      this.sb.from("achievements").select("codigo, conquistado_em"),
    ]);
    return {
      profile: profileRow.parse(check(p)),
      areas: parseRows(areaRow, check(areas)),
      habits: parseRows(habitRow, check(habits)),
      tasks: parseRows(taskRow, tasks),
      logs: parseRows(logRow, logs),
      restDays: (check(rest) ?? []).map((r: { data: string }) => r.data),
      achievements: (check(conquistas) ?? []).map((r: { codigo: string; conquistado_em: string }) => ({
        codigo: r.codigo,
        conquistadoEm: r.conquistado_em,
      })),
    };
  }

  async updateProfile(patch: Partial<Omit<Profile, "id" | "criadoEm">>) {
    check(await this.sb.from("profiles").update(profileToRow(patch)).eq("id", this.userId));
  }

  async replaceAreas(areas: LifeArea[]) {
    const ids = areas.map((a) => a.id);
    if (areas.length) {
      check(await this.sb.from("life_areas").upsert(areas.map((a) => areaToRow(a, this.userId))));
    }
    const del = this.sb.from("life_areas").delete().eq("user_id", this.userId);
    check(await (ids.length ? del.not("id", "in", `(${ids.join(",")})`) : del));
  }

  async upsertHabits(habits: Habit[]) {
    if (!habits.length) return;
    check(await this.sb.from("habits").upsert(habits.map((h) => habitToRow(h, this.userId))));
  }

  async deleteHabit(id: string) {
    check(await this.sb.from("habits").delete().eq("id", id));
  }

  async upsertTask(task: Task) {
    check(await this.sb.from("tasks").upsert(taskToRow(task, this.userId)));
  }

  async deleteTask(id: string) {
    check(await this.sb.from("tasks").delete().eq("id", id));
  }

  async upsertLog(log: HabitLog) {
    check(
      await this.sb.from("habit_logs").upsert(logToRow(log, this.userId), { onConflict: "habit_id,data" }),
    );
  }

  async deleteLog(habitId: string, data: string) {
    check(await this.sb.from("habit_logs").delete().eq("habit_id", habitId).eq("data", data));
  }

  async setRestDay(data: string, ativo: boolean) {
    if (ativo) {
      check(await this.sb.from("rest_days").upsert({ user_id: this.userId, data }));
    } else {
      check(await this.sb.from("rest_days").delete().eq("user_id", this.userId).eq("data", data));
    }
  }

  async saveSummaries(summaries: DaySummary[]) {
    if (!summaries.length) return;
    check(await this.sb.from("daily_summaries").upsert(summaries.map((s) => summaryToRow(s, this.userId))));
  }

  async addAchievements(list: UnlockedAchievement[]) {
    if (!list.length) return;
    check(
      await this.sb.from("achievements").upsert(
        list.map((x) => ({ user_id: this.userId, codigo: x.codigo, conquistado_em: x.conquistadoEm })),
        { onConflict: "user_id,codigo", ignoreDuplicates: true },
      ),
    );
  }

  /** Grava um snapshot inteiro (já com ids novos — ver remapForImport), em lotes. */
  async importAll(snap: Snapshot) {
    const lotes = <T>(rows: T[], size = 500) =>
      Array.from({ length: Math.ceil(rows.length / size) }, (_, i) => rows.slice(i * size, (i + 1) * size));
    if (snap.areas.length) await this.replaceAreas(snap.areas);
    for (const l of lotes(snap.habits.map((h) => habitToRow(h, this.userId)))) {
      check(await this.sb.from("habits").insert(l));
    }
    for (const l of lotes(snap.tasks.map((t) => taskToRow(t, this.userId)))) {
      check(await this.sb.from("tasks").insert(l));
    }
    for (const l of lotes(snap.logs.map((x) => logToRow(x, this.userId)))) {
      check(await this.sb.from("habit_logs").upsert(l, { onConflict: "habit_id,data" }));
    }
    if (snap.restDays.length) {
      check(
        await this.sb.from("rest_days").upsert(snap.restDays.map((data) => ({ user_id: this.userId, data }))),
      );
    }
    await this.addAchievements(snap.achievements);
    const p = snap.profile;
    await this.updateProfile({
      nome: p.nome,
      fuso: p.fuso,
      limiteSequencia: p.limiteSequencia,
      onboardingConcluido: p.onboardingConcluido,
      objetivo: p.objetivo,
      lembreteHorario: p.lembreteHorario,
    });
  }

  /** Exclui a conta (função delete_my_account no banco; o cascade apaga os dados). */
  async deleteAccount() {
    check(await this.sb.rpc("delete_my_account"));
    await this.sb.auth.signOut();
  }

  async signOut() {
    await this.sb.auth.signOut();
  }
}

function parseRows<T>(schema: { parse: (v: unknown) => T }, rows: unknown[] | null): T[] {
  return (rows ?? []).map((r) => schema.parse(r));
}
