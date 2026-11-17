import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendNotification, setVapidDetails } from "web-push";
import { habitRow, logRow, profileRow, taskRow } from "../data/mappers";
import type { Reminder } from "../domain/reminders";
import type { DateStr } from "../domain/types";
import type { CronDeps, PushPayload, PushSub } from "./cron";

/** Chaves VAPID (gere com: npx web-push generate-vapid-keys). */
export function pushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
}

let vapidOk = false;
function ensureVapid() {
  if (vapidOk) return;
  setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  vapidOk = true;
}

/** Envia um push. "expirada" = o aparelho cancelou (404/410): a assinatura deve ser apagada. */
export async function sendPush(sub: Pick<PushSub, "endpoint" | "p256dh" | "auth">, payload: PushPayload) {
  ensureVapid();
  try {
    await sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      {
        TTL: 60 * 60,
        urgency: "normal",
        topic: payload.tag.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32) || undefined,
      },
    );
    return "ok" as const;
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "expirada" as const;
    console.error("Falha no push", status, e);
    return "erro" as const;
  }
}

/** Cliente com a service role: só no servidor, ignora a RLS. */
export function adminClient(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function rows<T>(
  res: { data: unknown[] | null; error: { message: string } | null },
  parse: (r: unknown) => T,
): T[] {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []).map(parse);
}

/** Acesso real ao banco para o cron de lembretes. */
export function cronDeps(sb: SupabaseClient, now: Date): CronDeps {
  return {
    now,
    async listSubscriptions() {
      const res = await sb.from("push_subscriptions").select("user_id, endpoint, p256dh, auth");
      return rows(res, (r) => {
        const x = r as { user_id: string; endpoint: string; p256dh: string; auth: string };
        return { userId: x.user_id, endpoint: x.endpoint, p256dh: x.p256dh, auth: x.auth };
      });
    },
    async loadUser(userId) {
      const [p, h] = await Promise.all([
        sb.from("profiles").select("*").eq("id", userId).maybeSingle(),
        sb.from("habits").select("*").eq("user_id", userId),
      ]);
      if (p.error) throw new Error(p.error.message);
      if (!p.data) return null;
      return { profile: profileRow.parse(p.data), habits: rows(h, (r) => habitRow.parse(r)) };
    },
    async loadDays(userId, from: DateStr, to: DateStr) {
      const [logs, tasks, rest, sent] = await Promise.all([
        sb.from("habit_logs").select("*").eq("user_id", userId).gte("data", from).lte("data", to),
        sb.from("tasks").select("*").eq("user_id", userId).gte("data", from).lte("data", to),
        sb.from("rest_days").select("data").eq("user_id", userId).gte("data", from).lte("data", to),
        sb.from("notification_log").select("tipo, ref").eq("user_id", userId).eq("data", to),
      ]);
      return {
        logs: rows(logs, (r) => logRow.parse(r)),
        tasks: rows(tasks, (r) => taskRow.parse(r)),
        restDays: rows(rest, (r) => (r as { data: string }).data),
        sent: rows(sent, (r) => r as { tipo: string; ref: string }),
      };
    },
    send: sendPush,
    async removeSubscription(endpoint) {
      await sb.from("push_subscriptions").delete().eq("endpoint", endpoint);
    },
    async logSent(userId, date, reminders: Reminder[]) {
      const res = await sb.from("notification_log").upsert(
        reminders.map((r) => ({ user_id: userId, data: date, tipo: r.tipo, ref: r.ref })),
        { onConflict: "user_id,data,tipo,ref", ignoreDuplicates: true },
      );
      if (res.error) throw new Error(res.error.message);
    },
  };
}
