"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { analyticsConfigured, getConsent, onConsentChange, setConsent } from "@/lib/analytics";

export function PrivacySettings() {
  const [ligado, setLigado] = useState(false);
  const [configurado, setConfigurado] = useState(false);
  useEffect(() => {
    const ler = () => setLigado(getConsent() === "aceito");
    setConfigurado(analyticsConfigured());
    ler();
    return onConsentChange(ler);
  }, []);
  return (
    <div className="space-y-4">
      {configurado && (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="analytics" className="flex-col items-start gap-0.5">
            <span>Medições de uso</span>
            <span className="text-muted-foreground text-xs font-normal">
              Anônimas, para melhorar o app. Sem gravação de tela e sem o conteúdo dos seus hábitos.
            </span>
          </Label>
          <Switch
            id="analytics"
            checked={ligado}
            onCheckedChange={(v) => setConsent(v ? "aceito" : "recusado")}
          />
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <Link href="/privacidade" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Política de privacidade
        </Link>
        <Link href="/termos" className="inline-flex min-h-11 items-center underline underline-offset-4">
          Termos de uso
        </Link>
      </div>
    </div>
  );
}
