/** Canais de atendimento (preencha pelas variáveis de ambiente). */
const env = (v: string | undefined) => v?.trim() || null;

export const SUPORTE = {
  email: env(process.env.NEXT_PUBLIC_CONTATO_EMAIL),
  /** Só dígitos, com DDI e DDD: 5511999998888 */
  whatsapp: env(process.env.NEXT_PUBLIC_SUPORTE_WHATSAPP)?.replace(/\D/g, "") || null,
  horario:
    env(process.env.NEXT_PUBLIC_SUPORTE_HORARIO) ?? "segunda a sexta, das 9h às 18h (horário de Brasília)",
};

export function whatsappLink(numero: string, texto = "Olá! Preciso de ajuda com a Zoryka."): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function mailtoLink(email: string, assunto: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(assunto)}`;
}
