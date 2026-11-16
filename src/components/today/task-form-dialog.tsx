"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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
import { Segmented } from "@/components/ui/segmented";
import { XP_POR_DIFICULDADE } from "@/lib/domain/day";
import type { Dificuldade, Prioridade, Task } from "@/lib/domain/types";
import { taskFormSchema } from "@/lib/schemas";
import { DIFICULDADE_LABEL, PRIORIDADE_LABEL } from "@/lib/templates";

export function TaskFormDialog({
  task,
  isNew,
  open,
  onOpenChange,
}: {
  task: Task;
  isNew: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <TaskForm key={task.id} task={task} isNew={isNew} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TaskForm({ task, isNew, onDone }: { task: Task; isNew: boolean; onDone: () => void }) {
  const { snapshot, saveTask, deleteTask } = useAppData();
  const [v, setV] = useState(task);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const set = <K extends keyof Task>(k: K, val: Task[K]) => setV((s) => ({ ...s, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = taskFormSchema.safeParse(v);
    if (!parsed.success) {
      const errs: Partial<Record<string, string>> = {};
      for (const i of parsed.error.issues) errs[String(i.path[0])] ??= i.message;
      return setErrors(errs);
    }
    await saveTask({ ...v, ...parsed.data });
    toast.success(isNew ? "Tarefa criada!" : "Tarefa atualizada.");
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <DialogHeader>
        <DialogTitle>{isNew ? "Nova tarefa" : "Editar tarefa"}</DialogTitle>
        <DialogDescription>Uma missão avulsa, só para este dia.</DialogDescription>
      </DialogHeader>
      <Field id="titulo" label="Título" error={errors.titulo}>
        <Input
          id="titulo"
          value={v.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          placeholder="Ex.: Enviar relatório"
          maxLength={120}
          autoFocus={isNew}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="data" label="Data" error={errors.data}>
          <Input id="data" type="date" value={v.data} onChange={(e) => set("data", e.target.value)} />
        </Field>
        <Field id="area" label="Área da vida">
          <NativeSelect
            id="area"
            value={v.areaId ?? ""}
            onChange={(e) => set("areaId", e.target.value || null)}
          >
            <option value="">Sem área</option>
            {snapshot?.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Prioridade">
        <Segmented<Prioridade>
          label="Prioridade"
          value={v.prioridade}
          onChange={(p) => set("prioridade", p)}
          options={(["alta", "media", "baixa"] as const).map((p) => ({
            value: p,
            label: PRIORIDADE_LABEL[p],
          }))}
        />
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
      <DialogFooter className="sm:justify-between">
        {!isNew ? (
          <Button
            type="button"
            variant="ghost"
            className="text-danger"
            onClick={async () => {
              if (!window.confirm("Excluir esta tarefa?")) return;
              await deleteTask(task.id);
              toast.success("Tarefa excluída.");
              onDone();
            }}
          >
            <Trash2 /> Excluir
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit">{isNew ? "Criar tarefa" : "Salvar"}</Button>
        </div>
      </DialogFooter>
    </form>
  );
}
