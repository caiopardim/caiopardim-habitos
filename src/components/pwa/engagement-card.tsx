"use client";

import { useEffect, useState } from "react";
import { BellRing, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/install";
import { enablePush, isIOS, isStandalone, permission, pushSupport } from "@/lib/pwa/push";
import { IosInstallSteps } from "./ios-install-steps";

const DISMISS_KEY = "zoryka:convites";
const REAPARECER_DIAS = 14;

type Convite = "instalar" | "lembretes";

function dismissedAt(c: Convite): number {
  try {
    const m = JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? "{}") as Record<string, number>;
    return m[c] ?? 0;
  } catch {
    return 0;
  }
}

function dismiss(c: Convite) {
  try {
    const m = JSON.parse(window.localStorage.getItem(DISMISS_KEY) ?? "{}") as Record<string, number>;
    m[c] = Date.now();
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(m));
  } catch {
    // sem armazenamento: some só nesta sessão
  }
}

const recente = (c: Convite) => Date.now() - dismissedAt(c) < REAPARECER_DIAS * 86_400_000;

/**
 * Convites na tela Hoje — só depois do primeiro dia de uso (não na primeira abertura):
 * instalar o app (no iPhone vem antes, pois é requisito para receber push) e ativar lembretes.
 */
export function EngagementCard() {
  const { snapshot, today, repoKind, updateProfile } = useReadyData();
  const install = useInstallPrompt();
  const [convite, setConvite] = useState<Convite | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const usouAntes =
    snapshot.logs.some((l) => l.data < today) || snapshot.tasks.some((t) => t.data < today && t.concluida);

  useEffect(() => {
    if (!usouAntes) return setConvite(null);
    const instalado = isStandalone() || install.justInstalled;
    const podeInstalar = !instalado && (install.canPrompt || isIOS());
    const suporte = pushSupport();
    const podeLembrar = repoKind === "supabase" && suporte === "ok" && permission() === "default";
    if (podeInstalar && (isIOS() || !podeLembrar) && !recente("instalar")) setConvite("instalar");
    else if (podeLembrar && !recente("lembretes")) setConvite("lembretes");
    else setConvite(null);
  }, [usouAntes, install.canPrompt, install.justInstalled, repoKind]);

  if (!convite) return null;
  const fechar = () => {
    dismiss(convite);
    setConvite(null);
  };
  const horario = snapshot.profile.lembreteHorario ?? "21:00";

  return (
    <section
      aria-label={convite === "instalar" ? "Instalar o app" : "Ativar lembretes"}
      className="bg-card relative space-y-3 rounded-xl border p-4 pr-12"
    >
      <button
        type="button"
        onClick={fechar}
        aria-label="Agora não"
        className="text-muted-foreground hover:bg-accent absolute top-2 right-2 grid size-10 place-items-center rounded-full"
      >
        <X className="size-4" />
      </button>
      {convite === "instalar" ? (
        <>
          <p className="flex items-center gap-2 font-semibold">
            <Smartphone className="text-primary size-5" aria-hidden />
            Instale a Zoryka na sua tela inicial
          </p>
          <p className="text-muted-foreground text-sm">
            Abre mais rápido, funciona sem internet
            {repoKind === "supabase" ? " e pode te lembrar de fechar o dia" : ""}.
          </p>
          {install.canPrompt ? (
            <Button
              size="sm"
              onClick={async () => {
                if (await install.prompt()) toast.success("Zoryka instalada! ✨");
                fechar();
              }}
            >
              Instalar
            </Button>
          ) : (
            <IosInstallSteps />
          )}
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 font-semibold">
            <BellRing className="text-primary size-5" aria-hidden />
            Quer um lembrete às {horario} para fechar o dia?
          </p>
          <p className="text-muted-foreground text-sm">
            No máximo {snapshot.profile.notificacoes.maxPorDia} por dia, nunca no horário silencioso. Você
            ajusta tudo em Configurações.
          </p>
          <Button
            size="sm"
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              const r = await enablePush();
              setOcupado(false);
              if (r === "ativado") {
                if (!snapshot.profile.lembreteHorario) await updateProfile({ lembreteHorario: horario });
                toast.success("Lembretes ativados neste aparelho.");
              } else if (r === "negado") {
                toast("Tudo bem. Se mudar de ideia, ative nas configurações do navegador.");
              } else {
                toast.error("Não foi possível ativar agora. Tente de novo em Configurações.");
              }
              fechar();
            }}
          >
            {ocupado ? "Ativando…" : "Ativar lembretes"}
          </Button>
        </>
      )}
    </section>
  );
}
