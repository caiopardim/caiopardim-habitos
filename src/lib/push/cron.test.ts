import { describe, expect, it } from "vitest";
import { emptyProfile } from "../data/local-repository";
import { habit } from "../domain/test-helpers";
import { runReminderCron, type CronDeps, type PushSub } from "./cron";

const sub = (userId: string, endpoint: string): PushSub => ({ userId, endpoint, p256dh: "k", auth: "a" });

function deps(over: Partial<CronDeps> & { now: Date }) {
  const enviados: string[] = [];
  const logados: string[] = [];
  const removidas: string[] = [];
  const profile = { ...emptyProfile(), id: "u1", lembreteHorario: "21:00" };
  const agua = habit({
    id: "agua",
    nome: "Beber água",
    emoji: "💧",
    horario: "10:00",
    lembrete: true,
    inicio: "2026-01-01",
  });
  const d: CronDeps = {
    listSubscriptions: async () => [sub("u1", "https://push/a"), sub("u1", "https://push/b")],
    loadUser: async () => ({ profile, habits: [agua] }),
    loadDays: async () => ({ logs: [], tasks: [], restDays: [], sent: [] }),
    send: async (s, p) => {
      enviados.push(`${s.endpoint} ${p.title}`);
      return s.endpoint.endsWith("/b") ? "expirada" : "ok";
    },
    removeSubscription: async (e) => void removidas.push(e),
    logSent: async (_u, date, rs) => void logados.push(...rs.map((x) => `${date} ${x.tipo}:${x.ref}`)),
    ...over,
  };
  return { d, enviados, logados, removidas };
}

describe("cron de lembretes", () => {
  it("envia no fuso do usuário para todos os aparelhos, remove assinatura expirada e registra", async () => {
    // 13:05 UTC = 10:05 em São Paulo → lembrete da água
    const { d, enviados, logados, removidas } = deps({ now: new Date("2026-03-10T13:05:00Z") });
    const r = await runReminderCron(d);
    expect(enviados).toEqual([
      "https://push/a 💧 Hora de Beber água",
      "https://push/b 💧 Hora de Beber água",
    ]);
    expect(removidas).toEqual(["https://push/b"]);
    expect(logados).toEqual(["2026-03-10 habito:agua"]);
    expect(r).toEqual({ usuarios: 1, avaliados: 1, enviados: 1, removidas: 1 });
  });

  it("fora de qualquer horário não consulta o dia nem envia", async () => {
    let consultou = false;
    const { d, enviados } = deps({
      now: new Date("2026-03-10T15:40:00Z"), // 12:40 em SP
      loadDays: async () => {
        consultou = true;
        return { logs: [], tasks: [], restDays: [], sent: [] };
      },
    });
    const r = await runReminderCron(d);
    expect(consultou).toBe(false);
    expect(enviados).toEqual([]);
    expect(r.avaliados).toBe(0);
  });

  it("não repete o que já foi enviado hoje", async () => {
    const { d, enviados } = deps({
      now: new Date("2026-03-10T13:05:00Z"),
      loadDays: async () => ({ logs: [], tasks: [], restDays: [], sent: [{ tipo: "habito", ref: "agua" }] }),
    });
    await runReminderCron(d);
    expect(enviados).toEqual([]);
  });

  it("erro em um usuário não derruba os outros", async () => {
    const { d, enviados } = deps({
      now: new Date("2026-03-10T13:05:00Z"),
      listSubscriptions: async () => [sub("quebrado", "https://push/x"), sub("u1", "https://push/a")],
      loadUser: async (id) => {
        if (id === "quebrado") throw new Error("banco fora");
        return {
          profile: { ...emptyProfile(), id },
          habits: [
            habit({
              id: "agua",
              nome: "Beber água",
              emoji: "💧",
              horario: "10:00",
              lembrete: true,
              inicio: "2026-01-01",
            }),
          ],
        };
      },
    });
    await runReminderCron(d);
    expect(enviados).toEqual(["https://push/a 💧 Hora de Beber água"]);
  });
});
