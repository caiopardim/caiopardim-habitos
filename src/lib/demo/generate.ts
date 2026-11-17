import { addDays, eachDay } from "../domain/dates";
import { isHabitScheduled } from "../domain/day";
import type { DateStr, Habit, HabitLog, LifeArea, Profile, Task } from "../domain/types";
import { AREAS, BAD_HABIT_TEMPLATES, GOOD_HABIT_TEMPLATES } from "../templates";
import type { Snapshot } from "../data/types";

/** PRNG determinístico (mulberry32) para os dados de exemplo serem sempre iguais. */
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type IdFn = () => string;

/**
 * Gera ~`dias` de histórico realista: começa irregular e melhora com o tempo,
 * com alguns dias ruins no meio (queda no gráfico, não recomeço).
 */
export function generateDemoData(opts: {
  userId: string;
  today: DateStr;
  dias?: number;
  newId: IdFn;
  nome?: string;
}): Snapshot {
  const { userId, today, newId } = opts;
  const dias = opts.dias ?? 60;
  const rand = rng(42);
  const start = addDays(today, -(dias - 1));

  const areas: LifeArea[] = AREAS.map((a, i) => ({
    id: newId(),
    nome: a.nome,
    cor: a.cor,
    ordem: i,
    emFoco: true,
  }));
  const areaId = (chave: string) => areas[AREAS.findIndex((a) => a.chave === chave)]?.id ?? null;

  const bons = ["agua", "ler", "treinar", "meditar", "dormir"].map((k): Habit => {
    const t = GOOD_HABIT_TEMPLATES.find((g) => g.chave === k)!;
    return {
      id: newId(),
      areaId: areaId(t.area),
      tipo: "bom",
      nome: t.nome,
      emoji: t.emoji,
      cor: AREAS.find((a) => a.chave === t.area)!.cor,
      metaTipo: t.metaTipo,
      metaValor: t.metaValor,
      unidade: t.unidade,
      diasSemana: k === "treinar" ? [1, 2, 3, 4, 5] : [],
      dificuldade: t.dificuldade,
      horario: t.horario,
      inicio: start,
      arquivado: false,
      arquivadoEm: null,
      criadoEm: `${start}T12:00:00Z`,
    };
  });

  const maus = ["redes", "alcool", "acucar"].map((k): Habit => {
    const t = BAD_HABIT_TEMPLATES.find((b) => b.chave === k)!;
    return {
      id: newId(),
      areaId: areaId(t.area),
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
      inicio: start,
      arquivado: false,
      arquivadoEm: null,
      criadoEm: `${start}T12:00:00Z`,
    };
  });

  const habits = [...bons, ...maus];
  const logs: HabitLog[] = [];
  const tasks: Task[] = [];

  // Hoje fica sem registros para o usuário testar o check-in.
  const passado = eachDay(start, addDays(today, -1));
  passado.forEach((d, i) => {
    const progresso = i / passado.length; // 0 → 1: a constância melhora com o tempo
    const diaRuim = rand() < 0.08;
    const chance = diaRuim ? 0.2 : 0.45 + progresso * 0.45;

    for (const h of habits) {
      if (!isHabitScheduled(h, d)) continue;
      const r = rand();
      if (h.tipo === "mau") {
        const aconteceu = r < (diaRuim ? 0.6 : 0.3 - progresso * 0.22);
        if (rand() < 0.92) {
          logs.push({
            id: newId(),
            habitId: h.id,
            data: d,
            status: aconteceu ? "aconteceu" : "evitei",
            valor: null,
            concluidoEm: null,
          });
        }
        continue;
      }
      if (r > chance) continue;
      const hora = `${d}T${String(7 + Math.floor(rand() * 14)).padStart(2, "0")}:00:00-03:00`;
      if (h.metaTipo === "quantidade" && h.metaValor) {
        const frac = rand() < 0.7 ? 1 : 0.3 + rand() * 0.6;
        const valor = Math.round(h.metaValor * frac);
        logs.push({
          id: newId(),
          habitId: h.id,
          data: d,
          status: frac >= 1 ? "feito" : "parcial",
          valor,
          concluidoEm: hora,
        });
      } else {
        logs.push({ id: newId(), habitId: h.id, data: d, status: "feito", valor: null, concluidoEm: hora });
      }
    }

    if (i % 4 === 0) {
      const feita = rand() < chance;
      tasks.push({
        id: newId(),
        areaId: areaId(["trabalho", "pessoal", "mente"][i % 3]),
        titulo: [
          "Responder e-mails pendentes",
          "Ligar para a mãe",
          "Revisar apresentação",
          "Organizar a mesa",
          "Pagar contas",
        ][i % 5],
        prioridade: (["alta", "media", "baixa"] as const)[i % 3],
        dificuldade: "facil",
        data: d,
        concluida: feita,
        concluidaEm: feita ? `${d}T18:00:00-03:00` : null,
      });
    }
  });

  tasks.push(
    {
      id: newId(),
      areaId: areaId("trabalho"),
      titulo: "Enviar relatório semanal",
      prioridade: "alta",
      dificuldade: "media",
      data: today,
      concluida: false,
      concluidaEm: null,
    },
    {
      id: newId(),
      areaId: areaId("pessoal"),
      titulo: "Comprar presente de aniversário",
      prioridade: "media",
      dificuldade: "facil",
      data: today,
      concluida: false,
      concluidaEm: null,
    },
  );

  const profile: Profile = {
    id: userId,
    nome: opts.nome ?? "Visitante",
    fuso: "America/Sao_Paulo",
    limiteSequencia: 0.6,
    xpTotal: 0,
    nivel: 1,
    onboardingConcluido: true,
    objetivo: "equilibrio",
    lembreteHorario: "21:00",
    criadoEm: `${start}T12:00:00Z`,
  };

  // Um dia de descanso usado há duas semanas, para a proteção aparecer no histórico.
  return { profile, areas, habits, tasks, logs, restDays: [addDays(today, -15)] };
}
