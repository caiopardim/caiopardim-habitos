import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarDemo } from "./helpers";

/** Na demonstração, "Ver o app como: Grátis" simula o plano grátis (sem cobrança real). */
async function verComoGratis(page: import("@playwright/test").Page) {
  await page.goto("/configuracoes");
  await page
    .getByRole("radiogroup", { name: "Ver o app como" })
    .getByRole("radio", { name: "Grátis" })
    .click();
}

test("plano grátis: limite de hábitos abre o convite ao Premium", async ({ page }) => {
  await entrarDemo(page);
  await verComoGratis(page);
  await page.goto("/habitos");
  await expect(page.getByText(/seus 8 hábitos seguem funcionando/)).toBeVisible();
  await page.getByRole("button", { name: "Novo" }).click();
  const dialogo = page.getByRole("dialog");
  await expect(dialogo.getByRole("heading", { name: "Acompanhe quantos hábitos quiser" })).toBeVisible();
  await dialogo.getByRole("link", { name: "Ver planos" }).click();
  await expect(page).toHaveURL(/\/planos$/);
  await expect(page.getByText("R$ 149,90")).toBeVisible();
  await page.getByRole("radio", { name: "Mensal" }).click();
  await expect(page.getByText("R$ 19,90")).toBeVisible();
});

test("plano grátis: Evolução limitada a 7 dias, insights e calendário com prévia", async ({ page }) => {
  await entrarDemo(page);
  await verComoGratis(page);
  await page.goto("/evolucao");
  await expect(page.getByRole("radio", { name: "7 dias" })).toHaveAttribute("aria-checked", "true");
  await page.getByRole("radio", { name: "30 dias (Premium)" }).click();
  await expect(page.getByRole("heading", { name: "Veja sua evolução completa" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByText("Descubra seus padrões")).toBeVisible();
  await expect(page.getByText("Seu ano inteiro num calendário")).toBeVisible();
  // conteúdo borrado fica fora da leitura de tela
  const r = await new AxeBuilder({
    page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"],
  })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(r.violations.map((v) => v.id)).toEqual([]);
});

test("teste grátis acabando mostra aviso na tela Hoje", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/configuracoes");
  await page
    .getByRole("radiogroup", { name: "Ver o app como" })
    .getByRole("radio", { name: "Teste" })
    .click();
  await page.goto("/hoje");
  const aviso = page.getByRole("complementary", { name: "Seu plano" });
  await expect(aviso).toContainText(/Faltam [23] dias|termina hoje/);
  await aviso.getByRole("button", { name: "Fechar aviso" }).click();
  await expect(aviso).toBeHidden();
  await page.reload();
  await expect(page.getByText("Missões de hoje")).toBeVisible();
  await expect(aviso).toBeHidden();
});

test("premium (padrão da demonstração) não mostra travas", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/evolucao");
  await expect(page.getByRole("radio", { name: "30 dias" })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByText("Recurso Premium")).toHaveCount(0);
});
