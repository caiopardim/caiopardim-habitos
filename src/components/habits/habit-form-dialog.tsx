"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { HABIT_ICONS, HabitIcon } from "@/components/habits/habit-icon";
import { isLucide, LUCIDE_PREFIX } from "@/lib/domain/habit-symbol";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { XP_POR_DIFICULDADE } from "@/lib/domain/day";
import type { Dificuldade, Habit } from "@/lib/domain/types";
import { habitFormSchema } from "@/lib/schemas";
import { DIAS_SEMANA_CURTO, DIAS_SEMANA_NOME, DIFICULDADE_LABEL, EMOJI_SUGESTOES } from "@/lib/templates";
import { cn } from "@/lib/utils";

type Errors = Partial<Record<string, string>>;

export function HabitFormDialog({
  habit,
  isNew,
  open,
  onOpenChange,
}: {
  habit: Habit;
  isNew: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* key reinicia o formulário a cada hábito aberto */}
        <HabitForm key={habit.id} habit={habit} isNew={isNew} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function HabitForm({ habit, isNew, onDone }: { habit: Habit; isNew: boolean; onDone: () => void }) {
  const { snapshot, saveHabit, today, repoKind } = useAppData();
  const areas = snapshot?.areas ?? [];
  const [v, setV] = useState(habit);
  const [aba, setAba] = useState<"emoji" | "icone">(isLucide(habit.emoji) ? "icone" : "emoji");
  const [metaTexto, setMetaTexto] = useState(
    habit.metaValor ? String(habit.metaValor).replace(".", ",") : "",
  );
  const [errors, setErrors] = useState<Errors>({});
  const bom = v.tipo === "bom";
  const set = <K extends keyof Habit>(k: K, val: Habit[K]) => setV((s) => ({ ...s, [k]: val }));

  const todosOsDias = v.diasSemana.length === 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const metaValor = metaTexto.trim() ? Number(metaTexto.replace(",", ".")) : null;
    const candidate = {
      ...v,
      metaValor: bom && v.metaTipo === "quantidade" ? (Number.isFinite(metaValor) ? metaValor : -1) : null,
      unidade: bom && v.metaTipo === "quantidade" ? v.unidade?.trim() || null : null,
      metaTipo: bom ? v.metaTipo : "check",
    };
    const parsed = habitFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      setErrors(errs);
      return;
    }
    if (!bom && parsed.data.inicio > today) {
      setErrors({ inicio: "A data de início não pode ser no futuro." });
      return;
    }
    const area = areas.find((a) => a.id === parsed.data.areaId);
    await saveHabit({
      ...v,
      ...parsed.data,
      lembrete: v.lembrete && !!parsed.data.horario,
      cor: bom ? (area?.cor ?? v.cor) : v.cor,
    });
    toast.success(isNew ? "Hábito criado!" : "Hábito atualizado.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DialogHeader>
        <DialogTitle>
          {isNew ? (bom ? "Novo hábito" : "Novo hábito para evitar") : "Editar hábito"}
        </DialogTitle>
        <DialogDescription>
          {bom ? "Algo que você quer fazer com constância." : "Algo que você quer deixar de fazer."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-3">
        <div className="space-y-2">
          <Label>Ícone</Label>
          <span
            className="bg-muted grid size-11 place-items-center rounded-lg text-xl"
            aria-label="Ícone escolhido"
            role="img"
          >
            <HabitIcon simbolo={v.emoji} />
          </span>
        </div>
        <div className="flex-1">
          <Field id="nome" label="Nome" error={errors.nome}>
            <Input
              id="nome"
              value={v.nome}
              onChange={(e) => set("nome", e.target.value)}
              placeholder={bom ? "Ex.: Ler" : "Ex.: Redes sociais em excesso"}
              maxLength={60}
              autoFocus={isNew}
            />
          </Field>
        </div>
      </div>

      <div className="-mt-1 space-y-2">
        <Segmented
          label="Tipo de ícone"
          value={aba}
          onChange={setAba}
          options={[
            { value: "emoji", label: "Emoji" },
            { value: "icone", label: "Ícone" },
          ]}
        />
        {aba === "emoji" ? (
          <>
            <div className="flex flex-wrap gap-1" aria-label="Sugestões de emoji">
              {EMOJI_SUGESTOES.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => set("emoji", em)}
                  aria-pressed={v.emoji === em}
                  className={cn(
                    "hover:bg-accent grid size-11 place-items-center rounded-lg text-lg",
                    v.emoji === em && "bg-accent ring-primary ring-2",
                  )}
                  aria-label={`Usar ${em}`}
                >
                  {em}
                </button>
              ))}
            </div>
            <Field id="emoji" label="Outro emoji" error={errors.emoji}>
              <Input
                id="emoji"
                className="w-24 text-center text-xl"
                value={isLucide(v.emoji) ? "" : v.emoji}
                onChange={(e) => set("emoji", e.target.value)}
                maxLength={16}
              />
            </Field>
          </>
        ) : (
          <div className="flex flex-wrap gap-1" aria-label="Ícones">
            {Object.entries(HABIT_ICONS).map(([nome, { Icon, nome: rotulo }]) => {
              const valor = `${LUCIDE_PREFIX}${nome}`;
              return (
                <button
                  key={nome}
                  type="button"
                  onClick={() => set("emoji", valor)}
                  aria-pressed={v.emoji === valor}
                  aria-label={rotulo}
                  title={rotulo}
                  className={cn(
                    "hover:bg-accent grid size-11 place-items-center rounded-lg",
                    v.emoji === valor && "bg-accent ring-primary ring-2",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Field id="area" label="Área da vida">
        <NativeSelect
          id="area"
          value={v.areaId ?? ""}
          onChange={(e) => set("areaId", e.target.value || null)}
        >
          <option value="">Sem área</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {bom ? (
        <>
          <Field label="Tipo de meta">
            <Segmented
              label="Tipo de meta"
              value={v.metaTipo}
              onChange={(m) => set("metaTipo", m)}
              options={[
                { value: "check", label: "Feito / não feito" },
                { value: "quantidade", label: "Quantidade" },
              ]}
            />
          </Field>

          {v.metaTipo === "quantidade" && (
            <div className="grid grid-cols-2 gap-3">
              <Field id="meta" label="Meta diária" error={errors.metaValor}>
                <Input
                  id="meta"
                  inputMode="decimal"
                  value={metaTexto}
                  onChange={(e) => setMetaTexto(e.target.value)}
                  placeholder="3000"
                />
              </Field>
              <Field id="unidade" label="Unidade" error={errors.unidade}>
                <Input
                  id="unidade"
                  value={v.unidade ?? ""}
                  onChange={(e) => set("unidade", e.target.value)}
                  placeholder="ml, páginas, km, h"
                  maxLength={20}
                />
              </Field>
            </div>
          )}

          <Field label="Frequência">
            <Segmented
              label="Frequência"
              value={todosOsDias ? "todos" : "dias"}
              onChange={(f) => set("diasSemana", f === "todos" ? [] : [1, 2, 3, 4, 5])}
              options={[
                { value: "todos", label: "Todos os dias" },
                { value: "dias", label: "Dias específicos" },
              ]}
            />
            {!todosOsDias && (
              <div className="flex justify-between gap-1 pt-1">
                {DIAS_SEMANA_CURTO.map((d, i) => {
                  const on = v.diasSemana.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      aria-label={DIAS_SEMANA_NOME[i]}
                      onClick={() => {
                        const next = on ? v.diasSemana.filter((x) => x !== i) : [...v.diasSemana, i].sort();
                        // nenhum dia marcado = volta para "todos os dias"
                        set("diasSemana", next);
                      }}
                      className={cn(
                        "grid size-11 place-items-center rounded-full border text-sm font-semibold",
                        on ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            )}
          </Field>

          <Field label="Dificuldade">
            <Segmented<Dificuldade>
              label="Dificuldade"
              value={v.dificuldade}
              onChange={(d) => set("dificuldade", d)}
              options={(["facil", "media", "dificil"] as const).map((d) => ({
                value: d,
                label: (
                  <>
                    <span>{DIFICULDADE_LABEL[d]}</span>
                    <span className="text-xp text-[11px]">+{XP_POR_DIFICULDADE[d]} XP</span>
                  </>
                ),
              }))}
            />
          </Field>

          <Field id="horario" label="Horário sugerido (opcional)">
            <Input
              id="horario"
              type="time"
              value={v.horario ?? ""}
              onChange={(e) => set("horario", e.target.value || null)}
            />
          </Field>
          {repoKind === "supabase" && v.horario && (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="lembrete" className="flex-col items-start gap-0.5">
                <span>Me lembrar às {v.horario}</span>
                <span className="text-muted-foreground text-xs font-normal">
                  Só se ainda não tiver feito. Ative as notificações em Configurações.
                </span>
              </Label>
              <Switch id="lembrete" checked={v.lembrete} onCheckedChange={(c) => set("lembrete", c)} />
            </div>
          )}
        </>
      ) : (
        <Field
          id="inicio"
          label="Início do controle"
          error={errors.inicio}
          hint="O contador de dias começa aqui."
        >
          <Input
            id="inicio"
            type="date"
            max={today}
            value={v.inicio}
            onChange={(e) => set("inicio", e.target.value)}
          />
        </Field>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">{isNew ? "Criar hábito" : "Salvar"}</Button>
      </DialogFooter>
    </form>
  );
}
