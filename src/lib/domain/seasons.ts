import { addDays, diffDays } from "./dates";
import { validRestDays } from "./streak";
import type { DateStr, DaySummary } from "./types";

/** Cada temporada é um desafio de 7 dias seguidos. */
export const SEASON_DAYS = 7;

/** Média mínima da Pontuação do Dia: começa em 50, +3 por temporada, teto 90. */
export function seasonGoal(numero: number): number {
  return Math.min(90, 50 + 3 * (numero - 1));
}

export type SeasonStatus = "em_andamento" | "no_caminho" | "em_risco" | "concluida" | "nao_atingida";

export const SEASON_STATUS_LABEL: Record<SeasonStatus, string> = {
  em_andamento: "Em andamento",
  no_caminho: "No caminho",
  em_risco: "Em risco",
  concluida: "Concluída",
  nao_atingida: "Não atingida",
};

export interface SeasonRecord {
  numero: number;
  inicio: DateStr;
  fim: DateStr;
  meta: number;
  /** Média da Pontuação nos dias válidos da janela (null = nenhum dia válido). */
  media: number | null;
  status: SeasonStatus;
}

export interface CurrentSeason extends SeasonRecord {
  /** 1–7 */
  dia: number;
  /** Dias que já entraram na média (antes de hoje). */
  diasContados: number;
}

export interface SeasonsResult {
  atual: CurrentSeason;
  /** Temporadas encerradas, da mais antiga para a mais recente. */
  historico: SeasonRecord[];
  /** Maior temporada alcançada (nunca regride). */
  recorde: number;
  concluidas: number;
}

/**
 * Média da janela: ignora dias sem itens previstos e dias de descanso válidos
 * (o descanso protege a temporada assim como protege a sequência).
 */
function windowAverage(
  summaries: Map<DateStr, DaySummary>,
  descanso: Set<DateStr>,
  from: DateStr,
  toExclusive: DateStr,
): { media: number | null; dias: number } {
  let soma = 0;
  let dias = 0;
  for (let d = from; d < toExclusive; d = addDays(d, 1)) {
    const s = summaries.get(d);
    if (!s?.temItens || descanso.has(d)) continue;
    soma += s.pontuacao;
    dias += 1;
  }
  return { media: dias ? soma / dias : null, dias };
}

/**
 * Temporadas em sequência a partir do primeiro dia de uso.
 * Ao fim dos 7 dias: atingiu a meta → avança; senão repete a mesma temporada (sem perder as anteriores).
 * A temporada atual usa os dias anteriores a hoje (hoje ainda está em aberto).
 */
export function computeSeasons(
  summaries: Map<DateStr, DaySummary>,
  restDays: Iterable<DateStr>,
  start: DateStr,
  today: DateStr,
): SeasonsResult {
  const descanso = validRestDays(restDays);
  const historico: SeasonRecord[] = [];
  let numero = 1;
  let inicio = start > today ? today : start;

  // Fecha todas as janelas que já terminaram (último dia antes de hoje).
  while (addDays(inicio, SEASON_DAYS - 1) < today) {
    const fim = addDays(inicio, SEASON_DAYS - 1);
    const meta = seasonGoal(numero);
    const { media } = windowAverage(summaries, descanso, inicio, addDays(fim, 1));
    const ok = media !== null && media >= meta;
    historico.push({ numero, inicio, fim, meta, media, status: ok ? "concluida" : "nao_atingida" });
    if (ok) numero += 1;
    inicio = addDays(fim, 1);
  }

  const meta = seasonGoal(numero);
  const { media, dias } = windowAverage(summaries, descanso, inicio, today);
  const status: SeasonStatus = media === null ? "em_andamento" : media >= meta ? "no_caminho" : "em_risco";

  return {
    atual: {
      numero,
      inicio,
      fim: addDays(inicio, SEASON_DAYS - 1),
      meta,
      media,
      status,
      dia: diffDays(inicio, today) + 1,
      diasContados: dias,
    },
    historico,
    recorde: numero,
    concluidas: historico.filter((h) => h.status === "concluida").length,
  };
}
