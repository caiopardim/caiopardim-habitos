import { expect, test } from "@playwright/test";
import { cenarioLocal, entrarDemo, perfil } from "./helpers";

test("estado vazio pede 3 dias de registro", async ({ page }) => {
  await cenarioLocal(page, { profile: perfil() });
  await page.goto("/evolucao");
  await expect(page.getByText("Registre 3 dias para ver seu primeiro gráfico")).toBeVisible();
});

test("gráficos, períodos, insights e revisão semanal", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/evolucao");
  await expect(page.locator('section[aria-labelledby="pontuacao"] .recharts-line-curve')).toBeVisible();
  await expect(page.locator("#revisao")).toContainText("Revisão da semana");
  await expect(page.locator('section[aria-labelledby="insights"] li').first()).toBeVisible();

  await page.getByRole("radio", { name: "1 ano" }).click();
  await expect(page.getByText(/de 20\d\d – /)).toBeVisible();
  await page.getByRole("radio", { name: "Hoje", exact: true }).click();
  await expect(page.locator('section[aria-labelledby="pontuacao"]')).toHaveCount(0);

  await page.getByRole("radio", { name: "30 dias" }).click();
  await page.getByLabel("Escolher hábito").selectOption({ label: "💧 Beber água" });
  await expect(page.locator('section[aria-labelledby="por-habito"]')).toContainText("Total (ml)");
  await expect(page.locator('section[aria-labelledby="constancia"] rect').first()).toBeVisible();
});
