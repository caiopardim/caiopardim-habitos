import { NextResponse, type NextRequest } from "next/server";
import { runReminderCron } from "@/lib/push/cron";
import { adminClient, cronDeps, pushConfigured } from "@/lib/push/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Verifica e envia os lembretes devidos. Chamar a cada 15 minutos (Vercel Cron ou pg_cron),
 * com o cabeçalho "Authorization: Bearer <CRON_SECRET>".
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  if (!pushConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ erro: "push ou service role não configurados" }, { status: 503 });
  }
  const resultado = await runReminderCron(cronDeps(adminClient(), new Date()));
  return NextResponse.json(resultado);
}

export const POST = GET;
