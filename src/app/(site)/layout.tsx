import Link from "next/link";
import { ZorykaLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE, isSupabaseConfigured } from "@/lib/config";

/** Páginas públicas: início, suporte e novidades. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <header className="bg-background/85 sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="inline-flex min-h-11 items-center" aria-label={`${APP_NAME} — início`}>
            <ZorykaLogo markClassName="h-6" />
          </Link>
          <nav aria-label="Principal" className="flex items-center gap-1">
            <Link
              href="/#precos"
              className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center px-3 text-sm font-medium sm:inline-flex"
            >
              Preços
            </Link>
            <Link
              href="/#faq"
              className="text-muted-foreground hover:text-foreground hidden min-h-11 items-center px-3 text-sm font-medium sm:inline-flex"
            >
              Dúvidas
            </Link>
            {isSupabaseConfigured && (
              <Button variant="ghost" asChild>
                <Link href="/entrar">Entrar</Link>
              </Button>
            )}
            <Button asChild>
              <Link href={isSupabaseConfigured ? "/cadastro" : "/hoje"}>Começar grátis</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main id="conteudo" className="flex-1">
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-sm sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <ZorykaLogo markClassName="h-5" />
            <p className="text-muted-foreground">{APP_TAGLINE}.</p>
            <p className="text-muted-foreground text-xs">
              A {APP_NAME} não substitui acompanhamento médico ou psicológico. Precisa conversar? CVV: 188
              (gratuito, 24h).
            </p>
          </div>
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-6 sm:grid-cols-1">
            {[
              ["/suporte", "Suporte"],
              ["/novidades", "Novidades"],
              ["/privacidade", "Privacidade"],
              ["/termos", "Termos de uso"],
            ].map(([href, rotulo]) => (
              <Link
                key={href}
                href={href}
                className="text-muted-foreground hover:text-foreground inline-flex min-h-11 items-center"
              >
                {rotulo}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
