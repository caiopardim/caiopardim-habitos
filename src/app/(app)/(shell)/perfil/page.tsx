"use client";

import Link from "next/link";
import { BedDouble, ChevronRight, Settings, Trophy } from "lucide-react";
import { AvatarCard } from "@/components/avatar/avatar-card";
import { Medal } from "@/components/gamification/medal";
import { RestDayInfo } from "@/components/gamification/rest-day-info";
import { useGamification } from "@/components/gamification/use-gamification";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { addDays, weekStart } from "@/lib/domain/dates";
import { SEASON_STATUS_LABEL } from "@/lib/domain/seasons";
import { validRestDays } from "@/lib/domain/streak";
import { formatLongDate } from "@/lib/format-date";

export default function PerfilPage() {
  const { snapshot, history, today } = useReadyData();
  const { medalhas, temporadas } = useGamification();
  const { level, streak, xpTotal, diasPerfeitos } = history;

  const stats = [
    { label: "XP total", value: xpTotal.toLocaleString("pt-BR") },
    { label: "Sequência atual", value: `${streak.atual} d` },
    { label: "Melhor sequência", value: `${streak.melhor} d` },
    { label: "Dias perfeitos", value: diasPerfeitos },
  ];

  // Medalhas: as conquistadas mais recentes primeiro
  const datas = new Map(snapshot.achievements.map((a) => [a.codigo, a.conquistadoEm]));
  const conquistadas = medalhas
    .filter((m) => m.desbloqueada)
    .sort((a, b) => (datas.get(b.def.codigo) ?? "").localeCompare(datas.get(a.def.codigo) ?? ""));
  const proxima = medalhas.filter((m) => !m.desbloqueada).sort((a, b) => b.progresso - a.progresso)[0];

  // Descanso desta semana
  const ws = weekStart(today);
  const descansoSemana = [...validRestDays(snapshot.restDays)].find((d) => d >= ws && d <= addDays(ws, 6));

  return (
    <div className="space-y-4">
      <PageHeader
        title={snapshot.profile.nome || "Perfil"}
        subtitle="Seu progresso"
        action={
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/configuracoes" aria-label="Configurações">
              <Settings />
            </Link>
          </Button>
        }
      />
      <AvatarCard />

      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Nível</p>
            <p className="text-xp text-4xl font-bold tabular-nums">{level.nivel}</p>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums">
            {level.xpNoNivel} / {level.xpDoNivel} XP
          </p>
        </div>
        <Progress
          value={level.progresso * 100}
          indicatorClassName="bg-brand-gradient"
          className="mt-3"
          aria-label="Progresso do nível"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border p-3.5">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Temporadas */}
      <section aria-labelledby="temporadas" className="bg-card space-y-3 rounded-xl border p-4">
        <h2 id="temporadas" className="flex items-center gap-2 text-base font-bold">
          <Trophy className="text-primary size-5" aria-hidden />
          Temporadas
        </h2>
        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Atual", temporadas.atual.numero],
            ["Recorde", temporadas.recorde],
            ["Concluídas", temporadas.concluidas],
          ].map(([l, v]) => (
            <div key={String(l)} className="bg-muted rounded-lg p-2">
              <dt className="text-muted-foreground text-[11px]">{l}</dt>
              <dd className="text-xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground text-sm">
          Temporada {temporadas.atual.numero}: dia {Math.min(temporadas.atual.dia, 7)} de 7 ·{" "}
          {SEASON_STATUS_LABEL[temporadas.atual.status]} · meta média ≥ {temporadas.atual.meta}
        </p>
        {temporadas.historico.length > 0 && (
          <ol className="flex flex-wrap gap-1.5" aria-label="Últimas temporadas">
            {temporadas.historico.slice(-10).map((t) => (
              <li
                key={t.inicio}
                title={`Temporada ${t.numero} (${SEASON_STATUS_LABEL[t.status]}) — média ${t.media === null ? "—" : Math.round(t.media)} / meta ${t.meta}`}
                className={
                  t.status === "concluida"
                    ? "bg-brand-orange text-primary-foreground grid size-8 place-items-center rounded-full text-xs font-bold"
                    : "bg-muted text-muted-foreground grid size-8 place-items-center rounded-full text-xs font-bold"
                }
              >
                {t.numero}
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Medalhas */}
      <section aria-labelledby="medalhas" className="bg-card space-y-3 rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <h2 id="medalhas" className="text-base font-bold">
            Medalhas{" "}
            <span className="text-muted-foreground text-sm font-normal">
              {conquistadas.length} de {medalhas.length}
            </span>
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/conquistas">
              Ver todas <ChevronRight />
            </Link>
          </Button>
        </div>
        {conquistadas.length ? (
          <ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Medalhas conquistadas">
            {conquistadas.slice(0, 6).map((m) => (
              <li key={m.def.codigo}>
                <Medal conteudo={m.def.emoji} size={56} label={m.def.nome} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            Conclua sua primeira missão para ganhar a primeira medalha.
          </p>
        )}
        {proxima && (
          <div className="bg-muted flex items-center gap-3 rounded-lg p-2.5">
            <Medal conteudo={proxima.def.emoji} bloqueada size={40} />
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm">
                Próxima: <strong>{proxima.def.nome}</strong>
                <span className="text-muted-foreground"> · {proxima.def.descricao}</span>
              </p>
              <Progress
                value={proxima.progresso * 100}
                indicatorClassName="bg-brand-gradient"
                className="h-1.5"
              />
            </div>
          </div>
        )}
      </section>

      {/* Proteção de sequência */}
      <section aria-labelledby="protecao" className="bg-card flex items-start gap-3 rounded-xl border p-4">
        <BedDouble className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1">
          <h2 id="protecao" className="text-base font-bold">
            Proteção de sequência
          </h2>
          <p className="text-muted-foreground text-sm">
            {descansoSemana
              ? `Descanso desta semana usado: ${formatLongDate(descansoSemana).toLowerCase()}.`
              : "Seu dia de descanso desta semana está disponível."}
          </p>
          <RestDayInfo />
        </div>
      </section>
    </div>
  );
}
