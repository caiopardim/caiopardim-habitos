/**
 * Depoimentos da página inicial. Use SÓ depoimentos reais, com autorização por escrito
 * da pessoa para usar nome, foto e texto (guarde a autorização). Enquanto a lista estiver
 * vazia, a seção não aparece. Fotos em public/landing/depoimentos/.
 */
export interface Depoimento {
  nome: string;
  /** Ex.: "usa a Zoryka há 3 meses" */
  contexto: string;
  texto: string;
  /** Caminho em /public, ex.: "/landing/depoimentos/ana.webp" */
  foto?: string;
}

export const DEPOIMENTOS: Depoimento[] = [];
