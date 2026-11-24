import { BILLING_ENABLED } from "./config";

/**
 * Novidades (changelog). A mais recente primeiro. Para publicar uma novidade, adicione
 * uma entrada no topo com um `id` novo: quem ainda não viu ganha um aviso em Configurações.
 */
export interface Novidade {
  id: string;
  /** yyyy-MM-dd */
  data: string;
  titulo: string;
  itens: string[];
  /** Só aparece quando o recurso está ligado. */
  requer?: "billing";
}

const TODAS: Novidade[] = [
  {
    id: "2026-11-24-instalar",
    data: "2026-11-24",
    titulo: "Instale direto do navegador",
    itens: [
      "Passo a passo de instalação para Android, iPhone e computador, sem passar por loja.",
      "Atalhos ao segurar o ícone: Hoje, Novo hábito e Evolução.",
      "No computador, um QR code leva a Zoryka para o seu celular.",
    ],
  },
  {
    id: "2026-11-17-ajuda",
    data: "2026-11-17",
    titulo: "Suporte, novidades e sugestões",
    itens: [
      "Página de suporte com e-mail e WhatsApp.",
      "Esta página de novidades, com aviso em Configurações quando sair algo novo.",
      "Envie sugestões direto do app, em Configurações → Ajuda.",
    ],
  },
  {
    id: "2026-11-17-planos",
    data: "2026-11-17",
    titulo: "Planos e Premium",
    requer: "billing",
    itens: [
      "Plano grátis para sempre e 7 dias de Premium ao criar a conta, sem cartão.",
      "Premium mensal ou anual, com Pix ou cartão pelo Mercado Pago.",
      "Minha assinatura: acompanhe pagamentos e cancele a renovação quando quiser.",
    ],
  },
  {
    id: "2026-11-17-lancamento",
    data: "2026-11-17",
    titulo: "Lançamento da Zoryka",
    itens: [
      "Missões do dia com hábitos, tarefas e hábitos a evitar, XP e sequência com dia de descanso.",
      "Evolução com gráficos, calendário do ano, revisão da semana e insights.",
      "Avatar com 7 estágios, 25 medalhas, temporadas semanais e celebrações para compartilhar.",
      "Lembretes por notificação, uso sem internet e instalação na tela inicial.",
      "Exportar seus dados e excluir a conta a qualquer momento.",
    ],
  },
];

export const CHANGELOG: Novidade[] = TODAS.filter((n) => n.requer !== "billing" || BILLING_ENABLED);

export const ULTIMA_NOVIDADE = CHANGELOG[0]?.id ?? null;
export const CHAVE_NOVIDADES_VISTAS = "zoryka:novidades-vistas";
