"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MiniRing } from "@/components/brand/progress-arc";
import { Button } from "@/components/ui/button";
import { addDays } from "@/lib/domain/dates";
import { dayLevel, type DayLevel } from "@/lib/domain/day-status";
import type { DateStr, DaySummary } from "@/lib/domain/types";
import { formatDayNumber, formatShortDate, formatWeekdayShort } from "@/lib/format-date";
import { cn, formatPercent } from "@/lib/utils";

const LEVEL_LABEL: Record<DayLevel, string> = {
  vazio: "sem registro",
  baixo: "abaixo da meta",
  bom: "dia na sequência",
  perfeito: "dia perfeito",
  descanso: "dia de descanso",
};

/**
 * Últimos 7 dias terminando em `end` (por padrão, hoje). As setas navegam semanas
 * anteriores; não há navegação para o futuro.
 */
export function DateStrip({
  selected,
  today,
  onSelect,
  summaryFor,
  restDays,
}: {
  selected: DateStr;
  today: DateStr;
  onSelect: (d: DateStr) => void;
  summaryFor: (d: DateStr) => DaySummary | null;
  restDays: Set<DateStr>;
}) {
  const [end, setEnd] = useState(today);
  // Se a data escolhida sair da janela (ex.: "Voltar para hoje"), a janela acompanha.
  const visibleEnd =
    selected > end || selected <= addDays(end, -7) ? (selected > today ? today : selected) : end;
  if (visibleEnd !== end) setEnd(visibleEnd);

  const days = Array.from({ length: 7 }, (_, i) => addDays(visibleEnd, i - 6));
  const atToday = visibleEnd >= today;

  const shift = (n: number) => {
    const next = addDays(visibleEnd, n);
    const clamped = next > today ? today : next;
    setEnd(clamped);
    onSelect(clamped);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="icon" aria-label="Semana anterior" onClick={() => shift(-7)}>
          <ChevronLeft />
        </Button>
        <div className="flex flex-1 flex-col items-center">
          <p className="text-muted-foreground text-sm font-medium">
            {formatShortDate(days[0])} – {formatShortDate(days[6])}
          </p>
          {selected !== today && (
            <Button variant="link" size="sm" className="-my-2 px-0" onClick={() => onSelect(today)}>
              Voltar para hoje
            </Button>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Próxima semana"
          onClick={() => shift(7)}
          disabled={atToday}
          className="disabled:opacity-20"
        >
          <ChevronRight />
        </Button>
      </div>
      <div>
        <ol className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const s = summaryFor(d);
            const level = dayLevel(s, restDays.has(d));
            const isSel = d === selected;
            const isToday = d === today;
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => onSelect(d)}
                  aria-current={isSel ? "date" : undefined}
                  aria-label={`${formatWeekdayShort(d)}, ${formatShortDate(d)}${isToday ? " (hoje)" : ""}: ${
                    s?.temItens ? `${formatPercent(s.execucao)}, ` : ""
                  }${isToday && level !== "perfeito" ? "em andamento" : LEVEL_LABEL[level]}`}
                  className={cn(
                    "flex h-[4.5rem] w-full flex-col items-center justify-center gap-1 rounded-xl text-xs transition-colors",
                    isSel ? "bg-accent ring-primary ring-2" : "hover:bg-accent",
                  )}
                >
                  <span
                    className={cn("capitalize", isToday ? "text-xp font-semibold" : "text-muted-foreground")}
                  >
                    {isToday ? "Hoje" : formatWeekdayShort(d)}
                  </span>
                  <span className="relative grid place-items-center">
                    <MiniRing value={s?.execucao ?? 0} tone={level} className="size-8" />
                    <span className="absolute text-[11px] font-bold">{formatDayNumber(d)}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="text-muted-foreground flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
        <Legend cor="var(--brand-pink)">abaixo da meta</Legend>
        <Legend cor="var(--brand-orange)">na sequência</Legend>
        <Legend cor="var(--brand-yellow)">perfeito</Legend>
      </p>
    </div>
  );
}

function Legend({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ background: cor }} aria-hidden />
      {children}
    </span>
  );
}
