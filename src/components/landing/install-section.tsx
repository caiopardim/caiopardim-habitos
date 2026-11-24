"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, MonitorSmartphone } from "lucide-react";
import { IosInstallSteps } from "@/components/pwa/ios-install-steps";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/lib/pwa/install";
import { isIOS, isStandalone } from "@/lib/pwa/push";

type Aparelho = "carregando" | "instalado" | "ios" | "android" | "computador";

/**
 * Como instalar sem loja, de acordo com o aparelho: botão nativo (Chrome/Edge/Android),
 * passo a passo no iPhone e, no computador, QR code para abrir no celular.
 */
export function InstallSection({ comecar }: { comecar: string }) {
  const install = useInstallPrompt();
  const [aparelho, setAparelho] = useState<Aparelho>("carregando");
  const [qrSvg, setQrSvg] = useState("");
  useEffect(() => {
    const movel = /android|mobile/i.test(navigator.userAgent);
    const a = isStandalone() ? "instalado" : isIOS() ? "ios" : movel ? "android" : "computador";
    setAparelho(a);
    // QR com o endereço aberto agora (sempre o certo); a biblioteca só baixa no computador.
    if (a === "computador") {
      void import("qrcode")
        .then((q) =>
          q.toString(`${window.location.origin}/`, {
            type: "svg",
            margin: 0,
            color: { dark: "#14110f", light: "#ffffff" },
          }),
        )
        .then(setQrSvg)
        .catch(() => {});
    }
  }, []);

  if (aparelho === "instalado" || install.justInstalled) {
    return (
      <div className="bg-card flex flex-col items-start gap-3 rounded-2xl border p-5 sm:flex-row sm:items-center">
        <p className="flex flex-1 items-center gap-2">
          <CheckCircle2 className="text-success size-5" aria-hidden /> A Zoryka já está instalada neste
          aparelho.
        </p>
        <Button asChild>
          <Link href={comecar}>Abrir o app</Link>
        </Button>
      </div>
    );
  }

  const botao = install.canPrompt && (
    <Button size="lg" onClick={() => void install.prompt()}>
      <Download /> Instalar a Zoryka
    </Button>
  );

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_auto]">
      <div className="bg-card space-y-4 rounded-2xl border p-5">
        {aparelho === "ios" ? (
          <>
            <p className="font-bold">No iPhone ou iPad</p>
            <IosInstallSteps />
          </>
        ) : (
          <>
            <p className="font-bold">{aparelho === "android" ? "No Android" : "No computador"}</p>
            {botao ||
              (aparelho === "android" ? (
                <ol className="text-muted-foreground list-decimal space-y-1.5 pl-5 text-sm">
                  <li>
                    Abra o menu do navegador (<span aria-hidden>⋮</span> no Chrome).
                  </li>
                  <li>
                    Toque em <strong className="text-foreground">Instalar app</strong> ou{" "}
                    <strong className="text-foreground">Adicionar à tela inicial</strong>.
                  </li>
                  <li>Pronto: o ícone da Zoryka aparece junto dos seus outros apps.</li>
                </ol>
              ) : (
                <ul className="text-muted-foreground list-disc space-y-1.5 pl-5 text-sm">
                  <li>
                    <strong className="text-foreground">Chrome ou Edge:</strong> clique no ícone de instalar
                    na barra de endereço, ou abra o menu e escolha{" "}
                    <strong className="text-foreground">Instalar Zoryka</strong>.
                  </li>
                  <li>
                    <strong className="text-foreground">Safari no Mac:</strong> menu Arquivo →{" "}
                    <strong className="text-foreground">Adicionar ao Dock</strong>.
                  </li>
                  <li>Ou aponte a câmera do celular para o QR code e instale por lá.</li>
                </ul>
              ))}
          </>
        )}
        <ul className="text-muted-foreground space-y-1 border-t pt-4 text-sm">
          <li>Abre em tela cheia, direto do ícone.</li>
          <li>Funciona sem internet e sincroniza quando a conexão volta.</li>
          <li>Atualiza sozinha: você sempre tem a versão mais nova.</li>
          <li>Ocupa poucos megabytes, bem menos que um app de loja.</li>
        </ul>
      </div>
      {aparelho === "computador" && qrSvg && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border bg-white p-4 text-center md:w-56">
          <div
            className="size-44"
            role="img"
            aria-label="QR code com o endereço da Zoryka"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="flex items-center gap-1.5 text-xs font-medium text-neutral-800">
            <MonitorSmartphone className="size-4" aria-hidden /> Aponte a câmera do celular
          </p>
        </div>
      )}
    </div>
  );
}
