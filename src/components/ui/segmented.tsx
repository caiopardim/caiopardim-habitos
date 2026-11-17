"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("bg-muted flex gap-1 rounded-lg p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "text-muted-foreground focus-visible:ring-ring/50 flex min-h-11 flex-1 flex-col items-center justify-center rounded-md px-2 text-sm font-medium transition-all focus-visible:ring-[3px] focus-visible:outline-none",
            value === o.value && "bg-background text-foreground dark:bg-card shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
