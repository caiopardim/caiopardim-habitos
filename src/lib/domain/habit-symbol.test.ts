import { describe, expect, it } from "vitest";
import { isLucide, lucideName, symbolText } from "./habit-symbol";
import { planReminders, toMinutes } from "./reminders";
import { habit } from "./test-helpers";
import { DEFAULT_NOTIFICATION_PREFS } from "./types";

describe("símbolo do hábito", () => {
  it("emoji ou ícone lucide no mesmo campo", () => {
    expect(isLucide("lucide:Droplet")).toBe(true);
    expect(lucideName("lucide:Droplet")).toBe("Droplet");
    expect(symbolText("lucide:Droplet")).toBe("");
    expect(symbolText("💧")).toBe("💧");
  });

  it("notificação de hábito com ícone não mostra o código do ícone", () => {
    const h = habit({
      id: "a",
      nome: "Beber água",
      emoji: "lucide:Droplet",
      horario: "10:00",
      lembrete: true,
    });
    const [r] = planReminders({
      date: "2026-03-10",
      nowMinutes: toMinutes("10:00"),
      prefs: DEFAULT_NOTIFICATION_PREFS,
      lembreteHorario: null,
      habits: [h],
      logs: new Map(),
      summary: null,
      limiteSequencia: 0.6,
      sequenciaAtual: 0,
      sentToday: [],
    });
    expect(r.title).toBe("Hora de Beber água");
  });
});
