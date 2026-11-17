import { PlusSquare, Share } from "lucide-react";

/** Passo a passo para instalar no iPhone/iPad (Safari não tem botão de instalar). */
export function IosInstallSteps() {
  return (
    <ol className="text-muted-foreground space-y-1.5 text-sm">
      <li className="flex items-center gap-2">
        <span className="bg-muted text-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
          1
        </span>
        Toque em <Share className="text-foreground inline size-4" aria-label="Compartilhar" />{" "}
        <strong className="text-foreground">Compartilhar</strong> no Safari
      </li>
      <li className="flex items-center gap-2">
        <span className="bg-muted text-foreground grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold">
          2
        </span>
        Escolha <PlusSquare className="text-foreground inline size-4" aria-hidden />
        <strong className="text-foreground">Adicionar à Tela de Início</strong>
      </li>
    </ol>
  );
}
