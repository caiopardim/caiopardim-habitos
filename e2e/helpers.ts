import { expect, type Page } from "@playwright/test";

/** Entra na demonstração (60 dias de dados fictícios). */
export async function entrarDemo(page: Page) {
  await page.goto("/demo");
  await page.waitForURL("**/hoje");
  await expect(page.getByText("Missões de hoje")).toBeVisible();
}

/** Data de hoje (fuso de São Paulo) somada de `n` dias, no formato yyyy-MM-dd. */
export function dia(n = 0): string {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const d = new Date(`${hoje}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Grava um cenário no modo local antes de abrir o app. */
export async function cenarioLocal(page: Page, snapshot: Record<string, unknown>) {
  await page.goto("/offline");
  await page.evaluate((s) => localStorage.setItem("zoryka:local:v1", JSON.stringify(s)), snapshot);
}

export function perfil(over: Record<string, unknown> = {}) {
  return {
    id: "local-user",
    nome: "Teste",
    fuso: "America/Sao_Paulo",
    limiteSequencia: 0.6,
    onboardingConcluido: true,
    criadoEm: `${dia(-6)}T12:00:00Z`,
    ...over,
  };
}

export function habitoCheck(id: string, nome: string, over: Record<string, unknown> = {}) {
  return {
    id,
    areaId: null,
    tipo: "bom",
    nome,
    emoji: "🧘",
    cor: "#ff8a3d",
    metaTipo: "check",
    metaValor: null,
    unidade: null,
    diasSemana: [],
    dificuldade: "facil",
    horario: null,
    lembrete: false,
    inicio: dia(-6),
    arquivado: false,
    arquivadoEm: null,
    criadoEm: `${dia(-6)}T12:00:00Z`,
    ...over,
  };
}
