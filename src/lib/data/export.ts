import type { Snapshot } from "./types";

const STATUS_LABEL: Record<string, string> = {
  feito: "feito",
  parcial: "parcial",
  nao_feito: "não feito",
  evitei: "evitei",
  aconteceu: "aconteceu",
};

/** Escapa um campo CSV (aspas, vírgula, ponto e vírgula e quebras de linha). */
function cell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";,\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Todos os registros (hábitos e tarefas) em CSV, um por linha, ordenados por data.
 * Separador ";" e vírgula decimal, que abrem direto no Excel/Sheets em português.
 */
export function snapshotToCsv(s: Snapshot): string {
  const areas = new Map(s.areas.map((a) => [a.id, a.nome]));
  const habits = new Map(s.habits.map((h) => [h.id, h]));
  const linhas: (string | number | null)[][] = [];

  for (const l of s.logs) {
    const h = habits.get(l.habitId);
    if (!h) continue;
    linhas.push([
      l.data,
      h.tipo === "bom" ? "hábito" : "hábito a evitar",
      h.nome,
      h.areaId ? (areas.get(h.areaId) ?? "") : "",
      STATUS_LABEL[l.status] ?? l.status,
      l.valor === null ? "" : String(l.valor).replace(".", ","),
      h.metaTipo === "quantidade" ? (h.unidade ?? "") : "",
    ]);
  }
  for (const t of s.tasks) {
    linhas.push([
      t.data,
      "tarefa",
      t.titulo,
      t.areaId ? (areas.get(t.areaId) ?? "") : "",
      t.concluida ? "feito" : "não feito",
      "",
      "",
    ]);
  }
  linhas.sort((a, b) => String(a[0]).localeCompare(String(b[0])));

  const header = ["data", "tipo", "item", "área", "status", "valor", "unidade"];
  return [header, ...linhas].map((r) => r.map(cell).join(";")).join("\n");
}

export function snapshotToJson(s: Snapshot): string {
  return JSON.stringify({ app: "Zoryka", exportadoEm: new Date().toISOString(), ...s }, null, 2);
}

/** Baixa um arquivo no navegador. */
export function downloadFile(nome: string, conteudo: string, tipo: string) {
  // BOM para o Excel reconhecer UTF-8 (acentos) no CSV
  const blob = new Blob([tipo.includes("csv") ? "﻿" + conteudo : conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
