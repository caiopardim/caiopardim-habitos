/**
 * Dados do responsável pelo app, usados na Política de Privacidade e nos Termos.
 * Preencha pelas variáveis de ambiente antes de abrir ao público.
 */
const v = (valor: string | undefined, rotulo: string) => valor?.trim() || `[a preencher: ${rotulo}]`;

export const LEGAL = {
  razaoSocial: v(process.env.NEXT_PUBLIC_LEGAL_RAZAO_SOCIAL, "razão social ou nome do responsável"),
  documento: v(process.env.NEXT_PUBLIC_LEGAL_DOCUMENTO, "CNPJ ou CPF"),
  endereco: v(process.env.NEXT_PUBLIC_LEGAL_ENDERECO, "endereço"),
  email: v(process.env.NEXT_PUBLIC_CONTATO_EMAIL, "e-mail de contato"),
  encarregado: v(process.env.NEXT_PUBLIC_LEGAL_ENCARREGADO, "nome do encarregado de dados (DPO)"),
  foro: v(process.env.NEXT_PUBLIC_LEGAL_CIDADE, "cidade/UF"),
  /** Versão dos documentos (mude ao alterar o texto: novo aceite pode ser pedido). */
  versao: "2026-11-17",
  vigencia: "17 de novembro de 2026",
};

export const legalPreenchido = () => !Object.values(LEGAL).some((x) => x.startsWith("[a preencher"));
