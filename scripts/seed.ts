/**
 * Cria um usuário de exemplo no Supabase com 60 dias de histórico.
 * Uso: preencha .env.local (URL, SERVICE_ROLE_KEY, SEED_USER_*) e rode `npm run seed`.
 * Usa a mesma geração de dados do modo demonstração (src/lib/demo/generate.ts).
 */
import { config } from "dotenv";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { generateDemoData } from "../src/lib/demo/generate";
import { computeHistory } from "../src/lib/domain/stats";
import { todayInTz } from "../src/lib/domain/dates";
import { areaToRow, habitToRow, logToRow, summaryToRow, taskToRow } from "../src/lib/data/mappers";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SEED_USER_EMAIL;
const password = process.env.SEED_USER_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_USER_EMAIL e SEED_USER_PASSWORD no .env.local",
  );
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

async function must<T>(
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
  what: string,
): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

async function main() {
  // Recria o usuário do zero (o cascade apaga os dados antigos).
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  const old = list?.users.find((u) => u.email === email);
  if (old) {
    const { error } = await sb.auth.admin.deleteUser(old.id);
    if (error) throw new Error(`apagar usuário antigo: ${error.message}`);
  }

  const { data: created, error: createError } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nome: "Visitante" },
  });
  const user = created.user;
  if (createError || !user) throw new Error(`criar usuário: ${createError?.message ?? "sem retorno"}`);

  const today = todayInTz("America/Sao_Paulo");
  const demo = generateDemoData({ userId: user.id, today, newId: randomUUID, nome: "Visitante" });
  const hist = computeHistory({
    ...demo,
    limiteSequencia: demo.profile.limiteSequencia,
    start: demo.habits[0].inicio,
    today,
  });

  await must(
    sb
      .from("profiles")
      .update({
        nome: demo.profile.nome,
        onboarding_concluido: true,
        xp_total: hist.xpTotal,
        nivel: hist.level.nivel,
        criado_em: demo.profile.criadoEm,
      })
      .eq("id", user.id),
    "perfil",
  );
  await must(sb.from("life_areas").insert(demo.areas.map((a) => areaToRow(a, user.id))), "áreas");
  await must(sb.from("habits").insert(demo.habits.map((h) => habitToRow(h, user.id))), "hábitos");
  await must(sb.from("tasks").insert(demo.tasks.map((t) => taskToRow(t, user.id))), "tarefas");
  await must(sb.from("habit_logs").insert(demo.logs.map((l) => logToRow(l, user.id))), "registros");
  await must(
    sb.from("rest_days").insert(demo.restDays.map((data) => ({ user_id: user.id, data }))),
    "descansos",
  );
  await must(
    sb.from("daily_summaries").insert([...hist.summaries.values()].map((s) => summaryToRow(s, user.id))),
    "resumos",
  );

  console.log(
    `✔ Seed pronto: ${email} — ${demo.logs.length} registros, nível ${hist.level.nivel}, ${hist.xpTotal} XP.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
