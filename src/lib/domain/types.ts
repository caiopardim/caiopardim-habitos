/** Datas de calendário do usuário, sempre no formato `yyyy-MM-dd` (no fuso dele). */
export type DateStr = string;

export type Dificuldade = "facil" | "media" | "dificil";
export type Prioridade = "alta" | "media" | "baixa";
export type HabitTipo = "bom" | "mau";
export type MetaTipo = "check" | "quantidade";
export type LogStatus = "feito" | "parcial" | "nao_feito" | "evitei" | "aconteceu";

export interface Profile {
  id: string;
  nome: string;
  fuso: string;
  /** 0–1: execução mínima para o dia contar na sequência. */
  limiteSequencia: number;
  xpTotal: number;
  nivel: number;
  onboardingConcluido: boolean;
  criadoEm: string;
}

export interface LifeArea {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  emFoco: boolean;
}

export interface Habit {
  id: string;
  areaId: string | null;
  tipo: HabitTipo;
  nome: string;
  emoji: string;
  cor: string;
  metaTipo: MetaTipo;
  metaValor: number | null;
  unidade: string | null;
  /** 0 = domingo … 6 = sábado. Vazio = todos os dias. */
  diasSemana: number[];
  dificuldade: Dificuldade;
  horario: string | null;
  /** Primeiro dia em que o hábito vale (bons: criação; maus: início do controle). */
  inicio: DateStr;
  arquivado: boolean;
  /** Dia do arquivamento: o hábito deixa de ser previsto a partir dele. */
  arquivadoEm: DateStr | null;
  criadoEm: string;
}

export interface Task {
  id: string;
  areaId: string | null;
  titulo: string;
  prioridade: Prioridade;
  dificuldade: Dificuldade;
  data: DateStr;
  concluida: boolean;
  concluidaEm: string | null;
}

export interface HabitLog {
  id: string;
  habitId: string;
  data: DateStr;
  status: LogStatus;
  valor: number | null;
  concluidoEm: string | null;
}

export interface DaySummary {
  data: DateStr;
  /** Há algum item previsto no dia? Dias sem itens não contam nem quebram a sequência. */
  temItens: boolean;
  totalItens: number;
  /** Soma das frações concluídas (parcial conta proporcionalmente). */
  concluidos: number;
  /** 0–1 */
  execucao: number;
  /** 0–100 */
  pontuacao: number;
  xpGanho: number;
  diaPerfeito: boolean;
  contaSequencia: boolean;
  maus: { previstos: number; evitados: number; aconteceram: number };
}
