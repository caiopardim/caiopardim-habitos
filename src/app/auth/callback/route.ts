import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retorno do Supabase Auth (Google, confirmação de e-mail, recuperação de senha). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/hoje";
  // Só permite redirecionar para caminhos internos.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/hoje";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
