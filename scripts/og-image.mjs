/**
 * Gera public/og.png (1200×630), a imagem que aparece ao compartilhar o link.
 * Uso: node scripts/og-image.mjs   (precisa do Playwright com Chromium)
 */
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const fonte = (f) => `data:font/woff2;base64,${readFileSync(`src/app/fonts/${f}`).toString("base64")}`;
const marca = readFileSync("src/app/icon.svg", "utf8")
  .replace(/<rect[^>]*\/>/, "") // sem o fundo quadrado do ícone
  .replace('viewBox="0 0 512 512"', 'viewBox="90 150 332 210"');

const html = `<!doctype html><html><head><style>
@font-face { font-family: Sora; src: url(${fonte("sora-latin.woff2")}) format("woff2"); font-weight: 100 800; }
@font-face { font-family: Inter; src: url(${fonte("inter-latin.woff2")}) format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; background: #14110f; color: #f7efe6; font-family: Inter; overflow: hidden;
  display: flex; flex-direction: column; justify-content: center; padding: 0 96px; position: relative; }
.brilho { position: absolute; width: 760px; height: 760px; right: -220px; top: -260px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255,138,61,.28), rgba(242,109,133,.10) 45%, transparent 70%); }
.topo { display: flex; align-items: center; gap: 28px; }
.topo svg { width: 190px; height: auto; }
.nome { font-family: Sora; font-weight: 600; font-size: 64px; letter-spacing: .14em; }
h1 { font-family: Sora; font-weight: 700; font-size: 66px; line-height: 1.08; margin-top: 48px; max-width: 900px; }
h1 span { background: linear-gradient(90deg, #f26d85, #ff8a3d, #ffc247); -webkit-background-clip: text; color: transparent; }
p { margin-top: 24px; font-size: 30px; color: #b8aa9c; }
.barra { position: absolute; left: 0; right: 0; bottom: 0; height: 12px; background: linear-gradient(90deg, #f26d85, #ff8a3d, #ffc247); }
</style></head><body><div class="brilho"></div>
<div class="topo">${marca}<span class="nome">ZORYKA</span></div>
<h1>Sua evolução, <span>um dia de cada vez.</span></h1>
<p>Hábitos, metas e progresso em dados — no celular e no computador.</p>
<div class="barra"></div></body></html>`;

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
await p.setContent(html);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: "public/og.png" });
await b.close();
console.log("public/og.png gerado");
