import type { Dificuldade, MetaTipo } from "./domain/types";

export interface AreaTemplate {
  chave: string;
  nome: string;
  cor: string;
  emoji: string;
}

export const AREAS: AreaTemplate[] = [
  { chave: "espiritual", nome: "Espiritual", cor: "#a78bfa", emoji: "🙏" },
  { chave: "saude", nome: "Saúde & Corpo", cor: "#34d399", emoji: "💪" },
  { chave: "mente", nome: "Mente & Estudo", cor: "#60a5fa", emoji: "📚" },
  { chave: "trabalho", nome: "Trabalho & Carreira", cor: "#fbbf24", emoji: "💼" },
  { chave: "pessoal", nome: "Pessoal & Relações", cor: "#f472b6", emoji: "❤️" },
];

export interface GoodHabitTemplate {
  chave: string;
  nome: string;
  emoji: string;
  area: string;
  metaTipo: MetaTipo;
  metaValor: number | null;
  unidade: string | null;
  dificuldade: Dificuldade;
  horario: string | null;
}

export const GOOD_HABIT_TEMPLATES: GoodHabitTemplate[] = [
  {
    chave: "agua",
    nome: "Beber água",
    emoji: "💧",
    area: "saude",
    metaTipo: "quantidade",
    metaValor: 3000,
    unidade: "ml",
    dificuldade: "facil",
    horario: null,
  },
  {
    chave: "ler",
    nome: "Ler",
    emoji: "📖",
    area: "mente",
    metaTipo: "quantidade",
    metaValor: 20,
    unidade: "páginas",
    dificuldade: "media",
    horario: "21:00",
  },
  {
    chave: "treinar",
    nome: "Treinar",
    emoji: "🏋️",
    area: "saude",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    dificuldade: "dificil",
    horario: "07:00",
  },
  {
    chave: "meditar",
    nome: "Meditar / Orar",
    emoji: "🧘",
    area: "espiritual",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    dificuldade: "facil",
    horario: "06:30",
  },
  {
    chave: "dormir",
    nome: "Dormir antes das 23h",
    emoji: "😴",
    area: "saude",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    dificuldade: "media",
    horario: "23:00",
  },
  {
    chave: "estudar",
    nome: "Estudar",
    emoji: "🎓",
    area: "mente",
    metaTipo: "quantidade",
    metaValor: 1,
    unidade: "h",
    dificuldade: "dificil",
    horario: null,
  },
  {
    chave: "caminhar",
    nome: "Caminhar",
    emoji: "🚶",
    area: "saude",
    metaTipo: "quantidade",
    metaValor: 5,
    unidade: "km",
    dificuldade: "media",
    horario: null,
  },
  {
    chave: "foco",
    nome: "Trabalho focado",
    emoji: "🎯",
    area: "trabalho",
    metaTipo: "quantidade",
    metaValor: 4,
    unidade: "h",
    dificuldade: "dificil",
    horario: "09:00",
  },
  {
    chave: "familia",
    nome: "Tempo com a família",
    emoji: "👨‍👩‍👧",
    area: "pessoal",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    dificuldade: "facil",
    horario: null,
  },
  {
    chave: "gratidao",
    nome: "Diário de gratidão",
    emoji: "✍️",
    area: "espiritual",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    dificuldade: "facil",
    horario: "22:00",
  },
];

export interface BadHabitTemplate {
  chave: string;
  nome: string;
  emoji: string;
  area: string;
}

export const BAD_HABIT_TEMPLATES: BadHabitTemplate[] = [
  { chave: "redes", nome: "Redes sociais em excesso", emoji: "📱", area: "mente" },
  { chave: "alcool", nome: "Álcool", emoji: "🍺", area: "saude" },
  { chave: "acucar", nome: "Açúcar", emoji: "🍬", area: "saude" },
  { chave: "cafeina", nome: "Cafeína à noite", emoji: "☕", area: "saude" },
  { chave: "cigarro", nome: "Cigarro", emoji: "🚬", area: "saude" },
  { chave: "procrastinar", nome: "Procrastinar", emoji: "⏳", area: "trabalho" },
  { chave: "pornografia", nome: "Pornografia", emoji: "🔞", area: "pessoal" },
  { chave: "jogos", nome: "Jogos em excesso", emoji: "🎮", area: "mente" },
];

export const EMOJI_SUGESTOES = [
  "✅",
  "💧",
  "📖",
  "🏋️",
  "🧘",
  "😴",
  "🎓",
  "🚶",
  "🎯",
  "✍️",
  "🥗",
  "🎸",
  "🧹",
  "💊",
  "🙏",
  "📵",
  "🍺",
  "🍬",
  "☕",
  "🚬",
  "🎮",
  "🍔",
];

export const DIFICULDADE_LABEL: Record<Dificuldade, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export const PRIORIDADE_LABEL = { alta: "Alta", media: "Média", baixa: "Baixa" } as const;

export const DIAS_SEMANA_CURTO = ["D", "S", "T", "Q", "Q", "S", "S"];
export const DIAS_SEMANA_NOME = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Limites sugeridos no onboarding: começar com pouco reduz o abandono. */
export const ONBOARDING_MAX_BONS = 5;
export const ONBOARDING_MAX_MAUS = 3;

export interface Objetivo {
  chave: string;
  titulo: string;
  emoji: string;
  areas: string[];
  bons: string[];
  maus: string[];
}

/** Objetivo principal → áreas e hábitos sugeridos no onboarding. */
export const OBJETIVOS: Objetivo[] = [
  {
    chave: "saude",
    titulo: "Cuidar da saúde e do corpo",
    emoji: "💪",
    areas: ["saude"],
    bons: ["agua", "treinar", "dormir"],
    maus: ["acucar"],
  },
  {
    chave: "estudo",
    titulo: "Estudar e aprender com constância",
    emoji: "📚",
    areas: ["mente"],
    bons: ["ler", "estudar"],
    maus: ["redes"],
  },
  {
    chave: "produtividade",
    titulo: "Ser mais produtivo no trabalho",
    emoji: "🎯",
    areas: ["trabalho", "mente"],
    bons: ["foco", "ler"],
    maus: ["procrastinar"],
  },
  {
    chave: "espiritual",
    titulo: "Cuidar da mente e da espiritualidade",
    emoji: "🙏",
    areas: ["espiritual", "pessoal"],
    bons: ["meditar", "gratidao"],
    maus: ["redes"],
  },
  {
    chave: "vicio",
    titulo: "Largar um vício",
    emoji: "🔓",
    areas: ["saude", "pessoal"],
    bons: ["caminhar", "meditar"],
    maus: ["alcool"],
  },
  {
    chave: "equilibrio",
    titulo: "Equilíbrio em todas as áreas",
    emoji: "⚖️",
    areas: ["saude", "mente", "pessoal"],
    bons: ["agua", "ler", "meditar"],
    maus: ["redes"],
  },
];
