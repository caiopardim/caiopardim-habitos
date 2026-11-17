"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { IosInstallSteps } from "@/components/pwa/ios-install-steps";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/install";
import { isIOS, isStandalone } from "@/lib/pwa/push";

export function InstallSettings() {
  const install = useInstallPrompt();
  const [estado, setEstado] = useState<"instalado" | "ios" | "outro">("outro");
  useEffect(() => {
    setEstado(isStandalone() ? "instalado" : isIOS() ? "ios" : "outro");
  }, []);

  if (estado === "instalado" || install.justInstalled) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="text-success size-4" aria-hidden /> O app está instalado neste aparelho.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-sm">
        Instalado, ele abre direto da tela inicial, mais rápido e funcionando sem internet.
      </p>
      {install.canPrompt ? (
        <Button
          variant="secondary"
          onClick={async () => {
            if (await install.prompt()) toast.success("Zoryka instalada! ✨");
          }}
        >
          <Smartphone /> Instalar a Zoryka
        </Button>
      ) : estado === "ios" ? (
        <IosInstallSteps />
      ) : (
        <p className="text-muted-foreground text-sm">
          Use o menu do navegador e escolha <strong className="text-foreground">Instalar app</strong> ou{" "}
          <strong className="text-foreground">Adicionar à tela inicial</strong>.
        </p>
      )}
    </div>
  );
}
