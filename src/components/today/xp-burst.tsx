"use client";

import { useCallback, useRef, useState } from "react";

/** Mostra "+N XP" flutuando por cima de um item ao concluí-lo. */
export function useXpBurst() {
  const [burst, setBurst] = useState<{ id: number; xp: number } | null>(null);
  const seq = useRef(0);
  const fire = useCallback((xp: number) => {
    if (xp <= 0) return;
    seq.current += 1;
    setBurst({ id: seq.current, xp });
  }, []);
  const node = burst ? (
    <span
      key={burst.id}
      aria-hidden
      onAnimationEnd={() => setBurst(null)}
      className="animate-xp-float bg-primary text-primary-foreground pointer-events-none absolute top-1 left-1/2 z-10 rounded-full px-2 py-0.5 text-xs font-bold shadow"
    >
      +{burst.xp} XP
    </span>
  ) : null;
  return { fire, node };
}
