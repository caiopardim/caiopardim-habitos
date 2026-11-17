/** Imagem de compartilhamento (1080×1350, formato de feed) com a marca Zoryka, desenhada em canvas. */

export interface ShareCard {
  /** Emoji ou número em destaque, dentro da medalha. */
  destaque: string;
  /** SVG (ex.: o avatar) desenhado no lugar do destaque. */
  imagemSvg?: string;
  titulo: string;
  subtitulo: string;
}

const W = 1080;
const H = 1350;
const C = {
  fundo: "#14110f",
  creme: "#f7efe6",
  muted: "#b3a79b",
  rosa: "#f26d85",
  laranja: "#ff8a3d",
  amarelo: "#ffc247",
  trilha: "#3a322c",
};

/** Símbolo da marca (mesmas proporções de ZorykaMark: viewBox 120×70). */
function drawMark(ctx: CanvasRenderingContext2D, x: number, y: number, escala: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.lineCap = "round";
  ctx.lineWidth = 8;
  const arco = (r: number, ate: number, cor: string) => {
    ctx.beginPath();
    ctx.strokeStyle = cor;
    // ângulos do canvas crescem no sentido horário: 180° → (360° − ate)
    ctx.arc(60, 50, r, Math.PI, 2 * Math.PI - (ate * Math.PI) / 180);
    ctx.stroke();
  };
  arco(44, 0, C.trilha);
  arco(29, 0, C.trilha);
  arco(44, 28, C.rosa);
  arco(29, 58, C.laranja);
  ctx.beginPath();
  ctx.fillStyle = C.amarelo;
  ctx.arc(60, 50, 15, Math.PI, 2 * Math.PI);
  ctx.fill();
  ctx.beginPath();
  ctx.strokeStyle = C.creme;
  ctx.moveTo(8, 64);
  ctx.lineTo(112, 64);
  ctx.stroke();
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, texto: string, maxW: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const p of texto.split(" ")) {
    const teste = atual ? `${atual} ${p}` : p;
    if (ctx.measureText(teste).width > maxW && atual) {
      linhas.push(atual);
      atual = p;
    } else atual = teste;
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function svgToImage(svg: string): Promise<HTMLImageElement> {
  const fonte = svg.includes("xmlns=") ? svg : svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  const url = URL.createObjectURL(new Blob([fonte], { type: "image/svg+xml" }));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function renderShareCard(card: ShareCard): Promise<Blob> {
  // As fontes do app (next/font) têm nome gerado; usamos a família resolvida das variáveis CSS.
  const raiz = getComputedStyle(document.documentElement);
  const SORA = raiz.getPropertyValue("--font-sora").trim() || "sans-serif";
  const INTER = raiz.getPropertyValue("--font-inter").trim() || "sans-serif";
  await Promise.all([
    document.fonts.load(`700 64px ${SORA}`),
    document.fonts.load(`400 40px ${INTER}`),
  ]).catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = C.fundo;
  ctx.fillRect(0, 0, W, H);
  const brilho = ctx.createRadialGradient(W / 2, 520, 40, W / 2, 520, 620);
  brilho.addColorStop(0, "rgba(255,138,61,0.35)");
  brilho.addColorStop(1, "rgba(255,138,61,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, H);

  // medalha
  const cx = W / 2;
  const cy = 500;
  const anel = ctx.createLinearGradient(cx - 230, cy - 230, cx + 230, cy + 230);
  anel.addColorStop(0, C.rosa);
  anel.addColorStop(0.55, C.laranja);
  anel.addColorStop(1, C.amarelo);
  ctx.beginPath();
  ctx.fillStyle = "#1c1815";
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 34;
  ctx.strokeStyle = anel;
  ctx.beginPath();
  ctx.arc(cx, cy, 215, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const img = card.imagemSvg ? await svgToImage(card.imagemSvg).catch(() => null) : null;
  if (img) {
    ctx.drawImage(img, cx - 205, cy - 220, 410, 410);
  } else {
    const numero = /^\d+$/.test(card.destaque);
    ctx.fillStyle = C.creme;
    ctx.font = numero ? `700 190px ${SORA}` : "190px sans-serif";
    ctx.fillText(card.destaque, cx, cy + (numero ? 8 : 14));
  }

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.creme;
  ctx.font = `700 72px ${SORA}`;
  let y = 880;
  for (const l of wrap(ctx, card.titulo, 900)) {
    ctx.fillText(l, cx, y);
    y += 86;
  }
  ctx.fillStyle = C.muted;
  ctx.font = `400 40px ${INTER}`;
  y += 10;
  for (const l of wrap(ctx, card.subtitulo, 860)) {
    ctx.fillText(l, cx, y);
    y += 54;
  }

  // rodapé com a marca
  drawMark(ctx, cx - 200, 1170, 1.1);
  ctx.textAlign = "left";
  ctx.fillStyle = C.creme;
  ctx.font = `600 52px ${SORA}`;
  ctx.letterSpacing = "8px";
  ctx.fillText("ZORYKA", cx - 50, 1240);
  ctx.letterSpacing = "0px";
  ctx.textAlign = "center";
  ctx.fillStyle = C.muted;
  ctx.font = `400 32px ${INTER}`;
  ctx.fillText("sua evolução, um dia de cada vez", cx, 1310);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("falha ao gerar imagem"))), "image/png"),
  );
}

/** Compartilha a imagem (Web Share no celular) ou baixa o arquivo (desktop). */
export async function shareCard(card: ShareCard): Promise<"compartilhado" | "baixado" | "cancelado"> {
  const blob = await renderShareCard(card);
  const file = new File([blob], "zoryka-conquista.png", { type: "image/png" });
  const texto = `${card.titulo} — ${card.subtitulo} #Zoryka`;
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: card.titulo, text: texto });
      return "compartilhado";
    } catch {
      return "cancelado";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "baixado";
}
