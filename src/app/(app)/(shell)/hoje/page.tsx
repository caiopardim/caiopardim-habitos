"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BedDouble, ChevronDown, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { EvolutionAvatar } from "@/components/avatar/evolution-avatar";
import { useAvatar } from "@/components/avatar/use-avatar";
import { useReadyData } from "@/components/providers/app-data";
import { AddFab } from "@/components/today/add-fab";
import { AreasCard } from "@/components/today/areas-card";
import { AvoidItem } from "@/components/today/avoid-item";
import { DateStrip } from "@/components/today/date-strip";
import { HabitMission, TaskMission } from "@/components/today/mission-item";
import { SeasonCard } from "@/components/today/season-card";
import { StatCards, TodayHero } from "@/components/today/summary-cards";
import { TaskFormDialog } from "@/components/today/task-form-dialog";
import { Button } from "@/components/ui/button";
import { badHabitStats } from "@/lib/domain/bad-habits";
import { hourInTz } from "@/lib/domain/dates";
import { habitProgress, isHabitScheduled } from "@/lib/domain/day";
import { dayStatusMessage } from "@/lib/domain/day-status";
import { greeting, todayPhrase } from "@/lib/domain/greeting";
import { computeSeasons } from "@/lib/domain/seasons";
import { indexLogsByDate } from "@/lib/domain/stats";
import { canUseRestDay, validRestDays } from "@/lib/domain/streak";
import type { DateStr, Habit, HabitLog, Task } from "@/lib/domain/types";
import { formatLongDate } from "@/lib/format-date";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

const ORDEM_PRIORIDADE = { alta: 0, media: 1, baixa: 2 } as const;
/** Tempo que um item recém-concluído fica na lista de pendentes (para a animação de +XP terminar). */
const LINGER_MS = 1100;
const CONCLUIDAS_KEY = "zoryka:concluidas-aberto";

type Missao =
  | { kind: "habit"; id: string; done: boolean; habit: Habit }
  | { kind: "task"; id: string; done: boolean; task: Task };

export default function HojePage() {
  const data = useReadyData();
  const { snapshot, history, today, summaryFor, logFor, canEdit } = data;
  const avatar = useAvatar();
  const [date, setDate] = useState<DateStr>(today);
  const [editing, setEditing] = useState<Task | null>(null);

  // ── Itens recém-concluídos continuam visíveis por um instante ─────────────
  const [linger, setLinger] = useState<Set<string>>(() => new Set());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);
  const keep = useCallback((id: string) => {
    setLinger((s) => new Set(s).add(id));
    clearTimeout(timers.current.get(id));
    timers.current.set(
      id,
      setTimeout(() => {
        setLinger((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }, LINGER_MS),
    );
  }, []);

  // ── Seção "Concluídas" recolhível (lembrada neste navegador) ──────────────
  const [concluidasAberto, setConcluidasAberto] = useState(false);
  useEffect(() => {
    try {
      setConcluidasAberto(window.localStorage.getItem(CONCLUIDAS_KEY) === "1");
    } catch {
      // sem armazenamento: começa recolhida
    }
  }, []);
  const toggleConcluidas = () => {
    const v = !concluidasAberto;
    setConcluidasAberto(v);
    try {
      window.localStorage.setItem(CONCLUIDAS_KEY, v ? "1" : "0");
    } catch {
      // idem
    }
  };

  const editable = canEdit(date);
  const isToday = date === today;
  const summary = summaryFor(date);
  const areaById = useMemo(() => new Map(snapshot.areas.map((a) => [a.id, a])), [snapshot.areas]);
  const logsByDate = useMemo(() => indexLogsByDate(snapshot.logs), [snapshot.logs]);
  const logsByHabit = useMemo(() => {
    const m = new Map<string, HabitLog[]>();
    for (const l of snapshot.logs) m.set(l.habitId, [...(m.get(l.habitId) ?? []), l]);
    return m;
  }, [snapshot.logs]);
  const descansos = useMemo(() => validRestDays(snapshot.restDays), [snapshot.restDays]);
  const seasons = useMemo(
    () => computeSeasons(history.summaries, snapshot.restDays, history.start, today),
    [history, snapshot.restDays, today],
  );

  const bons = snapshot.habits
    .filter((h) => h.tipo === "bom" && isHabitScheduled(h, date))
    .sort((a, b) => (a.horario ?? "99").localeCompare(b.horario ?? "99") || a.nome.localeCompare(b.nome));
  const maus = snapshot.habits.filter((h) => h.tipo === "mau" && isHabitScheduled(h, date));
  const tarefas = snapshot.tasks
    .filter((t) => t.data === date)
    .sort((a, b) => ORDEM_PRIORIDADE[a.prioridade] - ORDEM_PRIORIDADE[b.prioridade]);

  const missoes: Missao[] = [
    ...bons.map((h) => ({
      kind: "habit" as const,
      id: h.id,
      done: habitProgress(h, logFor(h.id, date)) >= 1,
      habit: h,
    })),
    ...tarefas.map((t) => ({ kind: "task" as const, id: t.id, done: t.concluida, task: t })),
  ];
  const pendentesLista = missoes.filter((m) => !m.done || linger.has(m.id));
  const concluidasLista = missoes.filter((m) => m.done && !linger.has(m.id));
  const pendentes = missoes.filter((m) => !m.done).length;

  const mausSemRegistro = maus.filter((h) => !logFor(h.id, date)).length;
  const statusDia = dayStatusMessage({ summary, missoesPendentes: pendentes, mausSemRegistro });
  const hora = hourInTz(snapshot.profile.fuso);
  const frase = isToday
    ? todayPhrase({
        summary,
        missoesPendentes: pendentes,
        mausSemRegistro,
        limiteSequencia: snapshot.profile.limiteSequencia,
        sequenciaAtual: history.streak.atual,
        hour: hora,
      })
    : null;

  /** Registra Evitei/Aconteceu com toast de "Desfazer" (8 s). Tocar de novo no mesmo botão limpa. */
  const registrarMau = (h: Habit, st: "evitei" | "aconteceu" | null) => {
    const anterior = logFor(h.id, date)?.status;
    const voltar = anterior === "evitei" || anterior === "aconteceu" ? anterior : null;
    const recordeAntes = badHabitStats(h, logsByHabit.get(h.id) ?? [], date).recorde;
    data.setBadStatus(h, date, st);
    if (st === null) return;
    haptic();
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

  const descansoAtivo = descansos.has(date);
  const podeDescansar =
    editable &&
    !descansoAtivo &&
    canUseRestDay(snapshot.restDays, date) &&
    !summary?.contaSequencia &&
    summary?.temItens;

  const primeiroNome = snapshot.profile.nome.split(" ")[0];

  const renderMissao = (m: Missao) =>
    m.kind === "habit" ? (
      <HabitMission
        key={m.id}
        habit={m.habit}
        log={logFor(m.habit.id, date)}
        area={m.habit.areaId ? areaById.get(m.habit.areaId) : undefined}
        editable={editable}
        onCheck={(done) => {
          if (done) {
            keep(m.id);
            haptic();
          }
          data.setCheck(m.habit, date, done);
        }}
        onQuantity={(v) => {
          if (v >= (m.habit.metaValor ?? 1) && !m.done) {
            keep(m.id);
            haptic();
          }
          data.setQuantity(m.habit, date, v);
        }}
      />
    ) : (
      <TaskMission
        key={m.id}
        task={m.task}
        area={m.task.areaId ? areaById.get(m.task.areaId) : undefined}
        editable={editable}
        onToggle={() => {
          if (!m.task.concluida) {
            keep(m.id);
            haptic();
          }
          data.toggleTask(m.task);
        }}
        onEdit={() => setEditing(m.task)}
      />
    );

  return (
    <div className="space-y-5">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight">
              {isToday ? greeting(hora) : "Olhando para trás"}
              {isToday && primeiroNome ? `, ${primeiroNome}` : ""}
              {isToday ? "!" : ""}
            </h1>
            <p className="text-muted-foreground text-sm">{formatLongDate(date)}</p>
            {frase && <p className="pt-1 text-sm font-medium">{frase}</p>}
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
        <DateStrip
          selected={date}
          today={today}
          onSelect={setDate}
          summaryFor={summaryFor}
          restDays={descansos}
        />
      </header>

      <TodayHero summary={summary} />
      <StatCards
        summary={summary}
        streak={history.streak.atual}
        melhor={history.streak.melhor}
        level={history.level}
        isToday={isToday}
      />
      {isToday && <SeasonCard season={seasons.atual} />}

      {!editable && (
        <p className="bg-muted text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
          <Lock className="size-4 shrink-0" />
          Registros com mais de 7 dias ficam travados.
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
            Missões {isToday ? "de hoje" : "do dia"}
          </h2>
          {statusDia && (
            <p className="text-muted-foreground text-sm" aria-live="polite">
              {statusDia}
            </p>
          )}
        </div>

        {missoes.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Nenhuma missão para este dia. Toque em + para criar uma tarefa ou hábito.
          </p>
        ) : (
          <>
            {pendentesLista.length > 0 ? (
              <ul className="space-y-2">{pendentesLista.map(renderMissao)}</ul>
            ) : (
              <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-center text-sm">
                Todas as missões concluídas. 🎉
              </p>
            )}
            {concluidasLista.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={toggleConcluidas}
                  aria-expanded={concluidasAberto}
                  aria-controls="lista-concluidas"
                  className="text-muted-foreground hover:text-foreground flex h-11 w-full items-center justify-between rounded-lg px-1 text-sm font-semibold"
                >
                  Concluídas ({concluidasLista.length})
                  <ChevronDown
                    className={cn("size-4 transition-transform", concluidasAberto && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {concluidasAberto && (
                  <ul id="lista-concluidas" className="space-y-2">
                    {concluidasLista.map(renderMissao)}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {maus.length > 0 && (
        <section aria-labelledby="evitar" className="space-y-3">
          <h2 id="evitar" className="text-lg font-bold">
            Para evitar {isToday ? "hoje" : "no dia"}
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

      <AreasCard
        date={date}
        areas={snapshot.areas}
        habits={snapshot.habits}
        tasks={snapshot.tasks}
        logsByDate={logsByDate}
      />

      <AddFab date={date} today={today} />
      {editing && (
        <TaskFormDialog task={editing} isNew={false} open onOpenChange={(o) => !o && setEditing(null)} />
      )}
    </div>
  );
}
