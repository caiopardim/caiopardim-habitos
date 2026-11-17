"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AreaBars } from "@/components/evolution/area-bars";
import { InsightsCard } from "@/components/evolution/insights-card";
import { PeriodPicker } from "@/components/evolution/period-picker";
import { WeeklyReviewCard } from "@/components/evolution/weekly-review-card";
import { HEAT_FILL, YearHeatmap } from "@/components/evolution/year-heatmap";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { areaStats } from "@/lib/domain/areas";
import { addDays, weekStart } from "@/lib/domain/dates";
import { percentChange } from "@/lib/domain/day";
import {
  avoidStats,
  bucketize,
  daysWithRecords,
  habitStats,
  mean,
  periodRange,
  periodSummary,
  previousPeriod,
  scoreSeries,
  yearHeatmap,
  type HeatCell,
  type PeriodPreset,
} from "@/lib/domain/evolution";
import { buildInsights, isReviewDay, reviewRef, weeklyReview } from "@/lib/domain/insights";
import { indexLogsByDate } from "@/lib/domain/stats";
import type { DateStr, HabitLog } from "@/lib/domain/types";
import { formatShortDate } from "@/lib/format-date";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

// Gráficos sob demanda: Recharts só baixa quando a Evolução abre.
const chartSkeleton = () => <Skeleton className="h-52 w-full" />;
const ScoreChart = dynamic(() => import("@/components/evolution/charts").then((m) => m.ScoreChart), {
  ssr: false,
  loading: chartSkeleton,
});
const HabitBarChart = dynamic(() => import("@/components/evolution/charts").then((m) => m.HabitBarChart), {
  ssr: false,
  loading: chartSkeleton,
});

const MIN_DIAS = 3;
const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const nomeMes = (ym: string) => MESES[Number(ym.slice(5, 7)) - 1];

/** "11 de nov – 17 de nov"; com o ano quando o período atravessa anos. */
function formatRange(from: DateStr, to: DateStr): string {
  if (from === to) return formatShortDate(from);
  const ano = from.slice(0, 4) !== to.slice(0, 4);
  const f = (d: DateStr) => (ano ? `${formatShortDate(d)} de ${d.slice(0, 4)}` : formatShortDate(d));
  return `${f(from)} – ${f(to)}`;
}

function Card({
  id,
  title,
  children,
  extra,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="bg-card space-y-4 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id={id} className="text-base font-bold">
          {title}
        </h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

function Tile({
  label,
  value,
  children,
}: {
  label: string;
  value: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border p-3.5">
      <p className="text-muted-foreground text-xs font-medium">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {children}
    </div>
  );
}

function Variacao({ v }: { v: number | null }) {
  if (v === null) return <p className="text-muted-foreground text-xs">sem período anterior</p>;
  const r = Math.round(v);
  const Icon = r > 0 ? ArrowUpRight : r < 0 ? ArrowDownRight : Minus;
  return (
    <p
      className={cn(
        "flex items-center gap-0.5 text-xs font-semibold",
        r > 0 ? "text-success" : r < 0 ? "text-danger" : "text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {r > 0 ? "+" : ""}
      {r}% <span className="text-muted-foreground font-normal">vs. anterior</span>
    </p>
  );
}

export default function EvolucaoPage() {
  const { snapshot, history, today } = useReadyData();
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [custom, setCustom] = useState({ from: addDays(today, -13), to: today });
  const [habitoId, setHabitoId] = useState<string>("geral");

  // /evolucao?habito=<id> abre direto na evolução de um hábito (link da tela Hábitos)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("habito");
    if (id && snapshot.habits.some((h) => h.id === id)) {
      setHabitoId(id);
      requestAnimationFrame(() => document.getElementById("por-habito")?.scrollIntoView({ block: "start" }));
    }
  }, [snapshot.habits]);

  const periodo = useMemo(() => periodRange(preset, today, custom), [preset, today, custom]);
  const anterior = useMemo(() => previousPeriod(periodo), [periodo]);
  const umDia = periodo.dias === 1;

  const { summaries } = history;
  const resumo = useMemo(
    () =>
      periodSummary({
        summaries,
        habits: snapshot.habits,
        logs: snapshot.logs,
        tasks: snapshot.tasks,
        period: periodo,
        emAndamento: today,
      }),
    [summaries, snapshot, periodo, today],
  );
  const mediaAnterior = useMemo(
    () => mean(scoreSeries(summaries, anterior).map((p) => p.pontuacao)),
    [summaries, anterior],
  );

  const serie = useMemo(() => {
    const pts = scoreSeries(summaries, periodo, today);
    if (pts.length <= 92) return { porSemana: false, dados: pts };
    // período longo: média semanal (linha mais legível)
    const sem = new Map<DateStr, (number | null)[]>();
    for (const p of pts) sem.set(weekStart(p.data), [...(sem.get(weekStart(p.data)) ?? []), p.pontuacao]);
    return {
      porSemana: true,
      dados: [...sem.entries()].map(([data, v]) => ({ data, pontuacao: mean(v) })),
    };
  }, [summaries, periodo, today]);

  const logsPorHabito = useMemo(() => {
    const m = new Map<string, HabitLog[]>();
    for (const l of snapshot.logs) m.set(l.habitId, [...(m.get(l.habitId) ?? []), l]);
    return m;
  }, [snapshot.logs]);
  const logsByDate = useMemo(() => indexLogsByDate(snapshot.logs), [snapshot.logs]);

  const bons = snapshot.habits.filter((h) => h.tipo === "bom");
  const visaoGeral = useMemo(
    () =>
      bons
        .map((h) => ({ habit: h, stats: habitStats(h, logsPorHabito.get(h.id) ?? [], periodo) }))
        .filter((x) => x.stats.previstos > 0)
        .sort((a, b) => (b.stats.taxa ?? 0) - (a.stats.taxa ?? 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot.habits, logsPorHabito, periodo],
  );
  const habito = snapshot.habits.find((h) => h.id === habitoId && h.tipo === "bom") ?? null;
  const statsHabito = useMemo(
    () => (habito ? habitStats(habito, logsPorHabito.get(habito.id) ?? [], periodo) : null),
    [habito, logsPorHabito, periodo],
  );
  const heatHabito = useMemo(() => {
    if (!habito) return null;
    const ano = habitStats(habito, logsPorHabito.get(habito.id) ?? [], periodRange("1a", today));
    const porDia = new Map(ano.dias.map((d) => [d.data, d]));
    const base = yearHeatmap(new Map(), today);
    return base.semanas.map((col) =>
      col.map((c): HeatCell | null => {
        if (!c) return null;
        const d = porDia.get(c.data);
        const nivel =
          !d?.previsto || d.progresso === 0 ? 0 : d.progresso >= 1 ? 4 : d.progresso >= 0.5 ? 3 : 2;
        return { data: c.data, nivel, pontuacao: d ? Math.round(d.progresso * 100) : null };
      }),
    );
  }, [habito, logsPorHabito, today]);

  const evitar = useMemo(() => avoidStats(snapshot.habits, snapshot.logs, periodo), [snapshot, periodo]);
  const areas = useMemo(
    () =>
      areaStats({
        habits: snapshot.habits,
        tasks: snapshot.tasks,
        logsByDate,
        from: periodo.from,
        to: periodo.to,
      }),
    [snapshot, logsByDate, periodo],
  );
  const heat = useMemo(() => yearHeatmap(summaries, today), [summaries, today]);
  const insights = useMemo(
    () =>
      buildInsights({
        habits: snapshot.habits.filter((h) => !h.arquivado),
        logs: snapshot.logs,
        summaries,
        from: addDays(today, -89),
        to: today,
        fuso: snapshot.profile.fuso,
        mediaAtual: resumo.mediaPontuacao,
        mediaAnterior,
      }),
    [snapshot, summaries, today, resumo.mediaPontuacao, mediaAnterior],
  );
  const revisao = useMemo(
    () => weeklyReview({ habits: snapshot.habits, logs: snapshot.logs, summaries, ref: reviewRef(today) }),
    [snapshot, summaries, today],
  );

  const diasComRegistro = daysWithRecords(snapshot.logs, snapshot.tasks);
  if (diasComRegistro < MIN_DIAS) {
    return (
      <div className="space-y-4">
        <PageHeader title="Evolução" subtitle="Seus dados para aprender e ajustar" />
        <EmptyState
          title={`Registre ${MIN_DIAS} dias para ver seu primeiro gráfico`}
          action={
            <Button asChild>
              <Link href="/hoje">Registrar hoje</Link>
            </Button>
          }
        >
          {diasComRegistro === 0
            ? "Marque seus hábitos na tela Hoje. Em poucos dias, sua evolução aparece aqui."
            : `Você já tem ${diasComRegistro} de ${MIN_DIAS}. Falta pouco!`}
        </EmptyState>
      </div>
    );
  }

  const unidade = habito?.metaTipo === "quantidade" ? (habito.unidade ?? "") : "dias";
  const barras = statsHabito
    ? bucketize(statsHabito.dias.map((d) => ({ data: d.data, valor: d.valor })))
    : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Evolução" subtitle="Registre → revise → aprenda → ajuste" />
      <PeriodPicker value={preset} onChange={setPreset} custom={custom} onCustom={setCustom} today={today} />
      <p className="text-muted-foreground -mt-2 text-xs">{formatRange(periodo.from, periodo.to)}</p>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Tile
          label={umDia ? "Pontuação do Dia" : "Média da pontuação"}
          value={resumo.mediaPontuacao === null ? "—" : Math.round(resumo.mediaPontuacao)}
        >
          <Variacao v={percentChange(resumo.mediaPontuacao, mediaAnterior)} />
        </Tile>
        <Tile
          label="Dias registrados"
          value={umDia ? (resumo.diasRegistrados ? "Sim" : "Não") : resumo.diasRegistrados}
        >
          {!umDia && <p className="text-muted-foreground text-xs">de {periodo.dias}</p>}
        </Tile>
        <Tile label="Missões concluídas" value={resumo.missoesConcluidas} />
        <Tile label="XP ganho" value={<span className="text-xp">+{formatNumber(resumo.xpGanho)}</span>}>
          {resumo.diasPerfeitos > 0 && (
            <p className="text-muted-foreground text-xs">
              {resumo.diasPerfeitos} {resumo.diasPerfeitos === 1 ? "dia perfeito" : "dias perfeitos"}
            </p>
          )}
        </Tile>
      </div>

      <WeeklyReviewCard review={revisao} destaque={isReviewDay(today)} />
      <InsightsCard insights={insights} />

      {!umDia && (
        <Card id="pontuacao" title="Pontuação do Dia">
          <ScoreChart data={serie.dados} media={resumo.mediaPontuacao} porSemana={serie.porSemana} />
          <p className="text-muted-foreground text-xs">
            {serie.porSemana ? "Média por semana. " : ""}Hoje entra no gráfico quando o dia terminar.
          </p>
          <details className="text-sm">
            <summary className="text-muted-foreground cursor-pointer text-xs">Ver como tabela</summary>
            <table className="mt-2 w-full text-left text-xs">
              <thead>
                <tr className="text-muted-foreground">
                  <th className="py-1 font-medium">{serie.porSemana ? "Semana de" : "Dia"}</th>
                  <th className="py-1 text-right font-medium">Pontuação</th>
                </tr>
              </thead>
              <tbody>
                {serie.dados.map((p) => (
                  <tr key={p.data} className="border-t">
                    <td className="py-1">{formatShortDate(p.data)}</td>
                    <td className="py-1 text-right tabular-nums">
                      {p.pontuacao === null ? "—" : Math.round(p.pontuacao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </Card>
      )}

      <Card
        id="por-habito"
        title="Por hábito"
        extra={
          <NativeSelect
            aria-label="Escolher hábito"
            value={habito ? habito.id : "geral"}
            onChange={(e) => setHabitoId(e.target.value)}
            className="h-10 max-w-52"
          >
            <option value="geral">Visão geral</option>
            {bons.map((h) => (
              <option key={h.id} value={h.id}>
                {h.emoji} {h.nome}
                {h.arquivado ? " (arquivado)" : ""}
              </option>
            ))}
          </NativeSelect>
        }
      >
        {!habito ? (
          visaoGeral.length ? (
            <ul className="space-y-3">
              {visaoGeral.map(({ habit: h, stats }) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => setHabitoId(h.id)}
                    className="hover:bg-accent -mx-2 w-[calc(100%+1rem)] space-y-1 rounded-lg px-2 py-1 text-left"
                    aria-label={`${h.nome}: ${formatPercent(stats.taxa ?? 0)} dos dias previstos. Ver detalhes`}
                  >
                    <span className="flex items-center justify-between text-sm">
                      <span>
                        <span aria-hidden>{h.emoji}</span> {h.nome}
                      </span>
                      <span className="text-muted-foreground font-semibold tabular-nums">
                        {stats.concluidos}/{stats.previstos} · {formatPercent(stats.taxa ?? 0)}
                      </span>
                    </span>
                    <span className="bg-muted block h-2 overflow-hidden rounded-full">
                      <span
                        className="bg-brand-orange block h-full rounded-full"
                        style={{ width: `${(stats.taxa ?? 0) * 100}%` }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-sm">Nenhum hábito previsto neste período.</p>
          )
        ) : (
          statsHabito &&
          barras && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  [
                    habito.metaTipo === "quantidade" ? `Total (${habito.unidade})` : "Dias feitos",
                    formatNumber(Math.round(statsHabito.total * 10) / 10),
                  ],
                  [
                    habito.metaTipo === "quantidade" ? "Média por dia" : "Conclusão",
                    habito.metaTipo === "quantidade"
                      ? statsHabito.mediaDiaria === null
                        ? "—"
                        : formatNumber(Math.round(statsHabito.mediaDiaria * 10) / 10)
                      : statsHabito.taxa === null
                        ? "—"
                        : formatPercent(statsHabito.taxa),
                  ],
                  ["Meta cumprida", `${statsHabito.concluidos}/${statsHabito.previstos}`],
                  ["Melhor sequência", `${statsHabito.melhorSequencia} d`],
                ].map(([l, v]) => (
                  <div key={l} className="bg-muted rounded-lg p-2.5">
                    <p className="text-muted-foreground text-[11px]">{l}</p>
                    <p className="text-lg font-bold tabular-nums">{v}</p>
                  </div>
                ))}
              </div>
              {!umDia && (
                <>
                  <HabitBarChart
                    data={barras.buckets}
                    unidade={unidade}
                    porSemana={barras.porSemana}
                    meta={habito.metaTipo === "quantidade" ? habito.metaValor : null}
                  />
                  <p className="text-muted-foreground text-xs">
                    {barras.porSemana
                      ? "Soma por semana."
                      : habito.metaTipo === "quantidade"
                        ? `Linha tracejada: meta diária (${formatNumber(habito.metaValor ?? 0)} ${habito.unidade}).`
                        : "Cada barra é um dia feito."}
                  </p>
                </>
              )}
              {heatHabito && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium">Últimos 12 meses</p>
                  <YearHeatmap
                    semanas={heatHabito}
                    label={`Calendário de ${habito.nome} nos últimos 12 meses`}
                    describe={(c) =>
                      c.nivel === 0
                        ? "não feito"
                        : c.nivel === 4
                          ? "meta cumprida"
                          : `${c.pontuacao}% da meta`
                    }
                  />
                </div>
              )}
            </div>
          )
        )}
      </Card>

      {evitar.length > 0 && (
        <Card id="evitar" title="Hábitos a evitar">
          <ul className="space-y-3">
            {evitar.map(({ habit: h, evitados, registrados, taxa }) => (
              <li key={h.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    <span aria-hidden>{h.emoji}</span> {h.nome}
                  </span>
                  <span className="text-muted-foreground font-semibold tabular-nums">
                    {taxa === null ? "sem registros" : formatPercent(taxa)}
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-brand-orange h-full rounded-full"
                    style={{ width: `${(taxa ?? 0) * 100}%` }}
                  />
                </div>
                {registrados > 0 && (
                  <p className="text-muted-foreground text-xs">
                    Evitou em {evitados} de {registrados}{" "}
                    {registrados === 1 ? "dia registrado" : "dias registrados"}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card id="areas-evolucao" title="Áreas da vida">
        <AreaBars areas={snapshot.areas} stats={areas} />
      </Card>

      <Card id="constancia" title="Constância no último ano">
        <YearHeatmap
          semanas={heat.semanas}
          label="Heatmap de constância dos últimos 12 meses"
          describe={(c) =>
            c.pontuacao === null ? "sem itens" : c.nivel === 4 ? "dia perfeito" : `pontuação ${c.pontuacao}`
          }
        />
        {(heat.melhorMes || heat.piorMes) && (
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {heat.melhorMes && (
              <p className="bg-muted flex items-center gap-2 rounded-lg p-2.5">
                <span className="size-3 rounded-[3px]" style={{ background: HEAT_FILL[4] }} aria-hidden />
                Melhor mês: <strong className="capitalize">{nomeMes(heat.melhorMes.mes)}</strong> (média{" "}
                {Math.round(heat.melhorMes.media)})
              </p>
            )}
            {heat.piorMes && (
              <p className="bg-muted flex items-center gap-2 rounded-lg p-2.5">
                <span className="size-3 rounded-[3px]" style={{ background: HEAT_FILL[1] }} aria-hidden />
                Mais difícil: <strong className="capitalize">{nomeMes(heat.piorMes.mes)}</strong> (média{" "}
                {Math.round(heat.piorMes.media)})
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
