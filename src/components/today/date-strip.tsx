"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addDays, weekStart } from "@/lib/domain/dates";
import type { DateStr, DaySummary } from "@/lib/domain/types";
import { formatDayNumber, formatMonthYear, formatWeekdayShort } from "@/lib/format-date";
import { cn } from "@/lib/utils";

export function DateStrip({
  selected,
  today,
  onSelect,
  summaryFor,
}: {
  selected: DateStr;
  today: DateStr;
  onSelect: (d: DateStr) => void;
  summaryFor: (d: DateStr) => DaySummary | null;
}) {
  const start = weekStart(selected);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">{formatMonthYear(selected)}</p>
        {selected !== today && (
          <Button variant="link" size="sm" className="h-8 px-0" onClick={() => onSelect(today)}>
            Voltar para hoje
          </Button>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Semana anterior"
          onClick={() => onSelect(addDays(selected, -7))}
        >
          <ChevronLeft />
        </Button>
        <ol className="grid flex-1 grid-cols-7 gap-1">
          {days.map((d) => {
            const s = d <= today ? summaryFor(d) : null;
            const isSel = d === selected;
            return (
              <li key={d}>
                <button
                  type="button"
                  onClick={() => onSelect(d)}
                  aria-current={isSel ? "date" : undefined}
                  aria-label={d}
                  className={cn(
                    "flex h-16 w-full flex-col items-center justify-center gap-0.5 rounded-xl text-xs transition-colors",
                    isSel ? "bg-primary text-primary-foreground" : "hover:bg-accent",
                    !isSel && d === today && "ring-primary ring-1",
                  )}
                >
                  <span className={cn("capitalize", !isSel && "text-muted-foreground")}>
                    {formatWeekdayShort(d)}
                  </span>
                  <span className="text-base font-bold">{formatDayNumber(d)}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "size-1.5 rounded-full",
                      !s?.temItens || d === today
                        ? "bg-transparent"
                        : s.diaPerfeito
                          ? isSel
                            ? "bg-primary-foreground"
                            : "bg-primary"
                          : s.contaSequencia
                            ? isSel
                              ? "bg-primary-foreground/60"
                              : "bg-primary/50"
                            : isSel
                              ? "bg-primary-foreground/30"
                              : "bg-muted-foreground/30",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Próxima semana"
          onClick={() => onSelect(addDays(selected, 7))}
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
