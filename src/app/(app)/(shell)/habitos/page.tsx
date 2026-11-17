"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Archive, ArchiveRestore, BarChart3, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { badHabitStats } from "@/lib/domain/bad-habits";
import { XP_POR_DIFICULDADE } from "@/lib/domain/day";
import type { Habit } from "@/lib/domain/types";
import { blankHabit } from "@/lib/habit-factory";
import { formatShortDate } from "@/lib/format-date";
import { DIAS_SEMANA_NOME, DIFICULDADE_LABEL } from "@/lib/templates";
import { formatNumber } from "@/lib/utils";

function frequencia(h: Habit): string {
  if (h.diasSemana.length === 0 || h.diasSemana.length === 7) return "Todos os dias";
  if (h.diasSemana.join() === "1,2,3,4,5") return "Seg a sex";
  return h.diasSemana.map((d) => DIAS_SEMANA_NOME[d]).join(", ");
}

export default function HabitosPage() {
  const { snapshot, today, setArchived, deleteHabit } = useReadyData();
  const [editing, setEditing] = useState<{ habit: Habit; isNew: boolean } | null>(null);
  const [tab, setTab] = useState("bons");

  // /habitos?novo=bom|mau abre direto o formulário (atalho dos estados vazios).
  useEffect(() => {
    const novo = new URLSearchParams(window.location.search).get("novo");
    if (novo === "bom" || novo === "mau") {
      setTab(novo === "mau" ? "maus" : "bons");
      setEditing({ habit: blankHabit(novo, today), isNew: true });
      window.history.replaceState(null, "", "/habitos");
    }
  }, [today]);
  const criar = (tipo: "bom" | "mau") => setEditing({ habit: blankHabit(tipo, today), isNew: true });

  const ativos = snapshot.habits.filter((h) => !h.arquivado);
  const bons = ativos.filter((h) => h.tipo === "bom");
  const maus = ativos.filter((h) => h.tipo === "mau");
  const arquivados = snapshot.habits.filter((h) => h.arquivado);
  const areaById = new Map(snapshot.areas.map((a) => [a.id, a]));

  const row = (h: Habit) => {
    const area = h.areaId ? areaById.get(h.areaId) : undefined;
    let detalhe: string;
    if (h.tipo === "bom") {
      const meta =
        h.metaTipo === "quantidade" ? `${formatNumber(h.metaValor ?? 0)} ${h.unidade}` : "Feito / não feito";
      detalhe = `${meta} · ${frequencia(h)} · ${DIFICULDADE_LABEL[h.dificuldade]} (+${XP_POR_DIFICULDADE[h.dificuldade]} XP)`;
    } else {
      const s = badHabitStats(
        h,
        snapshot.logs.filter((l) => l.habitId === h.id),
        today,
      );
      detalhe = `${s.diasLimpo} ${s.diasLimpo === 1 ? "dia" : "dias"} sem · recorde ${s.recorde} · desde ${formatShortDate(h.inicio)}`;
    }
    return (
      <li key={h.id} className="bg-card flex items-center gap-3 rounded-xl border p-3">
        <span className="bg-muted grid size-11 shrink-0 place-items-center rounded-full text-xl" aria-hidden>
          {h.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{h.nome}</p>
          <p className="text-muted-foreground text-xs">
            {area && (
              <span className="mr-1 inline-flex items-center gap-1">
                <span className="size-2 rounded-full" style={{ background: area.cor }} aria-hidden />
                {area.nome} ·
              </span>
            )}
            {detalhe}
          </p>
        </div>
        <div className="flex shrink-0">
          {h.tipo === "bom" && (
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/evolucao?habito=${h.id}`} aria-label={`Ver evolução de ${h.nome}`}>
                <BarChart3 />
              </Link>
            </Button>
          )}
          {!h.arquivado && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Editar ${h.nome}`}
              onClick={() => setEditing({ habit: h, isNew: false })}
            >
              <Pencil />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label={h.arquivado ? `Reativar ${h.nome}` : `Arquivar ${h.nome}`}
            onClick={async () => {
              await setArchived(h, !h.arquivado);
              toast.success(h.arquivado ? "Hábito reativado." : "Hábito arquivado. O histórico foi mantido.");
            }}
          >
            {h.arquivado ? <ArchiveRestore /> : <Archive />}
          </Button>
          {h.arquivado && (
            <Button
              variant="ghost"
              size="icon"
              className="text-danger"
              aria-label={`Excluir ${h.nome} definitivamente`}
              onClick={async () => {
                if (
                  !window.confirm(`Excluir "${h.nome}" e todo o histórico dele? Isso não pode ser desfeito.`)
                )
                  return;
                await deleteHabit(h.id);
                toast.success("Hábito excluído.");
              }}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div>
      <PageHeader
        title="Hábitos"
        subtitle={`${bons.length} para fazer · ${maus.length} para evitar`}
        action={
          <Button
            onClick={() =>
              setEditing({ habit: blankHabit(tab === "maus" ? "mau" : "bom", today), isNew: true })
            }
          >
            <Plus /> Novo
          </Button>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="bons">Para fazer</TabsTrigger>
          <TabsTrigger value="maus">Para evitar</TabsTrigger>
          <TabsTrigger value="arquivados">Arquivados</TabsTrigger>
        </TabsList>
        <TabsContent value="bons">
          {bons.length ? (
            <ul className="space-y-2">{bons.map(row)}</ul>
          ) : (
            <EmptyState
              title="Nenhum hábito ainda"
              action={
                <Button onClick={() => criar("bom")}>
                  <Plus /> Criar hábito
                </Button>
              }
            >
              Comece por algo pequeno, como beber água ou ler 10 páginas.
            </EmptyState>
          )}
        </TabsContent>
        <TabsContent value="maus">
          {maus.length ? (
            <ul className="space-y-2">{maus.map(row)}</ul>
          ) : (
            <EmptyState
              title="Nada para evitar por enquanto"
              action={
                <Button variant="secondary" onClick={() => criar("mau")}>
                  <Plus /> Adicionar hábito a evitar
                </Button>
              }
            >
              Redes sociais em excesso, açúcar, cigarro… Registrar os dias sem já ajuda a largar.
            </EmptyState>
          )}
        </TabsContent>
        <TabsContent value="arquivados">
          {arquivados.length ? (
            <ul className="space-y-2">{arquivados.map(row)}</ul>
          ) : (
            <EmptyState title="Nenhum hábito arquivado">
              Hábitos arquivados saem da rotina, mas o histórico continua contando nas suas análises.
            </EmptyState>
          )}
        </TabsContent>
      </Tabs>
      {editing && (
        <HabitFormDialog
          habit={editing.habit}
          isNew={editing.isNew}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </div>
  );
}
