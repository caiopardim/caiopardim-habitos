import { EDIT_WINDOW_DAYS } from "../config";
import type { DateStr } from "./types";

const DAY_MS = 86_400_000;

function toUtc(date: DateStr): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): DateStr {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Dia de calendário de `now` no fuso informado — nunca o dia UTC do servidor. */
export function todayInTz(timeZone: string, now: Date = new Date()): DateStr {
  // en-CA formata como yyyy-MM-dd
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Hora atual (0–23) no fuso informado. */
export function hourInTz(timeZone: string, now: Date = new Date()): number {
  const h = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hour12: false }).format(now);
  return Number(h) % 24;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function addDays(date: DateStr, n: number): DateStr {
  return fromUtc(toUtc(date) + n * DAY_MS);
}

/** b − a em dias. */
export function diffDays(a: DateStr, b: DateStr): number {
  return Math.round((toUtc(b) - toUtc(a)) / DAY_MS);
}

/** 0 = domingo … 6 = sábado */
export function weekday(date: DateStr): number {
  return new Date(toUtc(date)).getUTCDay();
}

/** Segunda-feira da semana de `date` (semana começa na segunda). */
export function weekStart(date: DateStr): DateStr {
  const wd = weekday(date);
  return addDays(date, wd === 0 ? -6 : 1 - wd);
}

/** Todos os dias de `from` a `to`, inclusive. */
export function eachDay(from: DateStr, to: DateStr): DateStr[] {
  const out: DateStr[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

/** Registros podem ser editados de hoje até `EDIT_WINDOW_DAYS` dias atrás; nunca no futuro. */
export function canEditDate(date: DateStr, today: DateStr, windowDays = EDIT_WINDOW_DAYS): boolean {
  const ago = diffDays(date, today);
  return ago >= 0 && ago <= windowDays;
}
