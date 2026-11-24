/**
 * Regrava os prints e o vídeo da página inicial a partir da demonstração.
 * Uso: npm run build && PORT=3100 npm run start   (em outro terminal)
 *      node scripts/landing-media.mjs
 * Gera public/landing/{hoje,evolucao,perfil,desktop}.webp, demo.mp4 e demo-poster.webp (precisa de ffmpeg).
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const tmp = mkdtempSync(join(tmpdir(), "zoryka-landing-"));
const tela = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, baseURL: BASE };
const b = await chromium.launch();

// Vídeo: check-in na tela Hoje e passada pela Evolução
const v = await b.newContext({
  ...tela,
  deviceScaleFactor: 1,
  recordVideo: { dir: tmp, size: tela.viewport },
});
const p = await v.newPage();
await p.goto("/demo");
await p.waitForURL(/hoje/);
await p.waitForTimeout(1500);
await p.evaluate(() => window.scrollTo({ top: 430, behavior: "smooth" }));
await p.waitForTimeout(1000);
for (let i = 0; i < 4; i++) {
  await p.getByRole("checkbox", { checked: false }).first().click();
  await p.waitForTimeout(850);
}
await p.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await p.waitForTimeout(1600);
await p.getByRole("link", { name: "Evolução" }).last().click();
await p.waitForTimeout(2200);
await p.evaluate(() => window.scrollTo({ top: 650, behavior: "smooth" }));
await p.waitForTimeout(1800);
await p.close();
await v.close();

// Prints em alta resolução
const s = await b.newContext({ ...tela, deviceScaleFactor: 2 });
const q = await s.newPage();
await q.goto("/demo");
await q.waitForURL(/hoje/);
for (let i = 0; i < 3; i++) await q.getByRole("checkbox", { checked: false }).first().click();
await q.waitForTimeout(1200);
await q.evaluate(() => window.scrollTo(0, 0));
await q.waitForTimeout(600);
const prints = { hoje: await q.screenshot() };
await q.goto("/evolucao");
await q.waitForTimeout(2000);
prints.evolucao = await q.screenshot();
await q.goto("/perfil");
await q.waitForTimeout(1200);
prints.perfil = await q.screenshot();
// Print de computador (aparece na janela de instalação do Chrome/Edge)
const d = await b.newContext({ viewport: { width: 1280, height: 800 }, baseURL: BASE });
const dp = await d.newPage();
await dp.goto("/demo");
await dp.waitForURL(/hoje/);
for (let i = 0; i < 3; i++) await dp.getByRole("checkbox", { checked: false }).first().click();
await dp.waitForTimeout(1200);
await dp.evaluate(() => window.scrollTo(0, 0));
await sharp(await dp.screenshot())
  .webp({ quality: 75 })
  .toFile("public/landing/desktop.webp");
await b.close();

for (const [nome, png] of Object.entries(prints)) {
  await sharp(png).resize(600).webp({ quality: 78 }).toFile(`public/landing/${nome}.webp`);
}
const webm = join(
  tmp,
  readdirSync(tmp).find((f) => f.endsWith(".webm")),
);
const ff = (...a) => execFileSync("ffmpeg", ["-v", "error", "-y", ...a]);
ff(
  "-ss",
  "1.4",
  "-i",
  webm,
  "-vf",
  "fps=24",
  "-c:v",
  "libx264",
  "-profile:v",
  "main",
  "-pix_fmt",
  "yuv420p",
  "-crf",
  "26",
  "-movflags",
  "+faststart",
  "-an",
  "public/landing/demo.mp4",
);
ff("-ss", "1.6", "-i", webm, "-frames:v", "1", join(tmp, "poster.png"));
await sharp(join(tmp, "poster.png")).webp({ quality: 75 }).toFile("public/landing/demo-poster.webp");
console.log("public/landing atualizado");
