import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function newId(): string {
  return crypto.randomUUID();
}

const nf = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
export function formatNumber(n: number): string {
  return nf.format(n);
}

export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
