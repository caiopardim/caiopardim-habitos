"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/utils";

const CX = 60;
const CY = 50;

/** Semicírculo de 180° (esquerda) a 0° (direita), passando por cima. */
function semi(r: number) {
  return `M ${CX - r} ${CY} A ${r} ${r} 0 0 1 ${CX + r} ${CY}`;
}

const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Anel de progresso no formato do símbolo da Zoryka.
 * - Arco externo (rosa): execução do dia.
 * - Arco interno (laranja): sucesso nos hábitos a evitar (trilha vazia se não houver).
 * - Sol: apagado durante o dia, acende e brilha no dia perfeito.
 */
export function ProgressArc({
  execucao,
  sucessoMaus,
  perfeito,
  className,
  label,
}: {
  execucao: number;
  sucessoMaus: number | null;
  perfeito: boolean;
  className?: string;
  label: string;
}) {
  // Começa vazio e anima até o valor (também anima a cada mudança).
  const [shown, setShown] = useState({ e: 0, m: 0 });
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown({ e: clamp(execucao), m: clamp(sucessoMaus ?? 0) }));
    return () => cancelAnimationFrame(id);
  }, [execucao, sucessoMaus]);

  const glowId = `sun-glow-${useId().replace(/:/g, "")}`;
  const arcClass = "transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none";

  return (
    <svg viewBox="0 0 120 72" role="img" aria-label={label} className={cn("overflow-visible", className)}>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--brand-yellow)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="var(--brand-yellow)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeWidth={8}>
        <path d={semi(44)} stroke="var(--brand-track)" />
        <path d={semi(29)} stroke="var(--brand-track)" />
        <path
          d={semi(44)}
          stroke="var(--brand-pink)"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - shown.e}
          opacity={shown.e > 0 ? 1 : 0}
          className={arcClass}
        />
        <path
          d={semi(29)}
          stroke="var(--brand-orange)"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - shown.m}
          opacity={shown.m > 0 ? 1 : 0}
          className={arcClass}
        />
      </g>
      {perfeito && (
        <circle
          cx={CX}
          cy={CY - 4}
          r={26}
          fill={`url(#${glowId})`}
          className="animate-pulse motion-reduce:animate-none"
        />
      )}
      <path
        d={`M ${CX - 15} ${CY} A 15 15 0 0 1 ${CX + 15} ${CY} Z`}
        fill="var(--brand-yellow)"
        opacity={perfeito ? 1 : 0.35}
        className="transition-opacity duration-700 motion-reduce:transition-none"
      />
      <path d="M 8 64 L 112 64" stroke="currentColor" strokeWidth={8} strokeLinecap="round" />
    </svg>
  );
}

/** Mini-anel circular para a faixa de dias. */
export function MiniRing({
  value,
  tone,
  className,
}: {
  value: number;
  tone: "vazio" | "baixo" | "bom" | "perfeito" | "descanso";
  className?: string;
}) {
  const cor =
    tone === "perfeito"
      ? "var(--brand-yellow)"
      : tone === "bom"
        ? "var(--brand-orange)"
        : tone === "baixo"
          ? "var(--brand-pink)"
          : "transparent";
  const v = tone === "perfeito" ? 1 : clamp(value);
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6", className)} aria-hidden>
      <circle cx={12} cy={12} r={9} fill="none" stroke="var(--brand-track)" strokeWidth={3.5} />
      {tone !== "vazio" && tone !== "descanso" && v > 0 && (
        <circle
          cx={12}
          cy={12}
          r={9}
          fill="none"
          stroke={cor}
          strokeWidth={3.5}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${v} 1`}
          transform="rotate(-90 12 12)"
        />
      )}
      {tone === "descanso" && (
        <path d="M8 13h8" stroke="var(--muted-foreground)" strokeWidth={2} strokeLinecap="round" />
      )}
    </svg>
  );
}
