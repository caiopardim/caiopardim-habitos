"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/layout/error-state";
import { captureError } from "@/lib/monitoring";

/** Erro inesperado em qualquer tela. */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    captureError(error);
  }, [error]);
  return (
    <ErrorState
      title="Algo deu errado por aqui"
      message="Já registramos o problema. Tente de novo — seus dados não foram perdidos."
      onRetry={reset}
    />
  );
}
