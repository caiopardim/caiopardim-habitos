"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, LifeBuoy, Lightbulb, Megaphone } from "lucide-react";
import { SuggestionForm } from "@/components/support/suggestion-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHAVE_NOVIDADES_VISTAS, ULTIMA_NOVIDADE } from "@/lib/changelog";

const linha =
  "hover:bg-accent -mx-2 flex min-h-12 w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 text-left text-sm font-medium";

/** Configurações → Ajuda: suporte, novidades (com aviso do que é novo) e sugestões. */
export function HelpSettings() {
  const [novo, setNovo] = useState(false);
  const [sugestao, setSugestao] = useState(false);
  useEffect(() => {
    try {
      setNovo(
        Boolean(ULTIMA_NOVIDADE) && window.localStorage.getItem(CHAVE_NOVIDADES_VISTAS) !== ULTIMA_NOVIDADE,
      );
    } catch {}
  }, []);

  return (
    <>
      <div className="-my-2">
        <Link href="/novidades" className={linha}>
          <Megaphone className="text-primary size-5" aria-hidden />
          <span className="flex-1">Novidades</span>
          {novo && (
            <span className="bg-brand-gradient text-primary-foreground rounded-full px-2 py-0.5 text-xs font-bold">
              Novo
            </span>
          )}
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </Link>
        <button type="button" className={linha} onClick={() => setSugestao(true)}>
          <Lightbulb className="text-primary size-5" aria-hidden />
          <span className="flex-1">Enviar sugestão</span>
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </button>
        <Link href="/suporte" className={linha}>
          <LifeBuoy className="text-primary size-5" aria-hidden />
          <span className="flex-1">Suporte</span>
          <ChevronRight className="text-muted-foreground size-4" aria-hidden />
        </Link>
      </div>
      <Dialog open={sugestao} onOpenChange={setSugestao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar sugestão</DialogTitle>
            <DialogDescription>Ideia, problema ou elogio: toda mensagem é lida.</DialogDescription>
          </DialogHeader>
          <SuggestionForm onEnviada={() => setSugestao(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
