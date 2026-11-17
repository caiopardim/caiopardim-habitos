import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { SEASON_DAYS, SEASON_STATUS_LABEL, type CurrentSeason } from "@/lib/domain/seasons";
import { cn } from "@/lib/utils";

const STATUS_STYLE = {
  em_andamento: "bg-muted text-muted-foreground",
  no_caminho: "bg-success/15 text-success",
  em_risco: "bg-danger/15 text-danger",
  concluida: "bg-success/15 text-success",
  nao_atingida: "bg-danger/15 text-danger",
} as const;

export function SeasonCard({ season }: { season: CurrentSeason }) {
  const dia = Math.min(season.dia, SEASON_DAYS);
  return (
    <section aria-labelledby="temporada" className="bg-card space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="temporada" className="flex items-center gap-2 text-base font-bold">
          <Trophy className="text-primary size-4" aria-hidden />
          Temporada {season.numero}
          <span className="text-muted-foreground text-sm font-normal">
            · dia {dia} de {SEASON_DAYS}
          </span>
        </h2>
        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", STATUS_STYLE[season.status])}>
          {SEASON_STATUS_LABEL[season.status]}
        </span>
      </div>
      <Progress
        value={(dia / SEASON_DAYS) * 100}
        className="h-1.5"
        aria-label={`Dia ${dia} de ${SEASON_DAYS}`}
      />
      <p className="text-muted-foreground text-sm">
        Meta: média da pontuação ≥ <strong className="text-foreground">{season.meta}</strong>
        {season.media !== null && (
          <>
            {" "}
            · sua média: <strong className="text-foreground">{Math.round(season.media)}</strong>
          </>
        )}
      </p>
    </section>
  );
}
