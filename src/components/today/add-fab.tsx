"use client";

import { useState } from "react";
import { ListPlus, Plus, ShieldOff, Sparkles } from "lucide-react";
import { HabitFormDialog } from "@/components/habits/habit-form-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { blankHabit } from "@/lib/habit-factory";
import type { DateStr, Habit, Task } from "@/lib/domain/types";
import { newId } from "@/lib/utils";
import { TaskFormDialog } from "./task-form-dialog";

export function AddFab({ date, today }: { date: DateStr; today: DateStr }) {
  const [menu, setMenu] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [habit, setHabit] = useState<Habit | null>(null);

  const options = [
    {
      icon: ListPlus,
      title: "Nova tarefa",
      desc: "Algo avulso para este dia",
      onClick: () =>
        setTask({
          id: newId(),
          areaId: null,
          titulo: "",
          prioridade: "media",
          dificuldade: "facil",
          data: date < today ? today : date,
          concluida: false,
          concluidaEm: null,
        }),
    },
    {
      icon: Sparkles,
      title: "Novo hábito",
      desc: "Algo para fazer com constância",
      onClick: () => setHabit(blankHabit("bom", today)),
    },
    {
      icon: ShieldOff,
      title: "Hábito para evitar",
      desc: "Algo que você quer largar",
      onClick: () => setHabit(blankHabit("mau", today)),
    },
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Adicionar tarefa ou hábito"
        onClick={() => setMenu(true)}
        className="bg-primary text-primary-foreground shadow-primary/20 fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-full shadow-lg transition-transform active:scale-95 md:right-8 md:bottom-8"
      >
        <Plus className="size-7" strokeWidth={2.5} />
      </button>

      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar</DialogTitle>
            <DialogDescription>O que você quer criar?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {options.map(({ icon: Icon, title, desc, onClick }) => (
              <button
                key={title}
                type="button"
                onClick={() => {
                  setMenu(false);
                  onClick();
                }}
                className="hover:bg-accent flex items-center gap-3 rounded-xl border p-3 text-left"
              >
                <span className="bg-primary/15 text-primary grid size-11 place-items-center rounded-lg">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-muted-foreground block text-xs">{desc}</span>
                </span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {task && <TaskFormDialog task={task} isNew open onOpenChange={(o) => !o && setTask(null)} />}
      {habit && <HabitFormDialog habit={habit} isNew open onOpenChange={(o) => !o && setHabit(null)} />}
    </>
  );
}
