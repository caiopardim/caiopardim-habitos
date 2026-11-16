"use client";

import { useMemo } from "react";
import { useReadyData } from "@/components/providers/app-data";
import { avatarState, type Energia } from "@/lib/domain/avatar";

export const ENERGIA_TEXTO: Record<Energia, string> = {
  cansado: "Está cansado: a última semana foi puxada. Um passo hoje já ajuda.",
  normal: "Em ritmo constante. Continue assim!",
  energizado: "Cheio de energia! Sua última semana foi excelente.",
};

export function useAvatar() {
  const { history, today } = useReadyData();
  return useMemo(
    () => avatarState(history.level.nivel, history.level.progresso, history.summaries, today),
    [history, today],
  );
}
