"use client";

import { BedDouble, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Explica a proteção de sequência (1 dia de descanso por semana). */
export function RestDayInfo({ children }: { children?: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children ?? (
          <Button variant="link" size="sm" className="h-auto px-0 py-0 text-xs">
            <Info className="size-3.5" /> Como funciona?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="text-primary size-5" aria-hidden />
            Proteção de sequência
          </DialogTitle>
          <DialogDescription>Descansar também faz parte da evolução.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5 text-sm leading-relaxed">
          <li>
            🛌 Você tem <strong>1 dia de descanso por semana</strong> (de segunda a domingo).
          </li>
          <li>
            🛡️ No dia de descanso, sua <strong>sequência não quebra</strong> — ela só não soma esse dia.
          </li>
          <li>🏆 O dia também fica fora da média da temporada.</li>
          <li>⏪ Dá para usar em qualquer um dos últimos 7 dias, se você esqueceu de marcar.</li>
          <li>🔁 Na semana seguinte, você ganha um descanso novo. Ele não acumula.</li>
        </ul>
      </DialogContent>
    </Dialog>
  );
}
