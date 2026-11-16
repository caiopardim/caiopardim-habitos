import type { DateStr, Habit, LifeArea } from "./domain/types";
import { AREAS, type BadHabitTemplate, type GoodHabitTemplate } from "./templates";
import { newId } from "./utils";

export function areasFromTemplates(emFoco: Set<string>): LifeArea[] {
  return AREAS.map((a, i) => ({
    id: newId(),
    nome: a.nome,
    cor: a.cor,
    ordem: i,
    emFoco: emFoco.has(a.chave),
  }));
}

function areaFor(areas: LifeArea[], chave: string): LifeArea | undefined {
  const nome = AREAS.find((a) => a.chave === chave)?.nome;
  return areas.find((a) => a.nome === nome);
}

export function habitFromGoodTemplate(t: GoodHabitTemplate, areas: LifeArea[], today: DateStr): Habit {
  const area = areaFor(areas, t.area);
  return {
    id: newId(),
    areaId: area?.id ?? null,
    tipo: "bom",
    nome: t.nome,
    emoji: t.emoji,
    cor: area?.cor ?? "#a3e635",
    metaTipo: t.metaTipo,
    metaValor: t.metaValor,
    unidade: t.unidade,
    diasSemana: [],
    dificuldade: t.dificuldade,
    horario: t.horario,
    inicio: today,
    arquivado: false,
    arquivadoEm: null,
    criadoEm: new Date().toISOString(),
  };
}

export function habitFromBadTemplate(t: BadHabitTemplate, areas: LifeArea[], today: DateStr): Habit {
  const area = areaFor(areas, t.area);
  return {
    id: newId(),
    areaId: area?.id ?? null,
    tipo: "mau",
    nome: t.nome,
    emoji: t.emoji,
    cor: "#f87171",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    diasSemana: [],
    dificuldade: "media",
    horario: null,
    inicio: today,
    arquivado: false,
    arquivadoEm: null,
    criadoEm: new Date().toISOString(),
  };
}

export function blankHabit(tipo: Habit["tipo"], today: DateStr): Habit {
  return {
    id: newId(),
    areaId: null,
    tipo,
    nome: "",
    emoji: tipo === "bom" ? "✅" : "🚫",
    cor: tipo === "bom" ? "#a3e635" : "#f87171",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    diasSemana: [],
    dificuldade: "media",
    horario: null,
    inicio: today,
    arquivado: false,
    arquivadoEm: null,
    criadoEm: new Date().toISOString(),
  };
}
