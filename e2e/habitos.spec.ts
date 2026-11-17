import { expect, test } from "@playwright/test";
import { entrarDemo } from "./helpers";

test("criar hábito com ícone, ver em Hoje, arquivar sem perder histórico", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/habitos?novo=bom");
  await page.getByLabel("Nome", { exact: true }).fill("Pedalar");
  await page.getByRole("radio", { name: "Ícone" }).click();
  await page.getByRole("button", { name: "Bicicleta" }).click();
  await page.getByRole("button", { name: "Criar hábito" }).click();
  const linha = page.locator("li", { hasText: "Pedalar" });
  await expect(linha).toBeVisible();

  await page.goto("/hoje");
  await expect(page.locator("li", { hasText: "Pedalar" })).toBeVisible();

  await page.goto("/habitos");
  await page.getByRole("button", { name: "Arquivar Pedalar" }).click();
  await page.getByRole("tab", { name: "Arquivados" }).click();
  await expect(page.locator("li", { hasText: "Pedalar" })).toBeVisible();
});

test("link do hábito abre a evolução dele", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/habitos");
  await page.getByRole("link", { name: "Ver evolução de Ler" }).click();
  await page.waitForURL("**/evolucao**");
  await expect(page.getByLabel("Escolher hábito")).not.toHaveValue("geral");
});
