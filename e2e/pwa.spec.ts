import { expect, test } from "@playwright/test";
import { entrarDemo } from "./helpers";

// Chromium completo: necessário para permissões de notificação e service worker.
test.use({ channel: "chromium" });

test("funciona offline depois da primeira visita", async ({ page, context }) => {
  await entrarDemo(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(1500);
  await context.setOffline(true);
  await page.goto("/hoje");
  await expect(page.getByText("Missões de hoje")).toBeVisible();
  await page.getByRole("link", { name: "Evolução" }).first().click();
  await expect(page.getByText("Pontuação do Dia").first()).toBeVisible();
  await page.goto("/recuperar-senha").catch(() => undefined);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Você está sem conexão");
  await context.setOffline(false);
});

test("push recebido vira notificação", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["notifications"], { origin: baseURL });
  await entrarDemo(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await context.newCDPSession(page);
  const registros: { registrationId: string; scopeURL: string; isDeleted: boolean }[] = [];
  cdp.on("ServiceWorker.workerRegistrationUpdated", (e) => registros.push(...e.registrations));
  await cdp.send("ServiceWorker.enable");
  // Reenvia até a notificação aparecer (o service worker pode ainda estar ativando).
  await expect(async () => {
    const reg = registros.filter((r) => r.scopeURL === `${baseURL}/` && !r.isDeleted).at(-1);
    expect(reg).toBeTruthy();
    await cdp.send("ServiceWorker.deliverPushMessage", {
      origin: baseURL!,
      registrationId: reg!.registrationId,
      data: JSON.stringify({ title: "💧 Hora de Beber água", body: "Meta de hoje: 3.000 ml", url: "/hoje" }),
    });
    const titulos = await page.evaluate(async () =>
      (await (await navigator.serviceWorker.getRegistration())!.getNotifications()).map((n) => n.title),
    );
    expect(titulos).toContain("💧 Hora de Beber água");
  }).toPass({ timeout: 20_000 });
});
