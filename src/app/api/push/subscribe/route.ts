import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const body = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Inscreve este aparelho para receber lembretes (a RLS garante que é do próprio usuário). */
export async function POST(req: NextRequest) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: "inscrição inválida" }, { status: 400 });
  const { endpoint, keys } = parsed.data;

  const { error } = await sb.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return NextResponse.json({ erro: error.message }, { status: 409 });
  return NextResponse.json({ ok: true });
}

/** Cancela a inscrição deste aparelho. */
export async function DELETE(req: NextRequest) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });
  const endpoint = z
    .string()
    .url()
    .safeParse((await req.json().catch(() => null))?.endpoint);
  if (!endpoint.success) return NextResponse.json({ erro: "endpoint inválido" }, { status: 400 });
  await sb.from("push_subscriptions").delete().eq("endpoint", endpoint.data);
  return NextResponse.json({ ok: true });
}
