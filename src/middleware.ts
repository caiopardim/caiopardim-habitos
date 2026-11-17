import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/entrar", "/cadastro", "/recuperar-senha", "/auth", "/demo", "/offline"];
const DEMO_COOKIE = "zoryka_demo";

/** Renova a sessão do Supabase e protege as rotas do app. */
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sem Supabase configurado o app roda em modo local (dados no navegador).
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

  // Modo demonstração: sem conta, com dados fictícios no navegador.
  const demo = request.cookies.get(DEMO_COOKIE)?.value === "1";

  if (!user && !isPublic && !demo) {
    const to = request.nextUrl.clone();
    to.pathname = "/entrar";
    to.search = "";
    return NextResponse.redirect(to);
  }
  if (user && (path === "/entrar" || path === "/cadastro")) {
    const to = request.nextUrl.clone();
    to.pathname = "/hoje";
    return NextResponse.redirect(to);
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|splash/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
