/**
 * O símbolo de um hábito é um emoji ("💧") ou um ícone da biblioteca lucide ("lucide:Droplet").
 * Fica no mesmo campo (habits.emoji) — sem mudar o banco.
 */
export const LUCIDE_PREFIX = "lucide:";

export const isLucide = (simbolo: string) => simbolo.startsWith(LUCIDE_PREFIX);
export const lucideName = (simbolo: string) => simbolo.slice(LUCIDE_PREFIX.length);

/** Para textos puros (notificações, <option>): o emoji, ou nada se for ícone. */
export const symbolText = (simbolo: string) => (isLucide(simbolo) ? "" : simbolo);
