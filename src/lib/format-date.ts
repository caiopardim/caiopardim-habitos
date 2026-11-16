import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateStr } from "./domain/types";

const d = (date: DateStr) => parseISO(`${date}T12:00:00`);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatLongDate = (date: DateStr) => cap(format(d(date), "EEEE, d 'de' MMMM", { locale: ptBR }));
export const formatShortDate = (date: DateStr) => format(d(date), "d 'de' MMM", { locale: ptBR });
export const formatDayNumber = (date: DateStr) => format(d(date), "d");
export const formatWeekdayShort = (date: DateStr) => format(d(date), "EEEEEE", { locale: ptBR });
export const formatMonthYear = (date: DateStr) => cap(format(d(date), "MMMM 'de' yyyy", { locale: ptBR }));

export function greeting(hour: number): string {
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}
