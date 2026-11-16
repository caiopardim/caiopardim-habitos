"use client";

import { useId } from "react";
import type { Energia } from "@/lib/domain/avatar";
import { cn } from "@/lib/utils";

/** Cor do corpo por estágio: começa apagado e fica cada vez mais vivo. */
const BODY = ["#b9c7a5", "#a9d67e", "#97d35a", "#84cc3f", "#70c032", "#5db22c", "#8fd14f"];
const SHADE = ["#8e9c7b", "#7fae55", "#6fac36", "#5fa323", "#4f961c", "#3f8818", "#5fa323"];
const INK = "#1d2416";
const GOLD = "#f5c542";

/**
 * Avatar de evolução: um personagem que ganha tamanho, força e acessórios a cada estágio.
 * - estágio 0–1: pequeno, braços relaxados
 * - 2: faixa na cabeça · 3: pose de força (bíceps) · 4: cinturão · 5: capa · 6: coroa e aura dourada
 * A disposição (olhos, boca, gota de suor, brilhos) vem da constância recente.
 */
export function EvolutionAvatar({
  estagio,
  energia,
  className,
  title,
  locked = false,
}: {
  estagio: number;
  energia: Energia;
  className?: string;
  title?: string;
  /** Silhueta de um estágio ainda não alcançado. */
  locked?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const s = Math.max(0, Math.min(6, estagio));
  const body = locked ? "#6b7280" : BODY[s];
  const shade = locked ? "#4b5563" : SHADE[s];

  const cx = 100;
  const rx = 34 + s * 4; // fica mais largo
  const ry = 40 + s * 2.5; // e mais alto
  const bottom = 162;
  const cy = bottom - ry;
  const armW = 11 + s * 2;

  const eyeY = cy - ry * 0.12;
  const eyeDx = rx * 0.34;
  const mouthY = eyeY + 14 + s * 0.5;
  const flex = s >= 3;

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label={title ?? "Avatar de evolução"}
      className={cn("select-none", locked && "opacity-40", className)}
    >
      <defs>
        <clipPath id={`body-${uid}`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
        <radialGradient id={`aura-${uid}`}>
          <stop offset="0%" stopColor={s >= 6 ? GOLD : "#a3e635"} stopOpacity="0.55" />
          <stop offset="100%" stopColor={s >= 6 ? GOLD : "#a3e635"} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura: lendária (estágio 6) ou quando está cheio de energia */}
      {!locked && (s >= 6 || energia === "energizado") && (
        <circle cx={cx} cy={cy} r={rx + 40} fill={`url(#aura-${uid})`} className="animate-pulse" />
      )}

      {/* Sombra no chão */}
      <ellipse cx={cx} cy={bottom + 14} rx={rx * 0.9} ry={6} fill="#000" opacity={0.25} />

      {/* Capa (atrás do corpo) */}
      {s >= 5 && (
        <path
          d={`M ${cx - rx * 0.7} ${cy - ry * 0.35} Q ${cx - rx - 26} ${bottom + 4} ${cx - rx - 14} ${bottom + 10} L ${cx + rx + 14} ${bottom + 10} Q ${cx + rx + 26} ${bottom + 4} ${cx + rx * 0.7} ${cy - ry * 0.35} Z`}
          fill={locked ? "#4b5563" : "#7c3aed"}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )}

      {/* Pés */}
      {[-1, 1].map((d) => (
        <rect
          key={d}
          x={cx + d * rx * 0.42 - 9 - s}
          y={bottom - 8}
          width={18 + s * 2}
          height={18}
          rx={9}
          fill={shade}
          stroke={INK}
          strokeWidth={3}
        />
      ))}

      {/* Braços */}
      {[-1, 1].map((d) => {
        const sx = cx + d * rx * 0.92;
        if (!flex) {
          return (
            <path
              key={d}
              d={`M ${sx} ${cy - 2} Q ${sx + d * 14} ${cy + ry * 0.35} ${sx + d * 8} ${cy + ry * 0.6}`}
              fill="none"
              stroke={INK}
              strokeWidth={armW + 6}
              strokeLinecap="round"
            />
          );
        }
        const ex = cx + d * (rx + 24);
        const fy = cy - 30 - s * 2;
        return (
          <g key={d}>
            <path
              d={`M ${sx} ${cy + 4} L ${ex} ${cy + 2} L ${ex - d * 4} ${fy}`}
              fill="none"
              stroke={INK}
              strokeWidth={armW + 6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d={`M ${sx} ${cy + 4} L ${ex} ${cy + 2} L ${ex - d * 4} ${fy}`}
              fill="none"
              stroke={shade}
              strokeWidth={armW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Bíceps */}
            <circle
              cx={cx + d * (rx + 12)}
              cy={cy - 3}
              r={7 + s * 1.6}
              fill={body}
              stroke={INK}
              strokeWidth={3}
            />
            {/* Punho */}
            <circle cx={ex - d * 4} cy={fy} r={8 + s} fill={body} stroke={INK} strokeWidth={3} />
          </g>
        );
      })}

      {/* Corpo */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={body} stroke={INK} strokeWidth={3.5} />
      {!locked && (
        <ellipse
          cx={cx - rx * 0.35}
          cy={cy - ry * 0.45}
          rx={rx * 0.25}
          ry={ry * 0.14}
          fill="#fff"
          opacity={0.35}
        />
      )}

      {/* Braços relaxados por cima do corpo (preenchimento) */}
      {!flex &&
        [-1, 1].map((d) => {
          const sx = cx + d * rx * 0.92;
          return (
            <path
              key={d}
              d={`M ${sx} ${cy - 2} Q ${sx + d * 14} ${cy + ry * 0.35} ${sx + d * 8} ${cy + ry * 0.6}`}
              fill="none"
              stroke={shade}
              strokeWidth={armW}
              strokeLinecap="round"
            />
          );
        })}

      <g clipPath={`url(#body-${uid})`}>
        {/* Faixa na cabeça */}
        {s >= 2 && (
          <rect
            x={cx - rx - 2}
            y={cy - ry * 0.62}
            width={rx * 2 + 4}
            height={10 + s}
            fill={locked ? "#374151" : "#ef4444"}
            stroke={INK}
            strokeWidth={3}
          />
        )}
        {/* Cinturão */}
        {s >= 4 && (
          <rect
            x={cx - rx - 2}
            y={cy + ry * 0.42}
            width={rx * 2 + 4}
            height={12}
            fill={locked ? "#374151" : "#3f2d1f"}
            stroke={INK}
            strokeWidth={3}
          />
        )}
      </g>
      {s >= 2 && (
        // Pontas da faixa
        <path
          d={`M ${cx + rx - 4} ${cy - ry * 0.55} l 16 -6 l -4 12 Z M ${cx + rx - 4} ${cy - ry * 0.5} l 14 10 l -14 2 Z`}
          fill={locked ? "#374151" : "#ef4444"}
          stroke={INK}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
      )}
      {s >= 4 && (
        <rect
          x={cx - 9}
          y={cy + ry * 0.42 - 2}
          width={18}
          height={16}
          rx={3}
          fill={locked ? "#6b7280" : GOLD}
          stroke={INK}
          strokeWidth={3}
        />
      )}

      {/* Coroa */}
      {s >= 6 && (
        <path
          d={`M ${cx - 22} ${cy - ry + 6} L ${cx - 24} ${cy - ry - 18} L ${cx - 10} ${cy - ry - 6} L ${cx} ${cy - ry - 24} L ${cx + 10} ${cy - ry - 6} L ${cx + 24} ${cy - ry - 18} L ${cx + 22} ${cy - ry + 6} Z`}
          fill={locked ? "#6b7280" : GOLD}
          stroke={INK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      )}

      {/* Rosto */}
      {!locked && <Face cx={cx} eyeY={eyeY} eyeDx={eyeDx} mouthY={mouthY} energia={energia} />}

      {/* Gota de suor (cansado) */}
      {!locked && energia === "cansado" && (
        <path
          d={`M ${cx + rx * 0.62} ${cy - ry * 0.42} q 6 9 0 13 q -6 -4 0 -13 Z`}
          fill="#7dd3fc"
          stroke={INK}
          strokeWidth={2}
        />
      )}

      {/* Brilhos (energizado) */}
      {!locked &&
        energia === "energizado" &&
        [
          [cx - rx - 20, cy - ry * 0.6, 7],
          [cx + rx + 18, cy - ry * 0.9, 9],
          [cx + rx + 6, cy + ry * 0.5, 5],
        ].map(([x, y, r], i) => (
          <path
            key={i}
            d={`M ${x} ${y - r} Q ${x} ${y} ${x + r} ${y} Q ${x} ${y} ${x} ${y + r} Q ${x} ${y} ${x - r} ${y} Q ${x} ${y} ${x} ${y - r} Z`}
            fill={GOLD}
          />
        ))}
    </svg>
  );
}

function Face({
  cx,
  eyeY,
  eyeDx,
  mouthY,
  energia,
}: {
  cx: number;
  eyeY: number;
  eyeDx: number;
  mouthY: number;
  energia: Energia;
}) {
  return (
    <g stroke={INK} strokeLinecap="round" fill="none">
      {[-1, 1].map((d) => {
        const x = cx + d * eyeDx;
        if (energia === "cansado") {
          // olhos semicerrados
          return (
            <g key={d}>
              <path d={`M ${x - 6} ${eyeY} q 6 5 12 0`} strokeWidth={3.5} />
              <path d={`M ${x - 7} ${eyeY - 4} l 14 0`} strokeWidth={2} opacity={0.6} />
            </g>
          );
        }
        if (energia === "energizado") {
          // olhos felizes ^ ^
          return <path key={d} d={`M ${x - 6} ${eyeY + 2} q 6 -9 12 0`} strokeWidth={4} />;
        }
        return <circle key={d} cx={x} cy={eyeY} r={5} fill={INK} stroke="none" />;
      })}
      {/* Bochechas */}
      {[-1, 1].map((d) => (
        <ellipse
          key={`b${d}`}
          cx={cx + d * (eyeDx + 9)}
          cy={eyeY + 9}
          rx={5}
          ry={3}
          fill="#f472b6"
          opacity={0.45}
          stroke="none"
        />
      ))}
      {energia === "cansado" && <path d={`M ${cx - 6} ${mouthY} l 12 0`} strokeWidth={3} />}
      {energia === "normal" && <path d={`M ${cx - 8} ${mouthY - 2} q 8 8 16 0`} strokeWidth={3.5} />}
      {energia === "energizado" && (
        <path
          d={`M ${cx - 10} ${mouthY - 3} q 10 14 20 0 Z`}
          strokeWidth={3}
          fill="#7f1d1d"
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}
