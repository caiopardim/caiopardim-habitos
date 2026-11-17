"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Share2 } from "lucide-react";
import { EvolutionAvatar } from "@/components/avatar/evolution-avatar";
import { Button } from "@/components/ui/button";
import type { AchievementDef } from "@/lib/domain/achievements";
import { haptic } from "@/lib/haptic";
import { shareCard, type ShareCard } from "@/lib/share-image";
import { Medal } from "./medal";

export type Celebration =
  | { id: string; tipo: "conquista"; medalhas: AchievementDef[] }
  | { id: string; tipo: "marco"; dias: number }
  | { id: string; tipo: "evolucao"; de: number; para: number; nome: string; descricao: string };

const CORES = ["var(--brand-pink)", "var(--brand-orange)", "var(--brand-yellow)", "var(--foreground)"];

function Confetti() {
  // posições estáveis por montagem
  const pecas = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        dur: 2.4 + Math.random() * 1.6,
        cor: CORES[i % CORES.length],
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 8,
        redondo: i % 3 === 0,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pecas.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.redondo ? p.w : p.h,
            background: p.cor,
            borderRadius: p.redondo ? "999px" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

function shareData(c: Celebration, avatarSvg?: string): ShareCard {
  if (c.tipo === "marco") {
    return {
      destaque: String(c.dias),
      titulo: `${c.dias} dias seguidos!`,
      subtitulo: "Um dia de cada vez, sem desistir.",
    };
  }
  if (c.tipo === "evolucao") {
    return {
      destaque: "✨",
      imagemSvg: avatarSvg,
      titulo: `Meu avatar evoluiu: ${c.nome}`,
      subtitulo: c.descricao,
    };
  }
  const m = c.medalhas[0];
  return c.medalhas.length === 1
    ? { destaque: m.emoji, titulo: `Medalha: ${m.nome}`, subtitulo: m.descricao }
    : {
        destaque: m.emoji,
        titulo: `${c.medalhas.length} medalhas novas!`,
        subtitulo: c.medalhas.map((x) => x.nome).join(" · "),
      };
}

/** Tela cheia rápida de comemoração, com opção de compartilhar a conquista como imagem. */
export function CelebrationOverlay({
  celebration,
  onClose,
}: {
  celebration: Celebration;
  onClose: () => void;
}) {
  const continuar = useRef<HTMLButtonElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const [fase, setFase] = useState<"antes" | "depois">("antes");
  const [compartilhando, setCompartilhando] = useState(false);
  /** Resultado do compartilhamento, mostrado dentro da tela (um aviso flutuante cobriria os botões). */
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    haptic(30);
    continuar.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    setFase("antes");
    const t = setTimeout(() => setFase("depois"), celebration.tipo === "evolucao" ? 900 : 0);
    return () => {
      window.removeEventListener("keydown", esc);
      clearTimeout(t);
    };
  }, [celebration, onClose]);

  let titulo = "";
  let subtitulo = "";
  let visual: React.ReactNode = null;
  if (celebration.tipo === "conquista") {
    const m = celebration.medalhas;
    titulo = m.length === 1 ? m[0].nome : `${m.length} medalhas novas!`;
    subtitulo = m.length === 1 ? m[0].descricao : m.map((x) => x.nome).join(" · ");
    visual = (
      <div className="flex items-center justify-center gap-3">
        {m.slice(0, 3).map((x, i) => (
          <span key={x.codigo} className="animate-celebrate-pop" style={{ animationDelay: `${i * 0.15}s` }}>
            <Medal conteudo={x.emoji} size={m.length === 1 ? 168 : 104} />
          </span>
        ))}
      </div>
    );
  } else if (celebration.tipo === "marco") {
    titulo = `${celebration.dias} dias seguidos!`;
    subtitulo =
      celebration.dias >= 30
        ? "Isso já é parte de quem você é. Continue, um dia de cada vez."
        : "Constância vence perfeição. Continue assim!";
    visual = (
      <span className="animate-celebrate-pop">
        <Medal conteudo={<span className="font-display font-bold">{celebration.dias}</span>} size={176} />
      </span>
    );
  } else {
    titulo = fase === "depois" ? `Seu avatar evoluiu: ${celebration.nome}!` : "Algo está acontecendo…";
    subtitulo = fase === "depois" ? celebration.descricao : "";
    visual = (
      <div ref={avatarRef} className="relative grid size-56 place-items-center">
        {fase === "depois" && (
          <span
            aria-hidden
            className="animate-burst border-brand-yellow absolute inset-6 rounded-full border-4"
          />
        )}
        <EvolutionAvatar
          key={fase}
          estagio={fase === "antes" ? celebration.de : celebration.para}
          energia="energizado"
          className={fase === "antes" ? "animate-evolve-out size-56" : "animate-evolve-in size-56"}
          title={fase === "depois" ? `Avatar: ${celebration.nome}` : "Avatar evoluindo"}
        />
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="celebracao-titulo"
      className="bg-background/95 fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden px-6 pb-[env(safe-area-inset-bottom)] text-center backdrop-blur"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 38%, color-mix(in oklab, var(--brand-orange) 28%, transparent), transparent 60%)",
        }}
      />
      {fase === "depois" && <Confetti />}
      <div className="relative flex max-w-sm flex-col items-center gap-6">
        {visual}
        <div className="animate-celebrate-rise space-y-2" style={{ animationDelay: "0.2s" }}>
          <h2 id="celebracao-titulo" className="text-3xl font-bold">
            {titulo}
          </h2>
          {subtitulo && <p className="text-muted-foreground">{subtitulo}</p>}
        </div>
        <div
          className="animate-celebrate-rise flex w-full flex-col gap-2"
          style={{ animationDelay: "0.35s" }}
        >
          <Button
            variant="secondary"
            size="lg"
            disabled={compartilhando || (celebration.tipo === "evolucao" && fase === "antes")}
            onClick={async () => {
              setCompartilhando(true);
              try {
                const svg = avatarRef.current?.querySelector("svg")?.outerHTML;
                const r = await shareCard(shareData(celebration, svg));
                if (r === "baixado") setAviso("Imagem salva. É só postar! 📸");
                if (r === "compartilhado") setAviso("Compartilhado! ✨");
              } catch (e) {
                console.error(e);
                setAviso("Não foi possível gerar a imagem.");
              } finally {
                setCompartilhando(false);
              }
            }}
          >
            <Share2 /> {compartilhando ? "Gerando imagem…" : "Compartilhar"}
          </Button>
          <Button ref={continuar} size="lg" onClick={onClose}>
            Continuar
          </Button>
          {aviso && (
            <p role="status" className="text-muted-foreground text-sm">
              {aviso}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
