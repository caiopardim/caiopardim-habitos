"use client";

import { useEffect, useRef } from "react";

/**
 * Gravação real da demonstração. Toca sozinha (sem som) só se a pessoa não pediu menos
 * movimento no sistema; os controles ficam sempre disponíveis.
 */
export function DemoVideo({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      className={className}
      src="/landing/demo.mp4"
      poster="/landing/demo-poster.webp"
      muted
      loop
      playsInline
      controls
      preload="none"
      width={390}
      height={844}
      aria-label="Vídeo da demonstração: marcando missões na tela Hoje e abrindo a Evolução"
    />
  );
}
