"use client";

import { Input } from "@/components/ui/input";
import { PERIOD_LABEL, type PeriodPreset } from "@/lib/domain/evolution";
import type { DateStr } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

const PRESETS: PeriodPreset[] = ["hoje", "ontem", "7d", "30d", "3m", "1a", "custom"];

export function PeriodPicker({
  value,
  onChange,
  custom,
  onCustom,
  today,
}: {
  value: PeriodPreset;
  onChange: (p: PeriodPreset) => void;
  custom: { from: DateStr; to: DateStr };
  onCustom: (c: { from: DateStr; to: DateStr }) => void;
  today: DateStr;
}) {
  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Período"
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
      >
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={value === p}
            onClick={() => onChange(p)}
            className={cn(
              "focus-visible:ring-ring/50 h-11 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-[3px] focus-visible:outline-none",
              value === p
                ? "border-foreground bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>
      {value === "custom" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">De</span>
            <Input
              type="date"
              max={today}
              value={custom.from}
              onChange={(e) => e.target.value && onCustom({ ...custom, from: e.target.value })}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Até</span>
            <Input
              type="date"
              max={today}
              value={custom.to}
              onChange={(e) => e.target.value && onCustom({ ...custom, to: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
