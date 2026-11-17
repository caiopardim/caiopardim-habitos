import { Lightbulb } from "lucide-react";
import type { Insight } from "@/lib/domain/insights";

export function InsightsCard({ insights }: { insights: Insight[] }) {
  return (
    <section aria-labelledby="insights" className="bg-card space-y-3 rounded-xl border p-4">
      <h2 id="insights" className="flex items-center gap-2 text-base font-bold">
        <Lightbulb className="text-primary size-5" aria-hidden />O que seus dados dizem
      </h2>
      {insights.length ? (
        <ul className="space-y-2.5">
          {insights.slice(0, 4).map((i) => (
            <li key={i.id} className="border-primary/60 border-l-2 pl-3 text-sm leading-relaxed">
              {i.texto}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Continue registrando: com algumas semanas de dados, os padrões da sua rotina aparecem aqui.
        </p>
      )}
      <p className="text-muted-foreground text-xs">Com base nos seus últimos 90 dias.</p>
    </section>
  );
}
