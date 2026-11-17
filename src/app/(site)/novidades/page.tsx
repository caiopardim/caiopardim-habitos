import type { Metadata } from "next";
import Link from "next/link";
import { MarkNewsSeen } from "@/components/landing/mark-news-seen";
import { CHANGELOG } from "@/lib/changelog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const metadata: Metadata = {
  title: "Novidades",
  description: "O que mudou na Zoryka: novos recursos e melhorias.",
  alternates: { canonical: "/novidades" },
};

export default function NovidadesPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <MarkNewsSeen />
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Novidades</h1>
        <p className="text-muted-foreground">
          O que mudou na Zoryka. Tem uma ideia?{" "}
          <Link href="/suporte#sugestoes" className="text-xp font-medium underline underline-offset-4">
            Mande sua sugestão
          </Link>
          .
        </p>
      </header>
      <ol className="space-y-6">
        {CHANGELOG.map((n) => (
          <li key={n.id} className="bg-card space-y-3 rounded-2xl border p-5">
            <div>
              <time
                dateTime={n.data}
                className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                {format(new Date(`${n.data}T12:00:00`), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </time>
              <h2 className="text-lg font-bold">{n.titulo}</h2>
            </div>
            <ul className="space-y-1.5 text-sm">
              {n.itens.map((i) => (
                <li key={i} className="flex gap-2">
                  <span className="bg-brand-orange mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
