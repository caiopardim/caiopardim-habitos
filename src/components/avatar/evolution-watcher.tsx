"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAvatar } from "./use-avatar";

/** Comemora quando o avatar sobe de estágio (não dispara na primeira carga). */
export function EvolutionWatcher() {
  const { estagio, stage } = useAvatar();
  const prev = useRef<number | null>(null);
  useEffect(() => {
    if (prev.current !== null && estagio > prev.current) {
      toast.success(`Seu avatar evoluiu para ${stage.nome}! 💪`, {
        description: stage.descricao,
        duration: 6000,
      });
    }
    prev.current = estagio;
  }, [estagio, stage]);
  return null;
}
