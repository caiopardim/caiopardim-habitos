"use client";

import { useEffect, useRef } from "react";
import type { HeatCell } from "@/lib/domain/evolution";
import { formatShortDate } from "@/lib/format-date";

const CELL = 12;
const GAP = 3;
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const DIAS = ["seg", "", "qua", "", "sex", "", ""];

/** Escala sequencial de um só tom (laranja da marca), do vazio ao cheio. */
export const HEAT_FILL = [
  "var(--brand-track)",
  "color-mix(in oklab, var(--brand-orange) 32%, var(--card))",
  "color-mix(in oklab, var(--brand-orange) 58%, var(--card))",
  "color-mix(in oklab, var(--brand-orange) 82%, var(--card))",
  "var(--brand-orange)",
];

/**
 * Heatmap estilo GitHub: colunas = semanas (seg→dom), linhas = dias.
 * Rola horizontalmente no celular e já abre mostrando as semanas mais recentes.
 */
export function YearHeatmap({
  semanas,
  label,
  describe,
}: {
  semanas: (HeatCell | null)[][];
  label: string;
  /** Texto do tooltip de cada dia. */
  describe: (c: HeatCell) => string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [semanas]);

  const left = 28;
  const top = 16;
  const width = left + semanas.length * (CELL + GAP);
  const height = top + 7 * (CELL + GAP);

  // rótulo do mês na primeira semana em que ele aparece
  const meses: { x: number; texto: string }[] = [];
  let ultimo = "";
  semanas.forEach((col, i) => {
    const primeiro = col.find(Boolean);
    if (!primeiro) return;
    const m = primeiro.data.slice(5, 7);
    if (m !== ultimo) {
      ultimo = m;
      meses.push({ x: left + i * (CELL + GAP), texto: MESES[Number(m) - 1] });
    }
  });

  return (
    <div className="space-y-2">
      <div
        ref={scroller}
        className="overflow-x-auto pb-1"
        tabIndex={0}
        aria-label={`${label} (role para ver o ano)`}
      >
        <svg width={width} height={height} role="img" aria-label={label} className="block">
          {meses.map((m, i) =>
            i === 0 && meses[1] && meses[1].x - m.x < 30 ? null : (
              <text key={`${m.texto}-${m.x}`} x={m.x} y={10} className="fill-muted-foreground text-[10px]">
                {m.texto}
              </text>
            ),
          )}
          {DIAS.map((d, i) =>
            d ? (
              <text
                key={d}
                x={0}
                y={top + i * (CELL + GAP) + 10}
                className="fill-muted-foreground text-[10px]"
              >
                {d}
              </text>
            ) : null,
          )}
          {semanas.map((col, i) =>
            col.map((c, j) =>
              c ? (
                <rect
                  key={c.data}
                  x={left + i * (CELL + GAP)}
                  y={top + j * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={HEAT_FILL[c.nivel]}
                >
                  <title>{`${formatShortDate(c.data)}: ${describe(c)}`}</title>
                </rect>
              ) : null,
            ),
          )}
        </svg>
      </div>
      <div className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
        Menos
        {HEAT_FILL.map((f, i) => (
          <span key={i} className="inline-block size-3 rounded-[3px]" style={{ background: f }} aria-hidden />
        ))}
        Mais
      </div>
    </div>
  );
}
