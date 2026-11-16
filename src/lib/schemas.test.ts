import { describe, expect, it } from "vitest";
import { habitFormSchema, taskFormSchema } from "./schemas";

const base = {
  tipo: "bom" as const,
  nome: "Beber água",
  emoji: "💧",
  areaId: null,
  metaTipo: "quantidade" as const,
  metaValor: 3000,
  unidade: "ml",
  diasSemana: [],
  dificuldade: "facil" as const,
  horario: null,
  inicio: "2026-03-10",
};

describe("validação de formulários", () => {
  it("aceita hábito válido", () => {
    expect(habitFormSchema.safeParse(base).success).toBe(true);
  });

  it("meta numérica exige valor e unidade", () => {
    const r = habitFormSchema.safeParse({ ...base, metaValor: null, unidade: "" });
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["metaValor", "unidade"]);
  });

  it("rejeita nome vazio e meta negativa", () => {
    expect(habitFormSchema.safeParse({ ...base, nome: "  " }).success).toBe(false);
    expect(habitFormSchema.safeParse({ ...base, metaValor: -1 }).success).toBe(false);
  });

  it("valida tarefa", () => {
    expect(
      taskFormSchema.safeParse({
        titulo: "Pagar contas",
        areaId: null,
        prioridade: "alta",
        dificuldade: "facil",
        data: "2026-03-10",
      }).success,
    ).toBe(true);
    expect(
      taskFormSchema.safeParse({
        titulo: "",
        areaId: null,
        prioridade: "alta",
        dificuldade: "facil",
        data: "10/03",
      }).success,
    ).toBe(false);
  });
});
