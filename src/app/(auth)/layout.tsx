import { APP_NAME } from "@/lib/config";
import { isSupabaseConfigured } from "@/lib/config";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-8 px-5 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="bg-primary text-primary-foreground grid size-14 place-items-center rounded-2xl text-2xl font-black">
          {APP_NAME.slice(0, 1)}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{APP_NAME}</h1>
        <p className="text-muted-foreground text-sm">Um dia ruim é uma queda no gráfico, não um recomeço.</p>
      </div>
      {isSupabaseConfigured ? (
        children
      ) : (
        <div className="bg-card space-y-4 rounded-xl border p-5 text-sm">
          <p className="font-semibold">Modo demonstração</p>
          <p className="text-muted-foreground">
            O Supabase ainda não está configurado (veja o README). Você pode usar o app com os dados salvos só
            neste navegador.
          </p>
          <Button asChild className="w-full">
            <Link href="/hoje">Entrar no modo demonstração</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
