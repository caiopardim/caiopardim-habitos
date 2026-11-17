import { expect, test } from "@playwright/test";

test("onboarding completo até o primeiro check-in", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Começar grátis" }).first().click();
  await page.waitForURL("**/onboarding");
  const continuar = page.getByRole("button", { name: "Continuar" });
  await expect(continuar).toBeDisabled();

  await page.getByLabel("Como podemos te chamar?").fill("Caio");
  await page.getByRole("button", { name: /Cuidar da saúde/ }).click();
  await continuar.click();
  await expect(page.getByRole("button", { name: /Saúde & Corpo/ })).toHaveAttribute("aria-pressed", "true");
  await continuar.click();

  // limite de 5 hábitos para começar
  await page.getByRole("button", { name: /^Ler/ }).click();
  await page.getByRole("button", { name: /^Caminhar/ }).click();
  await expect(page.getByText("5 de 5")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Estudar/ })).toBeDisabled();
  await expect(page.getByText(/CVV/)).toBeVisible();
  await continuar.click();
  await page.getByRole("button", { name: "Continuar" }).click();

  // primeiro check-in guiado
  const irHoje = page.getByRole("button", { name: "Ir para Hoje" });
  await expect(irHoje).toBeDisabled();
  await page.getByRole("checkbox", { name: /Marcar Treinar/ }).click();
  await expect(page.getByText("Primeiro passo dado!")).toBeVisible();
  await irHoje.click();
  await page.waitForURL("**/hoje");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Caio");
});
