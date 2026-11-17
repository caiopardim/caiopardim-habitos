"use client";

import { useEffect, useState } from "react";
import { Check, Clock, Minus, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { XP_POR_DIFICULDADE, habitProgress } from "@/lib/domain/day";
import { clampValue, suggestedStep } from "@/lib/domain/quantity";
import type { Habit, HabitLog, LifeArea, Task } from "@/lib/domain/types";
import { DIFICULDADE_LABEL, PRIORIDADE_LABEL } from "@/lib/templates";
import { cn, formatNumber } from "@/lib/utils";
import { useXpBurst } from "./xp-burst";

function CheckButton({
  done,
  label,
  disabled,
  onClick,
}: {
  done: boolean;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-ring/50 grid size-11 shrink-0 place-items-center rounded-full border-2 transition-colors focus-visible:ring-[3px] focus-visible:outline-none disabled:opacity-40",
        done
          ? "border-primary/50 bg-primary/15 text-primary"
          : "border-muted-foreground/50 hover:border-primary hover:bg-primary/5",
      )}
    >
      {done && <Check className="animate-check-pop size-5" strokeWidth={3} />}
    </button>
  );
}

function Meta({ area, children }: { area?: LifeArea; children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
      {area && (
        <span className="inline-flex items-center gap-1">
          <span className="size-2 rounded-full" style={{ background: area.cor }} aria-hidden />
          {area.nome}
        </span>
      )}
      {children}
    </p>
  );
}

const PRIORIDADE_COR = {
  alta: "text-danger",
  media: "text-muted-foreground",
  baixa: "text-muted-foreground",
} as const;

export function HabitMission({
  habit,
  log,
  area,
  editable,
  onCheck,
  onQuantity,
}: {
  habit: Habit;
  log: HabitLog | undefined;
  area?: LifeArea;
  editable: boolean;
  onCheck: (done: boolean) => void;
  onQuantity: (valor: number) => void;
}) {
  const { fire, node } = useXpBurst();
  const xp = XP_POR_DIFICULDADE[habit.dificuldade];
  const progresso = habitProgress(habit, log);
  const done = progresso >= 1;
  const quantidade = habit.metaTipo === "quantidade";

  return (
    <li
      className={cn(
        "bg-card relative rounded-xl border p-3 transition-[opacity,background-color] duration-300",
        done && "bg-transparent opacity-60",
      )}
    >
      {node}
      <div className="flex items-center gap-3">
        <CheckButton
          done={done}
          disabled={!editable}
          label={done ? `Desmarcar ${habit.nome}` : `Marcar ${habit.nome} como feito`}
          onClick={() => {
            if (quantidade) {
              const meta = habit.metaValor ?? 1;
              onQuantity(done ? 0 : meta);
              if (!done) fire(Math.round(xp * (1 - progresso)));
            } else {
              onCheck(!done);
              if (!done) fire(xp);
            }
          }}
        />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate font-semibold", done && "text-muted-foreground")}>
            <span className="mr-1.5" aria-hidden>
              {habit.emoji}
            </span>
            {habit.nome}
          </p>
          <Meta area={area}>
            <span>{DIFICULDADE_LABEL[habit.dificuldade]}</span>
            {habit.horario && (
              <span className="inline-flex items-center gap-0.5">
                <Clock className="size-3" aria-hidden />
                {habit.horario}
              </span>
            )}
          </Meta>
        </div>
        <span className="text-xp shrink-0 text-xs font-bold">+{xp} XP</span>
      </div>
      {quantidade && (
        <QuantityControl
          habit={habit}
          valor={log?.valor ?? 0}
          editable={editable}
          onChange={(v) => {
            const antes = progresso;
            onQuantity(v);
            const depois = Math.min(1, v / (habit.metaValor ?? 1));
            const ganho = Math.round(xp * depois) - Math.round(xp * antes);
            if (depois >= 1 && antes < 1) fire(ganho);
          }}
        />
      )}
    </li>
  );
}

function QuantityControl({
  habit,
  valor,
  editable,
  onChange,
}: {
  habit: Habit;
  valor: number;
  editable: boolean;
  onChange: (v: number) => void;
}) {
  const meta = habit.metaValor ?? 1;
  const step = suggestedStep(meta);
  const [texto, setTexto] = useState(formatNumber(valor));
  useEffect(() => setTexto(formatNumber(valor)), [valor]);

  const commit = () => {
    const n = clampValue(Number(texto.replace(/\./g, "").replace(",", ".")));
    if (n !== valor) onChange(n);
    else setTexto(formatNumber(valor));
  };

  return (
    <div className="mt-3 space-y-2 pl-14">
      <Progress value={(valor / meta) * 100} className="h-1.5" aria-label={`Progresso de ${habit.nome}`} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Diminuir ${formatNumber(step)} ${habit.unidade ?? ""}`}
          disabled={!editable || valor <= 0}
          onClick={() => onChange(clampValue(valor - step))}
          className="hover:bg-accent grid size-11 place-items-center rounded-lg border disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <label className="bg-background/50 flex h-11 flex-1 items-center justify-center gap-1 rounded-lg border px-2 text-sm">
          <span className="sr-only">Quantidade de {habit.nome}</span>
          <input
            inputMode="decimal"
            value={texto}
            disabled={!editable}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
            className="w-14 min-w-0 bg-transparent text-right font-bold tabular-nums outline-none"
          />
          <span className="text-muted-foreground whitespace-nowrap">
            / {formatNumber(meta)} {habit.unidade}
          </span>
        </label>
        <button
          type="button"
          aria-label={`Aumentar ${formatNumber(step)} ${habit.unidade ?? ""}`}
          disabled={!editable}
          onClick={() => onChange(clampValue(valor + step))}
          className="hover:bg-accent grid size-11 place-items-center rounded-lg border disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function TaskMission({
  task,
  area,
  editable,
  onToggle,
  onEdit,
}: {
  task: Task;
  area?: LifeArea;
  editable: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { fire, node } = useXpBurst();
  const xp = XP_POR_DIFICULDADE[task.dificuldade];
  return (
    <li
      className={cn(
        "bg-card relative rounded-xl border p-3 transition-[opacity,background-color] duration-300",
        task.concluida && "bg-transparent opacity-60",
      )}
    >
      {node}
      <div className="flex items-center gap-3">
        <CheckButton
          done={task.concluida}
          disabled={!editable}
          label={task.concluida ? `Desmarcar ${task.titulo}` : `Concluir ${task.titulo}`}
          onClick={() => {
            onToggle();
            if (!task.concluida) fire(xp);
          }}
        />
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 text-left"
          aria-label={`Editar tarefa ${task.titulo}`}
        >
          <p className={cn("truncate font-semibold", task.concluida && "text-muted-foreground")}>
            {task.titulo}
          </p>
          <Meta area={area}>
            <span className={PRIORIDADE_COR[task.prioridade]}>
              Prioridade {PRIORIDADE_LABEL[task.prioridade].toLowerCase()}
            </span>
            <span>Tarefa</span>
          </Meta>
        </button>
        <span className="text-xp shrink-0 text-xs font-bold">+{xp} XP</span>
      </div>
    </li>
  );
}
