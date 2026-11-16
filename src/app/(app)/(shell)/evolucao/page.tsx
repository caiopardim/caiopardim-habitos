"use client";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { averageScore } from "@/lib/domain/day";
import { addDays } from "@/lib/domain/dates";

export default function EvolucaoPage() {
  const { history, today } = useReadyData();
  const ultimos = [...history.summaries.values()].filter(
    (s) => s.data > addDays(today, -7) && s.data < today,
  );
  const media = averageScore(ultimos);
  return (
    <div className="space-y-4">
      <PageHeader title="Evolução" subtitle="Seus dados para aprender e ajustar" />
      <div className="bg-card rounded-xl border p-4">
        <p className="text-muted-foreground text-xs">Média da Pontuação do Dia · últimos 7 dias</p>
        <p className="text-3xl font-bold tabular-nums">{media === null ? "—" : Math.round(media)}</p>
      </div>
      <ComingSoon
        fase="Fase 2"
        itens={[
          "Gráfico da Pontuação do Dia ao longo do tempo",
          "Evolução por hábito e sucesso nos maus hábitos",
          "Radar por área da vida",
          "Heatmap anual de constância",
          "Filtros de período (7 dias, 30 dias, 3 meses, 1 ano, personalizado)",
        ]}
      />
    </div>
  );
}
