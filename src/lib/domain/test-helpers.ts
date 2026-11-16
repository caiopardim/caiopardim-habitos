import type { Habit, HabitLog, Task } from "./types";

let seq = 0;
const id = () => `id-${++seq}`;

export function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: id(),
    areaId: null,
    tipo: "bom",
    nome: "Hábito",
    emoji: "✅",
    cor: "#a3e635",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    diasSemana: [],
    dificuldade: "media",
    horario: null,
    inicio: "2026-01-01",
    arquivado: false,
    arquivadoEm: null,
    criadoEm: "2026-01-01T00:00:00Z",
    ...over,
  };
}

export function log(habitId: string, data: string, over: Partial<HabitLog> = {}): HabitLog {
  return { id: id(), habitId, data, status: "feito", valor: null, concluidoEm: null, ...over };
}

export function task(over: Partial<Task> = {}): Task {
  return {
    id: id(),
    areaId: null,
    titulo: "Tarefa",
    prioridade: "media",
    dificuldade: "media",
    data: "2026-03-10",
    concluida: false,
    concluidaEm: null,
    ...over,
  };
}

export function logsMap(...ls: HabitLog[]): Map<string, HabitLog> {
  return new Map(ls.map((l) => [l.habitId, l]));
}
