import { ZorykaLogo } from "@/components/brand/logo";
import { APP_NAME, APP_TAGLINE, isSupabaseConfigured } from "@/lib/config";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="sr-only">{APP_NAME}</h1>
        <ZorykaLogo className="text-3xl" markClassName="h-11" />
        <p className="text-muted-foreground text-sm">{APP_TAGLINE}</p>
      </div>
      {isSupabaseConfigured ? (
        <>
          {children}
          <p className="text-muted-foreground text-center text-sm">
            Quer conhecer antes?{" "}
            <Link href="/demo" className="text-foreground font-semibold underline-offset-4 hover:underline">
              Ver demonstração
            </Link>
          </p>
        </>
      ) : (
        <div className="bg-card space-y-4 rounded-xl border p-5 text-sm">
          <p className="font-semibold">Modo local</p>
          <p className="text-muted-foreground">
            As contas ainda não estão configuradas (veja o README). Você pode usar o app com os dados salvos
            só neste navegador.
          </p>
          <Button asChild className="w-full">
            <Link href="/hoje">Começar</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/demo">Ver demonstração</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
