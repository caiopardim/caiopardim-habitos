"use client";

/**
 * Gráficos da Evolução (Recharts). Carregados sob demanda (next/dynamic) para não pesar a tela Hoje.
 * Um gráfico = uma série = uma cor (laranja da marca); grade e eixos discretos; tooltip ao tocar.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatShortDate } from "@/lib/format-date";
import { formatNumber } from "@/lib/utils";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const shortDate = (d: string) => `${Number(d.slice(8, 10))}/${d.slice(5, 7)}`;

interface TipProps {
  active?: boolean;
  payload?: readonly { payload?: unknown }[];
  render: (p: Record<string, unknown>) => React.ReactNode;
}

function ChartTooltip({ active, payload, render }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover text-popover-foreground rounded-lg border px-3 py-2 text-xs shadow-md">
      {render(payload[0].payload as Record<string, unknown>)}
    </div>
  );
}

export interface ScoreDatum {
  data: string;
  fim?: string;
  pontuacao: number | null;
}

export function ScoreChart({
  data,
  media,
  porSemana,
}: {
  data: ScoreDatum[];
  media: number | null;
  porSemana: boolean;
}) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
          <XAxis
            dataKey="data"
            tickFormatter={shortDate}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={24}
          />
          <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={AXIS} tickLine={false} axisLine={false} />
          {media !== null && (
            <ReferenceLine
              y={media}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: `média ${Math.round(media)}`,
                position: "insideTopRight",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
          )}
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={(p) => (
              <ChartTooltip
                active={p.active}
                payload={p.payload as TipProps["payload"]}
                render={(d) => (
                  <>
                    <p className="text-muted-foreground">
                      {porSemana
                        ? `Semana de ${formatShortDate(String(d.data))}`
                        : formatShortDate(String(d.data))}
                    </p>
                    <p className="font-semibold">
                      {d.pontuacao === null ? "sem itens" : `Pontuação ${Math.round(Number(d.pontuacao))}`}
                    </p>
                  </>
                )}
              />
            )}
          />
          <Line
            type="monotone"
            dataKey="pontuacao"
            stroke="var(--brand-orange)"
            strokeWidth={2}
            dot={data.length <= 14 ? { r: 3, fill: "var(--brand-orange)", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "var(--brand-orange)", stroke: "var(--card)", strokeWidth: 2 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface BarDatum {
  inicio: string;
  fim: string;
  valor: number;
}

export function HabitBarChart({
  data,
  unidade,
  porSemana,
  meta,
}: {
  data: BarDatum[];
  unidade: string;
  porSemana: boolean;
  /** Meta diária (só faz sentido na visão por dia). */
  meta: number | null;
}) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="inicio"
            tickFormatter={shortDate}
            tick={AXIS}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={20}
          />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
            width={52}
          />
          {meta !== null && !porSemana && (
            <ReferenceLine y={meta} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
          )}
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            content={(p) => (
              <ChartTooltip
                active={p.active}
                payload={p.payload as TipProps["payload"]}
                render={(d) => (
                  <>
                    <p className="text-muted-foreground">
                      {porSemana
                        ? `${formatShortDate(String(d.inicio))} – ${formatShortDate(String(d.fim))}`
                        : formatShortDate(String(d.inicio))}
                    </p>
                    <p className="font-semibold">
                      {formatNumber(Number(d.valor))} {unidade}
                    </p>
                  </>
                )}
              />
            )}
          />
          <Bar
            dataKey="valor"
            fill="var(--brand-orange)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
