import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { entrarDemo } from "./helpers";

async function semViolacoes(page: Page, onde: string) {
  const r = await new AxeBuilder({
    page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"],
  })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(r.violations.map((v) => `${onde}: ${v.id}`)).toEqual([]);
}

test("página inicial: proposta, demonstração, preços, FAQ e SEO", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sua evolução");
  await expect(page.getByRole("link", { name: "Ver demonstração" }).first()).toHaveAttribute("href", "/demo");
  await expect(page.getByRole("heading", { name: "Preços" })).toBeVisible();
  await page.getByText("Preciso baixar numa loja de aplicativos?").click();
  await expect(page.getByText(/pode ser instalada na tela inicial/)).toBeVisible();
  // sem depoimentos inventados
  await expect(page.getByRole("heading", { name: "Quem usa, conta" })).toHaveCount(0);
  // cartão de compartilhamento
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og\.png$/);
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute("content", "pt_BR");
  await semViolacoes(page, "/");
});

test("quem já usa o app vai direto para o Hoje", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/");
  await expect(page).toHaveURL(/\/hoje$/);
});

test("robots, sitemap, vídeo e imagem públicos", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Disallow: /hoje");
  expect(robots).toContain("Sitemap:");
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
  expect((await request.get("/og.png")).headers()["content-type"]).toBe("image/png");
  expect((await request.get("/landing/demo.mp4")).headers()["content-type"]).toBe("video/mp4");
});

test("novidades: aviso de 'Novo' some depois de abrir a página", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/configuracoes");
  const novidades = page.getByRole("link", { name: /Novidades/ });
  await expect(novidades).toContainText("Novo");
  await novidades.click();
  await expect(page.getByRole("heading", { name: "Novidades", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lançamento da Zoryka" })).toBeVisible();
  await page.goto("/configuracoes");
  await expect(page.getByRole("link", { name: /Novidades/ })).not.toContainText("Novo");
});

test("sugestão sem conta oferece outros canais", async ({ page }) => {
  await entrarDemo(page);
  await page.goto("/configuracoes");
  await page.getByRole("button", { name: "Enviar sugestão" }).click();
  const dialogo = page.getByRole("dialog");
  await dialogo.getByRole("radio", { name: "Problema" }).click();
  await dialogo.getByLabel("O que aconteceu?").fill("O gráfico não carregou");
  await dialogo.getByRole("button", { name: "Enviar" }).click();
  await expect(dialogo.getByRole("status")).toContainText("Sem uma conta");
});
