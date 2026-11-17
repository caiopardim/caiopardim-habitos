import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Medalha: anel com o gradiente da marca e o símbolo no centro.
 * Bloqueada: anel apagado e conteúdo em tons de cinza.
 */
export function Medal({
  conteudo,
  bloqueada = false,
  className,
  label,
  size = 64,
}: {
  conteudo: React.ReactNode;
  bloqueada?: boolean;
  className?: string;
  label?: string;
  /** Lado em pixels. */
  size?: number;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-pink)" />
            <stop offset="55%" stopColor="var(--brand-orange)" />
            <stop offset="100%" stopColor="var(--brand-yellow)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="46" fill="var(--card)" />
        <circle
          cx="50"
          cy="50"
          r="43"
          fill="none"
          stroke={bloqueada ? "var(--brand-track)" : `url(#g-${id})`}
          strokeWidth="7"
        />
      </svg>
      <span
        className={cn("relative leading-none select-none", bloqueada && "opacity-35 grayscale")}
        style={{ fontSize: size * 0.42 }}
        aria-hidden
      >
        {conteudo}
      </span>
    </span>
  );
}
