import { describe, expect, it } from "vitest";
import { habit, log, task } from "../domain/test-helpers";
import { emptySnapshot } from "./local-repository";
import { snapshotToCsv, snapshotToJson } from "./export";

describe("exportar dados", () => {
  const s = emptySnapshot();
  s.areas = [{ id: "a", nome: "Saúde & Corpo", cor: "#000", ordem: 0, emFoco: true }];
  const agua = habit({
    id: "h1",
    nome: "Beber água",
    areaId: "a",
    metaTipo: "quantidade",
    metaValor: 3000,
    unidade: "ml",
  });
  const redes = habit({ id: "h2", nome: 'Redes "sociais"; excesso', tipo: "mau" });
  s.habits = [agua, redes];
  s.logs = [
    log("h1", "2026-03-02", { status: "parcial", valor: 1500.5 }),
    log("h2", "2026-03-01", { status: "aconteceu" }),
  ];
  s.tasks = [task({ titulo: "Pagar contas", data: "2026-03-03", concluida: true })];

  it("gera CSV ordenado por data, com ; e vírgula decimal", () => {
    const linhas = snapshotToCsv(s).split("\n");
    expect(linhas[0]).toBe("data;tipo;item;área;status;valor;unidade");
    expect(linhas[1]).toBe('2026-03-01;hábito a evitar;"Redes ""sociais""; excesso";;aconteceu;;');
    expect(linhas[2]).toBe('2026-03-02;hábito;Beber água;Saúde & Corpo;parcial;"1500,5";ml');
    expect(linhas[3]).toBe("2026-03-03;tarefa;Pagar contas;;feito;;");
  });

  it("JSON inclui tudo e identifica o app", () => {
    const j = JSON.parse(snapshotToJson(s));
    expect(j.app).toBe("Zoryka");
    expect(j.habits).toHaveLength(2);
    expect(j.logs).toHaveLength(2);
  });
});
