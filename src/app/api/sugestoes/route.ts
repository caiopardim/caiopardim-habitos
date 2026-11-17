import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const body = z.object({
  tipo: z.enum(["ideia", "problema", "elogio"]),
  texto: z
    .string()
    .trim()
    .min(5, "Escreva pelo menos 5 caracteres.")
    .max(1000, "Máximo de 1.000 caracteres."),
  pagina: z.string().max(100).optional(),
});

/** Sugestão enviada pelo app (a RLS garante que fica no nome de quem enviou). */
export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ erro: "sem conta" }, { status: 401 });
  }
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ erro: "sem conta" }, { status: 401 });

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { erro: parsed.error.issues[0]?.message ?? "Sugestão inválida." },
      { status: 400 },
    );
  }
  const { error } = await sb.from("sugestoes").insert({ ...parsed.data, user_id: user.id });
  if (error?.message.includes("limite")) {
    return NextResponse.json(
      { erro: "Você já enviou 5 sugestões hoje. Obrigado! Tente de novo amanhã." },
      { status: 429 },
    );
  }
  if (error) {
    console.error("Sugestão não gravada", error.message);
    return NextResponse.json({ erro: "Não foi possível enviar agora." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
