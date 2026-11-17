"use client";

import { RotateCw } from "lucide-react";
import { ZorykaMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/** Erro com mensagem humana + "Tentar novamente". */
export function ErrorState({
  title = "Não conseguimos carregar seus dados",
  message = "Pode ser a conexão. Seus registros estão guardados — tente de novo em instantes.",
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry: () => void;
}) {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="flex max-w-sm flex-col items-center gap-4">
        <ZorykaMark className="text-muted-foreground h-14 w-auto opacity-60" />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <Button onClick={onRetry}>
          <RotateCw /> Tentar novamente
        </Button>
      </div>
    </main>
  );
}
