import { z } from "zod";

const dificuldade = z.enum(["facil", "media", "dificil"]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const habitFormSchema = z
  .object({
    tipo: z.enum(["bom", "mau"]),
    nome: z.string().trim().min(1, "Dê um nome ao hábito.").max(60, "Use até 60 caracteres."),
    emoji: z.string().trim().min(1, "Escolha um ícone.").max(32),
    areaId: z.string().nullable(),
    metaTipo: z.enum(["check", "quantidade"]),
    metaValor: z.number().positive("A meta precisa ser maior que zero.").max(1_000_000).nullable(),
    unidade: z.string().trim().max(20, "Use até 20 caracteres.").nullable(),
    diasSemana: z.array(z.number().int().min(0).max(6)),
    dificuldade,
    horario: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    inicio: date,
  })
  .superRefine((v, ctx) => {
    if (v.tipo === "bom" && v.metaTipo === "quantidade") {
      if (v.metaValor === null)
        ctx.addIssue({ code: "custom", path: ["metaValor"], message: "Informe a meta." });
      if (!v.unidade)
        ctx.addIssue({ code: "custom", path: ["unidade"], message: "Informe a unidade (ex.: ml, páginas)." });
    }
  });

export type HabitFormValues = z.infer<typeof habitFormSchema>;

export const taskFormSchema = z.object({
  titulo: z.string().trim().min(1, "Dê um título à tarefa.").max(120, "Use até 120 caracteres."),
  areaId: z.string().nullable(),
  prioridade: z.enum(["alta", "media", "baixa"]),
  dificuldade,
  data: date,
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
