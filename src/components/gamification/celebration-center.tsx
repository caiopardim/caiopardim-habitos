"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAvatar } from "@/components/avatar/use-avatar";
import { useReadyData } from "@/components/providers/app-data";
import { crossedMilestone, newlyUnlocked } from "@/lib/domain/achievements";
import { CelebrationOverlay, type Celebration } from "./celebration-overlay";
import { useGamification } from "./use-gamification";

/**
 * Detecta o que acabou de acontecer e comemora em tela cheia, uma coisa de cada vez:
 * medalhas novas, marcos de sequência (7, 14, 30…) e evolução do avatar.
 * Na abertura do app nada é celebrado (só o que acontecer durante o uso).
 */
export function CelebrationCenter() {
  const { snapshot, history, addAchievements, repoKind } = useReadyData();
  const { medalhas } = useGamification();
  const avatar = useAvatar();
  const [fila, setFila] = useState<Celebration[]>([]);
  const prevSeq = useRef<number | null>(null);
  const prevEstagio = useRef<number | null>(null);
  const seq = useRef(0);
  /** O que já foi comemorado nesta sessão (evita comemorar duas vezes a mesma coisa). */
  const celebrado = useRef(new Set<string>());
  const addRef = useRef(addAchievements);
  addRef.current = addAchievements;

  const atual = history.streak.atual;
  useEffect(() => {
    const novas: Celebration[] = [];
    const id = () => `c${++seq.current}`;

    // Medalhas: registra as desbloqueadas; celebra só as novas (a 1ª sincronização entra em silêncio).
    const { novas: medalhasNovas, registrar } = newlyUnlocked(
      medalhas,
      snapshot.achievements,
      snapshot.achievements.length === 0,
    );
    if (registrar.length) addRef.current(registrar);

    // Marco de sequência: se a medalha do mesmo marco é nova, a celebração do marco já a representa.
    const marco = prevSeq.current === null ? null : crossedMilestone(prevSeq.current, atual);
    prevSeq.current = atual;
    const outras = medalhasNovas.filter(
      (m) => !(marco && m.def.codigo === `seq_${marco}`) && !celebrado.current.has(m.def.codigo),
    );
    outras.forEach((m) => celebrado.current.add(m.def.codigo));
    if (marco && !celebrado.current.has(`marco_${marco}`)) {
      celebrado.current.add(`marco_${marco}`);
      celebrado.current.add(`seq_${marco}`);
      novas.push({ id: id(), tipo: "marco", dias: marco });
    }
    if (outras.length) novas.push({ id: id(), tipo: "conquista", medalhas: outras.map((m) => m.def) });

    // Evolução do avatar
    if (
      prevEstagio.current !== null &&
      avatar.estagio > prevEstagio.current &&
      !celebrado.current.has(`estagio_${avatar.estagio}`)
    ) {
      celebrado.current.add(`estagio_${avatar.estagio}`);
      novas.push({
        id: id(),
        tipo: "evolucao",
        de: prevEstagio.current,
        para: avatar.estagio,
        nome: avatar.stage.nome,
        descricao: avatar.stage.descricao,
      });
    }
    prevEstagio.current = avatar.estagio;

    if (novas.length) setFila((f) => [...f, ...novas]);
  }, [medalhas, atual, avatar.estagio, avatar.stage, snapshot.achievements]);

  const fechar = useCallback(() => setFila((f) => f.slice(1)), []);
  if (!fila.length || repoKind === null) return null;
  return <CelebrationOverlay key={fila[0].id} celebration={fila[0]} onClose={fechar} />;
}
