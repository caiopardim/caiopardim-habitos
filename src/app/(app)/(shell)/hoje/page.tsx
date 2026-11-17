"use client";

import { useMemo, useState } from "react";
import { BedDouble, Lock } from "lucide-react";
import Link from "next/link";
import { EvolutionAvatar } from "@/components/avatar/evolution-avatar";
import { useAvatar } from "@/components/avatar/use-avatar";
import { useReadyData } from "@/components/providers/app-data";
import { AddFab } from "@/components/today/add-fab";
import { AvoidItem } from "@/components/today/avoid-item";
import { DateStrip } from "@/components/today/date-strip";
import { HabitMission, TaskMission } from "@/components/today/mission-item";
import { SummaryCards } from "@/components/today/summary-cards";
import { TaskFormDialog } from "@/components/today/task-form-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hourInTz } from "@/lib/domain/dates";
import { badHabitStats } from "@/lib/domain/bad-habits";
import { dayStatusMessage } from "@/lib/domain/day-status";
import { habitProgress, isHabitScheduled } from "@/lib/domain/day";
import { toast } from "sonner";
import { canUseRestDay, validRestDays } from "@/lib/domain/streak";
import type { DateStr, Habit, HabitLog, Task } from "@/lib/domain/types";
import { formatLongDate, greeting } from "@/lib/format-date";

type Filtro = "todas" | "pendentes" | "concluidas";
const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 } as const;

export default function HojePage() {
  const data = useReadyData();
  const { snapshot, history, today, summaryFor, logFor, canEdit } = data;
  const avatar = useAvatar();
  const [date, setDate] = useState<DateStr>(today);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [editing, setEditing] = useState<Task | null>(null);

  const editable = canEdit(date);
  const summary = summaryFor(date);
  const areaById = useMemo(() => new Map(snapshot.areas.map((a) => [a.id, a])), [snapshot.areas]);
  const logsByHabit = useMemo(() => {
    const m = new Map<string, HabitLog[]>();
    for (const l of snapshot.logs) m.set(l.habitId, [...(m.get(l.habitId) ?? []), l]);
    return m;
  }, [snapshot.logs]);

  const bons = snapshot.habits
    .filter((h) => h.tipo === "bom" && isHabitScheduled(h, date))
    .sort((a, b) => (a.horario ?? "99").localeCompare(b.horario ?? "99") || a.nome.localeCompare(b.nome));
  const maus = snapshot.habits.filter((h) => h.tipo === "mau" && isHabitScheduled(h, date));
  const tarefas = snapshot.tasks
    .filter((t) => t.data === date)
    .sort((a, b) => ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]);

  const missoes = [
    ...bons.map((h) => ({
      kind: "habit" as const,
      id: h.id,
      done: habitProgress(h, logFor(h.id, date)) >= 1,
      habit: h,
    })),
    ...tarefas.map((t) => ({ kind: "task" as const, id: t.id, done: t.concluida, task: t })),
  ].filter((m) => filtro === "todas" || (filtro === "concluidas" ? m.done : !m.done));

  const pendentes =
    bons.filter((h) => habitProgress(h, logFor(h.id, date)) < 1).length +
    tarefas.filter((t) => !t.concluida).length;

  const mausSemRegistro = maus.filter((h) => !logFor(h.id, date)).length;
  const statusDia = dayStatusMessage({ summary, missoesPendentes: pendentes, mausSemRegistro });

  /** Registra Evitei/Aconteceu com toast de "Desfazer" (8 s). Tocar de novo no mesmo botão limpa. */
  const registrarMau = (h: Habit, st: "evitei" | "aconteceu" | null) => {
    const anterior = logFor(h.id, date)?.status;
    const voltar = anterior === "evitei" || anterior === "aconteceu" ? anterior : null;
    const recordeAntes = badHabitStats(h, logsByHabit.get(h.id) ?? [], date).recorde;
    data.setBadStatus(h, date, st);
    if (st === null) return;
    const opts = {
      duration: 8000,
      action: { label: "Desfazer", onClick: () => data.setBadStatus(h, date, voltar) },
    };
    if (st === "aconteceu") {
      toast(
        recordeAntes > 0
          ? `Tudo bem. Um dia não apaga o caminho — seu recorde de ${recordeAntes} ${recordeAntes === 1 ? "dia" : "dias"} continua seu.`
          : "Tudo bem. Um dia não apaga o caminho — amanhã é uma nova chance.",
        opts,
      );
    } else {
      toast.success(`Mais um dia sem ${h.nome.toLowerCase()}. +10 XP`, opts);
    }
  };

  const descansoAtivo = validRestDays(snapshot.restDays).has(date);
  const podeDescansar =
    editable &&
    !descansoAtivo &&
    canUseRestDay(snapshot.restDays, date) &&
    !summary?.contaSequencia &&
    summary?.temItens;

  const primeiroNome = snapshot.profile.nome.split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">
              {greeting(hourInTz(snapshot.profile.fuso))}
              {primeiroNome ? `, ${primeiroNome}` : ""}!
            </h1>
            <p className="text-muted-foreground text-sm">{formatLongDate(date)}</p>
          </div>
          <Link
            href="/perfil"
            className="hover:bg-accent flex shrink-0 flex-col items-center rounded-xl px-1"
            aria-label={`Seu avatar: ${avatar.stage.nome}. Ver perfil`}
          >
            <EvolutionAvatar estagio={avatar.estagio} energia={avatar.energia} className="size-16" />
            <span className="text-muted-foreground -mt-1 text-[10px] font-semibold">{avatar.stage.nome}</span>
          </Link>
        </div>
        <DateStrip selected={date} today={today} onSelect={setDate} summaryFor={summaryFor} />
      </header>

      <SummaryCards
        summary={summary}
        streak={history.streak.atual}
        melhor={history.streak.melhor}
        level={history.level}
        isToday={date === today}
      />

      {!editable && (
        <p className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <Lock className="size-4 shrink-0" />
          {date > today
            ? "Dia futuro: dá para planejar tarefas, mas o check-in só abre no dia."
            : "Registros com mais de 7 dias ficam travados."}
        </p>
      )}

      {(descansoAtivo || podeDescansar) && (
        <div className="flex items-center gap-3 rounded-xl border border-dashed p-3">
          <BedDouble className="text-primary size-5 shrink-0" aria-hidden />
          <p className="flex-1 text-sm">
            {descansoAtivo
              ? "Dia de descanso: sua sequência está protegida."
              : "Precisa de uma pausa? Use o dia de descanso da semana sem quebrar a sequência."}
          </p>
          <Button
            size="sm"
            variant={descansoAtivo ? "ghost" : "secondary"}
            onClick={() => data.toggleRestDay(date)}
            disabled={!editable}
          >
            {descansoAtivo ? "Desfazer" : "Usar"}
          </Button>
        </div>
      )}

      <section aria-labelledby="missoes" className="space-y-3">
        <div>
          <h2 id="missoes" className="text-lg font-bold">
            Missões {date === today ? "de hoje" : "do dia"}
          </h2>
          {statusDia && (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {statusDia}
            </p>
          )}
        </div>
        <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="concluidas">Concluídas</TabsTrigger>
          </TabsList>
        </Tabs>
        {missoes.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            {bons.length + tarefas.length === 0
              ? "Nenhuma missão para este dia. Toque em + para criar uma tarefa ou hábito."
              : filtro === "concluidas"
                ? "Nada concluído ainda. Bora começar?"
                : "Nenhuma pendência. Mandou bem!"}
          </p>
        ) : (
          <ul className="space-y-2">
            {missoes.map((m) =>
              m.kind === "habit" ? (
                <HabitMission
                  key={m.id}
                  habit={m.habit}
                  log={logFor(m.habit.id, date)}
                  area={m.habit.areaId ? areaById.get(m.habit.areaId) : undefined}
                  editable={editable}
                  onCheck={(done) => data.setCheck(m.habit, date, done)}
                  onQuantity={(v) => data.setQuantity(m.habit, date, v)}
                />
              ) : (
                <TaskMission
                  key={m.id}
                  task={m.task}
                  area={m.task.areaId ? areaById.get(m.task.areaId) : undefined}
                  editable={editable}
                  onToggle={() => data.toggleTask(m.task)}
                  onEdit={() => setEditing(m.task)}
                />
              ),
            )}
          </ul>
        )}
      </section>

      {maus.length > 0 && (
        <section aria-labelledby="evitar" className="space-y-3">
          <h2 id="evitar" className="text-lg font-bold">
            Para evitar {date === today ? "hoje" : "no dia"}
          </h2>
          <ul className="space-y-2">
            {maus.map((h) => (
              <AvoidItem
                key={h.id}
                habit={h}
                log={logFor(h.id, date)}
                logs={logsByHabit.get(h.id) ?? []}
                date={date}
                area={h.areaId ? areaById.get(h.areaId) : undefined}
                editable={editable}
                onSet={(s) => registrarMau(h, s)}
              />
            ))}
          </ul>
        </section>
      )}

      <AddFab date={date} today={today} />
      {editing && (
        <TaskFormDialog task={editing} isNew={false} open onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </div>
  );
}
