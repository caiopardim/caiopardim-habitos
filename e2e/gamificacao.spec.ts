import { expect, test } from "@playwright/test";
import { cenarioLocal, dia, habitoCheck, perfil } from "./helpers";

test("7º dia: marco, medalha e evolução do avatar — sem repetir", async ({ page }) => {
  const logs = [-6, -5, -4, -3, -2, -1].map((n, i) => ({
    id: `l${i}`,
    habitId: "h1",
    data: dia(n),
    status: "feito",
    valor: null,
    concluidoEm: null,
  }));
  await cenarioLocal(page, {
    profile: perfil(),
    habits: [habitoCheck("h1", "Meditar")],
    logs,
    achievements: ["primeiro_passo", "seq_3", "perfeito_1"].map((codigo) => ({
      codigo,
      conquistadoEm: `${dia(-3)}T12:00:00Z`,
    })),
  });
  await page.goto("/hoje");
  await expect(page.getByText("Missões de hoje")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.getByRole("checkbox", { name: /Marcar Meditar/ }).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg.getByRole("heading")).toHaveText("7 dias seguidos!");
  await dlg.getByRole("button", { name: "Continuar" }).click();
  await expect(dlg.getByRole("heading")).toHaveText("Sete perfeitos");
  await dlg.getByRole("button", { name: "Continuar" }).click();
  await expect(dlg.getByRole("heading")).toHaveText("Seu avatar evoluiu: Aprendiz!");
  await page.keyboard.press("Escape");
  await expect(dlg).toHaveCount(0);

  await page.reload();
  await expect(page.getByText("Missões de hoje")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/conquistas");
  await expect(page.getByText(/5 de \d+ medalhas/)).toBeVisible();
});
