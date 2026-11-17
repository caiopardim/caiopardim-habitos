"use client";

import { useEffect } from "react";
import { captureError } from "@/lib/monitoring";

/** Erro que derrubou até o layout raiz: página mínima, sem depender de nada do app. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => captureError(error), [error]);
  return (
    <html lang="pt-BR">
      <body style={{ background: "#14110f", color: "#f7efe6", fontFamily: "system-ui, sans-serif" }}>
        <main
          style={{
            minHeight: "100dvh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20 }}>Algo deu errado por aqui</h1>
            <p style={{ color: "#b3a79b" }}>Já registramos o problema. Seus dados não foram perdidos.</p>
            <button
              onClick={reset}
              style={{
                marginTop: 16,
                padding: "12px 20px",
                borderRadius: 10,
                border: 0,
                background: "#ff8a3d",
                fontWeight: 600,
              }}
            >
              Tentar novamente
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
