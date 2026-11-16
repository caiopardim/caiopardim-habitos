import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botão alternável (selecionado / não selecionado). */
export function Chip({
  selected,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "focus-visible:ring-ring/50 flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-all focus-visible:ring-[3px] focus-visible:outline-none active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "bg-card text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
      {selected && <Check className="text-primary ml-auto size-4 shrink-0" aria-hidden />}
    </button>
  );
}
