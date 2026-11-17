import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarDemo } from "./helpers";

const TELAS = [
  "/hoje",
  "/habitos",
  "/evolucao",
  "/perfil",
  "/conquistas",
  "/configuracoes",
  "/planos",
  "/assinatura",
];

for (const tema of ["dark", "light"] as const) {
  test(`sem violações WCAG 2.1 AA (tema ${tema === "dark" ? "escuro" : "claro"})`, async ({ page }) => {
    await entrarDemo(page);
    await page.evaluate((t) => localStorage.setItem("theme", t), tema);
    for (const tela of [...TELAS, "/entrar", "/privacidade", "/termos"]) {
      await page.goto(tela);
      await page.waitForTimeout(700);
      // o axe traz o próprio tipo de Page (outra versão do playwright-core)
      const r = await new AxeBuilder({
        page: page as unknown as ConstructorParameters<typeof AxeBuilder>[0]["page"],
      })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(r.violations.map((v) => `${tela}: ${v.id}`)).toEqual([]);
    }
  });
}

test("alvos de toque de pelo menos 44 px", async ({ page }) => {
  await entrarDemo(page);
  for (const tela of TELAS) {
    await page.goto(tela);
    await page.waitForTimeout(700);
    const pequenos = await page.evaluate(() => {
      const out: string[] = [];
      for (const el of document.querySelectorAll<HTMLElement>(
        "button, a[href], select, [role=checkbox], [role=radio], [role=tab], summary",
      )) {
        const r = el.getBoundingClientRect();
        if (!r.width || el.closest("[aria-hidden=true]")) continue;
        if (el.tagName === "A" && el.closest("p") && r.height < 30) continue; // link dentro de texto
        if (r.width < 44 || r.height < 44)
          out.push(
            `${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)} ${Math.round(r.width)}x${Math.round(r.height)}`,
          );
      }
      return out;
    });
    expect(pequenos, tela).toEqual([]);
  }
});

for (const largura of [360, 768, 1440]) {
  test(`sem rolagem horizontal em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 });
    await entrarDemo(page);
    for (const tela of TELAS) {
      await page.goto(tela);
      await page.waitForTimeout(500);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
        tela,
      ).toBe(true);
    }
  });
}

test("páginas legais abertas sem login, com direitos e contato", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Política de privacidade");
  await expect(page.getByText(/Configurações → Excluir minha conta/).first()).toBeVisible();
  await page.getByRole("link", { name: "Termos de uso" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termos de uso");
});
