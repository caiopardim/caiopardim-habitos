"use client";

import Link from "next/link";
import { Settings } from "lucide-react";
import { AvatarCard } from "@/components/avatar/avatar-card";
import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function PerfilPage() {
  const { snapshot, history } = useReadyData();
  const { level, streak, xpTotal, diasPerfeitos } = history;
  const stats = [
    { label: "XP total", value: xpTotal.toLocaleString("pt-BR") },
    { label: "Sequência atual", value: streak.atual },
    { label: "Melhor sequência", value: streak.melhor },
    { label: "Dias perfeitos", value: diasPerfeitos },
  ];
  return (
    <div className="space-y-4">
      <PageHeader
        title={snapshot.profile.nome || "Perfil"}
        subtitle="Seu progresso"
        action={
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/configuracoes" aria-label="Configurações">
              <Settings />
            </Link>
          </Button>
        }
      />
      <AvatarCard />
      <div className="bg-card rounded-xl border p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-muted-foreground text-xs">Nível</p>
            <p className="text-xp text-4xl font-bold tabular-nums">{level.nivel}</p>
          </div>
          <p className="text-muted-foreground text-sm tabular-nums">
            {level.xpNoNivel} / {level.xpDoNivel} XP
          </p>
        </div>
        <Progress
          value={level.progresso * 100}
          indicatorClassName="bg-brand-gradient"
          className="mt-3"
          aria-label="Progresso do nível"
        />
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border p-3.5">
            <p className="text-muted-foreground text-xs">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
      <ComingSoon
        fase="Fase 3"
        itens={["Temporadas de 7 dias", "Medalhas e conquistas", "Temporada recorde"]}
      />
    </div>
  );
}
