import { NextResponse } from "next/server";
import { pushConfigured, sendPush } from "@/lib/push/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Manda uma notificação de teste para os aparelhos do próprio usuário. */
export async function POST() {
  if (!pushConfigured())
    return NextResponse.json({ erro: "push não configurado no servidor" }, { status: 503 });
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "não autenticado" }, { status: 401 });

  const { data, error } = await sb.from("push_subscriptions").select("endpoint, p256dh, auth");
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  let enviados = 0;
  for (const s of data ?? []) {
    const r = await sendPush(s, {
      title: "Lembretes ativados ✨",
      body: "É assim que a Zoryka vai te lembrar. Um dia de cada vez.",
      url: "/hoje",
      tag: "teste",
    });
    if (r === "ok") enviados += 1;
    if (r === "expirada") await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
  }
  return NextResponse.json({ enviados });
}
