"use client";

import { useMemo } from "react";
import { useReadyData } from "@/components/providers/app-data";
import {
  bestAvoidRecord,
  evaluateAchievements,
  type AchievementContext,
  type AchievementState,
} from "@/lib/domain/achievements";
import { daysWithRecords } from "@/lib/domain/evolution";
import { computeSeasons, type SeasonsResult } from "@/lib/domain/seasons";

export interface Gamification {
  contexto: AchievementContext;
  medalhas: AchievementState[];
  temporadas: SeasonsResult;
}

/** Tudo da gamificação derivado do histórico: medalhas (estado e progresso) e temporadas. */
export function useGamification(): Gamification {
  const { snapshot, history, today } = useReadyData();
  return useMemo(() => {
    const temporadas = computeSeasons(history.summaries, snapshot.restDays, history.start, today);
    const bons = new Set(snapshot.habits.filter((h) => h.tipo === "bom").map((h) => h.id));
    const contexto: AchievementContext = {
      melhorSequencia: history.streak.melhor,
      diasRegistrados: daysWithRecords(snapshot.logs, snapshot.tasks),
      diasPerfeitos: history.diasPerfeitos,
      recordeEvitar: bestAvoidRecord(snapshot.habits, snapshot.logs, today),
      temporadasConcluidas: temporadas.concluidas,
      nivel: history.level.nivel,
      totalConcluidos:
        snapshot.logs.filter((l) => bons.has(l.habitId) && l.status === "feito").length +
        snapshot.tasks.filter((t) => t.concluida).length,
    };
    return { contexto, medalhas: evaluateAchievements(contexto), temporadas };
  }, [snapshot, history, today]);
}
