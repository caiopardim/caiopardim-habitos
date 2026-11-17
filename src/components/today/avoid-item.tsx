"use client";

import { ShieldCheck, TriangleAlert } from "lucide-react";
import { badHabitStats } from "@/lib/domain/bad-habits";
import { XP_MAU_HABITO_EVITADO } from "@/lib/domain/day";
import type { DateStr, Habit, HabitLog, LifeArea } from "@/lib/domain/types";
import { HabitIcon } from "@/components/habits/habit-icon";
import { cn } from "@/lib/utils";
import { useXpBurst } from "./xp-burst";

export function AvoidItem({
  habit,
  log,
  logs,
  date,
  area,
  editable,
  onSet,
}: {
  habit: Habit;
  log: HabitLog | undefined;
  /** Todos os registros deste hábito, para o contador. */
  logs: HabitLog[];
  date: DateStr;
  area?: LifeArea;
  editable: boolean;
  onSet: (s: "evitei" | "aconteceu" | null) => void;
}) {
  const { fire, node } = useXpBurst();
  const stats = badHabitStats(habit, logs, date);
  const st = log?.status;

  return (
    <li className="bg-card relative rounded-xl border p-3">
      {node}
      <div className="flex items-start gap-3">
        <span className="bg-muted grid size-11 shrink-0 place-items-center rounded-full text-xl" aria-hidden>
          <HabitIcon simbolo={habit.emoji} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{habit.nome}</p>
          <p className="text-muted-foreground text-xs">
            {area && <span>{area.nome} · </span>}
            <strong className="text-foreground tabular-nums">{stats.diasLimpo}</strong>{" "}
            {stats.diasLimpo === 1 ? "dia" : "dias"} sem
            {stats.proximoMarco && <> · próximo marco: {stats.proximoMarco}</>}
            {stats.recorde > 0 && <> · recorde: {stats.recorde}</>}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={`Registro de ${habit.nome}`}>
        <button
          type="button"
          aria-pressed={st === "evitei"}
          disabled={!editable}
          onClick={() => {
            onSet(st === "evitei" ? null : "evitei");
            if (st !== "evitei") fire(XP_MAU_HABITO_EVITADO);
          }}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40",
            st === "evitei" ? "border-success bg-success/15 text-success" : "hover:bg-accent",
          )}
        >
          <ShieldCheck className="size-4" /> Evitei
        </button>
        <button
          type="button"
          aria-pressed={st === "aconteceu"}
          disabled={!editable}
          onClick={() => onSet(st === "aconteceu" ? null : "aconteceu")}
          className={cn(
            "flex h-11 items-center justify-center gap-1.5 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-40",
            st === "aconteceu" ? "border-danger bg-danger/15 text-danger" : "hover:bg-accent",
          )}
        >
          <TriangleAlert className="size-4" /> Aconteceu
        </button>
      </div>
    </li>
  );
}
