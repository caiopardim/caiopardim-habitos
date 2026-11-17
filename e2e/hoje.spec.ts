import { expect, test } from "@playwright/test";
import { entrarDemo } from "./helpers";

test.beforeEach(async ({ page }) => entrarDemo(page));

test("status do dia não diz 'tudo feito' antes da hora", async ({ page }) => {
  const status = page.locator('section[aria-labelledby="missoes"] p').first();
  for (let i = 0; i < 20; i++) {
    const c = page.getByRole("checkbox", { checked: false }).first();
    if (!(await c.count())) break;
    await c.click();
  }
  await expect(status).toHaveText("Missões concluídas · falta registrar 3 hábitos a evitar");
  const evitar = page.locator('section[aria-labelledby="evitar"] li');
  for (let i = 0; i < 3; i++) await evitar.nth(i).getByRole("button", { name: "Evitei" }).click();
  await expect(status).toHaveText("Dia perfeito ✨");
  await expect(page.getByRole("img", { name: /dia perfeito/ })).toBeVisible();
});

test("'Aconteceu' tem mensagem acolhedora e Desfazer", async ({ page }) => {
  const acucar = page.locator("li", { hasText: "Açúcar" });
  const contador = acucar.locator("p").nth(1);
  const antes = await contador.textContent();
  await acucar.getByRole("button", { name: "Aconteceu" }).click();
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Um dia não apaga o caminho" });
  await expect(toast).toContainText(/seu recorde de \d+ dias continua seu/);
  await expect(contador).toContainText("0 dias sem");
  await toast.getByRole("button", { name: "Desfazer" }).click();
  await expect(contador).toHaveText(antes!);
});

test("meta numérica com + e campo, e concluídas recolhidas", async ({ page }) => {
  await page.getByLabel("Quantidade de Ler").fill("20");
  await page.getByLabel("Quantidade de Ler").press("Enter");
  await expect(page.getByRole("button", { name: /^Concluídas \(1\)/ })).toBeVisible();
  await page.getByRole("button", { name: /Aumentar .* ml/ }).click();
  await expect(page.getByLabel("Quantidade de Beber água")).toHaveValue("300");
});

test("faixa mostra os últimos 7 dias e não vai para o futuro", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
  await expect(page.locator("ol li button").last()).toHaveAccessibleName(/\(hoje\)/);
  await page.getByRole("button", { name: "Semana anterior" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Olhando para trás");
  await page.getByRole("button", { name: "Voltar para hoje" }).click();
  await expect(page.getByRole("button", { name: "Próxima semana" })).toBeDisabled();
});

test("temporada e áreas da vida aparecem", async ({ page }) => {
  await expect(page.locator('section[aria-labelledby="temporada"]')).toContainText(/Temporada \d+/);
  await expect(page.locator('section[aria-labelledby="areas"] li')).toHaveCount(5);
});
