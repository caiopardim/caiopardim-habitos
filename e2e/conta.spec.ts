import { expect, test } from "@playwright/test";
import { cenarioLocal, entrarDemo, habitoCheck, perfil } from "./helpers";

test("demonstração não mistura com os dados do modo local", async ({ page }) => {
  await cenarioLocal(page, { profile: perfil({ nome: "Real" }), habits: [habitoCheck("h1", "Meu hábito")] });
  await entrarDemo(page);
  await expect(page.getByText("Demonstração com dados fictícios").filter({ visible: true })).toBeVisible();
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Sair da demonstração" }).click();
  await page.waitForURL(/hoje|onboarding/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Real");
});

test("exportar CSV e apagar dados com confirmação", async ({ page }) => {
  await cenarioLocal(page, { profile: perfil(), habits: [habitoCheck("h1", "Meditar")] });
  await page.goto("/configuracoes");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "CSV" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^zoryka-\d{4}-\d{2}-\d{2}\.csv$/);

  await page.getByRole("button", { name: "Apagar todos os dados deste navegador" }).click();
  const apagar = page.getByRole("button", { name: "Apagar dados" });
  await expect(apagar).toBeDisabled();
  await page.getByLabel(/digite EXCLUIR/).fill("excluir");
  await apagar.click();
  await page.waitForURL("**/onboarding");
});
