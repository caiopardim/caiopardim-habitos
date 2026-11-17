import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

/** Ponto do arco no ângulo `deg` (0° = direita, 180° = esquerda, subindo por cima). */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy - r * Math.sin(a)).toFixed(2)}`;
  };
  return `M ${p(fromDeg)} A ${r} ${r} 0 0 1 ${p(toDeg)}`;
}

const CX = 60;
const CY = 50;

/**
 * Símbolo da Zoryka: o sol nascendo atrás de arcos de progresso.
 * Os arcos coloridos "ainda não completos" lembram que a evolução é um dia de cada vez.
 * As cores vêm das variáveis --brand-* (mudam com o tema claro/escuro).
 */
export function ZorykaMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 120 70"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      strokeLinecap="round"
    >
      {/* trilhas */}
      <path d={arc(CX, CY, 44, 180, 0)} stroke="var(--brand-track)" strokeWidth={8} />
      <path d={arc(CX, CY, 29, 180, 0)} stroke="var(--brand-track)" strokeWidth={8} />
      {/* progresso */}
      <path d={arc(CX, CY, 44, 180, 28)} stroke="var(--brand-pink)" strokeWidth={8} />
      <path d={arc(CX, CY, 29, 180, 58)} stroke="var(--brand-orange)" strokeWidth={8} />
      {/* sol */}
      <path
        d={`M ${CX - 15} ${CY} A 15 15 0 0 1 ${CX + 15} ${CY} Z`}
        fill="var(--brand-yellow)"
        stroke="none"
      />
      {/* horizonte */}
      <path d="M 8 64 L 112 64" stroke="currentColor" strokeWidth={8} />
    </svg>
  );
}

/** Ícone quadrado (fundo escuro), igual ao do app. */
export function ZorykaAppIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn("grid place-items-center rounded-[28%] bg-[#14110f] text-[#f7efe6]", className)}
      style={
        {
          "--brand-track": "#3a322c",
          "--brand-pink": "#f26d85",
          "--brand-orange": "#ff8a3d",
          "--brand-yellow": "#ffc247",
        } as React.CSSProperties
      }
    >
      <ZorykaMark className="w-[62%]" />
    </span>
  );
}

/** Símbolo + nome. */
export function ZorykaLogo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <ZorykaMark className={cn("h-6 w-auto", markClassName)} />
      <span className="font-display text-[1.15em] font-semibold tracking-[0.14em] uppercase">{APP_NAME}</span>
    </span>
  );
}
