"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BellOff, BellRing, Send } from "lucide-react";
import { toast } from "sonner";
import { IosInstallSteps } from "@/components/pwa/ios-install-steps";
import { useReadyData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { isSupabaseConfigured } from "@/lib/config";
import { SEQUENCIA_HORARIO } from "@/lib/domain/reminders";
import type { NotificationPrefs } from "@/lib/domain/types";
import {
  currentSubscription,
  disablePush,
  enablePush,
  permission,
  pushSupport,
  sendTestPush,
  type PushSupport,
} from "@/lib/pwa/push";

function Linha({
  id,
  titulo,
  hint,
  children,
}: {
  id: string;
  titulo: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={id} className="flex-col items-start gap-0.5">
        <span>{titulo}</span>
        {hint && <span className="text-muted-foreground text-xs font-normal">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}

export function RemindersSettings() {
  const { snapshot, repoKind, updateProfile } = useReadyData();
  const p = snapshot.profile;
  const n = p.notificacoes;
  const [suporte, setSuporte] = useState<PushSupport>("sem-suporte");
  const [perm, setPerm] = useState<string>("default");
  const [ativo, setAtivo] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    setSuporte(pushSupport());
    setPerm(permission());
    void currentSubscription().then((s) => setAtivo(!!s));
  }, []);

  if (repoKind !== "supabase") {
    return (
      <p className="text-muted-foreground text-sm">
        Lembretes precisam de uma conta — assim eles chegam mesmo com o app fechado.{" "}
        {isSupabaseConfigured && (
          <Link href="/cadastro" className="text-foreground font-semibold underline underline-offset-2">
            Criar conta
          </Link>
        )}
      </p>
    );
  }

  const prefs = (patch: Partial<NotificationPrefs>) =>
    void updateProfile({ notificacoes: { ...n, ...patch } });
  const comLembrete = snapshot.habits.filter((h) => h.lembrete && h.horario && !h.arquivado).length;

  return (
    <div className="space-y-5">
      {/* Este aparelho */}
      <div className="bg-muted space-y-3 rounded-lg p-3">
        {suporte === "nao-configurado" && (
          <p className="text-muted-foreground text-sm">
            As notificações ainda não foram configuradas no servidor (chaves VAPID — veja o README).
          </p>
        )}
        {suporte === "sem-suporte" && (
          <p className="text-muted-foreground text-sm">Este navegador não recebe notificações.</p>
        )}
        {suporte === "ios-instalar" && (
          <div className="space-y-2">
            <p className="text-sm">No iPhone, os lembretes chegam com o app instalado na tela de início:</p>
            <IosInstallSteps />
          </div>
        )}
        {suporte === "ok" && perm === "denied" && (
          <p className="text-muted-foreground flex gap-2 text-sm">
            <BellOff className="size-4 shrink-0" aria-hidden />
            As notificações estão bloqueadas para este site. Libere nas configurações do navegador e volte
            aqui.
          </p>
        )}
        {suporte === "ok" && perm !== "denied" && (
          <>
            <Linha id="push-aparelho" titulo="Receber neste aparelho" hint={ativo ? "Ativado" : "Desativado"}>
              <Switch
                id="push-aparelho"
                checked={ativo}
                disabled={ocupado}
                onCheckedChange={async (v) => {
                  setOcupado(true);
                  if (v) {
                    const r = await enablePush();
                    setPerm(permission());
                    if (r === "ativado") {
                      setAtivo(true);
                      if (!p.lembreteHorario) void updateProfile({ lembreteHorario: "21:00" });
                      toast.success("Lembretes ativados neste aparelho.");
                    } else if (r === "erro") toast.error("Não foi possível ativar agora. Tente de novo.");
                  } else {
                    await disablePush();
                    setAtivo(false);
                    toast("Este aparelho não vai mais receber lembretes.");
                  }
                  setOcupado(false);
                }}
              />
            </Linha>
            {ativo && (
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    const enviados = await sendTestPush();
                    toast.success(
                      enviados ? "Notificação de teste enviada." : "Nenhum aparelho recebeu. Ative de novo.",
                    );
                  } catch {
                    toast.error("Não foi possível enviar o teste.");
                  }
                }}
              >
                <Send /> Enviar teste
              </Button>
            )}
          </>
        )}
      </div>

      {/* O que lembrar */}
      <Linha id="n-fechamento" titulo="Fechar o dia" hint="Se ainda faltar algo para registrar">
        <Switch id="n-fechamento" checked={n.fechamento} onCheckedChange={(v) => prefs({ fechamento: v })} />
      </Linha>
      {n.fechamento && (
        <div className="flex items-center justify-between gap-3 pl-1">
          <Label htmlFor="n-horario" className="text-muted-foreground font-normal">
            Horário
          </Label>
          <Input
            id="n-horario"
            type="time"
            className="w-32"
            value={p.lembreteHorario ?? "21:00"}
            onChange={(e) => e.target.value && void updateProfile({ lembreteHorario: e.target.value })}
          />
        </div>
      )}
      <Linha
        id="n-habitos"
        titulo="Por hábito"
        hint={
          comLembrete
            ? `${comLembrete} ${comLembrete === 1 ? "hábito" : "hábitos"} com lembrete no horário sugerido`
            : "Ligue o lembrete ao editar um hábito com horário"
        }
      >
        <Switch id="n-habitos" checked={n.habitos} onCheckedChange={(v) => prefs({ habitos: v })} />
      </Linha>
      <Linha
        id="n-sequencia"
        titulo="Sequência em risco"
        hint={`Às ${SEQUENCIA_HORARIO}, se o dia ainda não contar`}
      >
        <Switch id="n-sequencia" checked={n.sequencia} onCheckedChange={(v) => prefs({ sequencia: v })} />
      </Linha>

      {/* Limites */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Horário silencioso</p>
        <div className="flex items-center gap-2">
          <Input
            aria-label="Início do horário silencioso"
            type="time"
            value={n.silencioInicio}
            onChange={(e) => e.target.value && prefs({ silencioInicio: e.target.value })}
          />
          <span className="text-muted-foreground text-sm">até</span>
          <Input
            aria-label="Fim do horário silencioso"
            type="time"
            value={n.silencioFim}
            onChange={(e) => e.target.value && prefs({ silencioFim: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="n-max">Máximo por dia</Label>
        <NativeSelect
          id="n-max"
          className="w-24"
          value={n.maxPorDia}
          onChange={(e) => prefs({ maxPorDia: Number(e.target.value) })}
        >
          {[1, 2, 3, 4, 5].map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </NativeSelect>
      </div>
      <p className="text-muted-foreground flex items-center gap-2 text-xs">
        <BellRing className="size-3.5" aria-hidden />
        Os lembretes respeitam seu fuso horário e nunca repetem o mesmo aviso no dia.
      </p>
    </div>
  );
}
