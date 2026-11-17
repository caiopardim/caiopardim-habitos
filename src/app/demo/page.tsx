"use client";

import { useEffect } from "react";
import { enterDemo } from "@/lib/demo/mode";

/** "Ver demonstração": entra no app com dados fictícios, separados de qualquer conta. */
export default function DemoPage() {
  useEffect(() => {
    enterDemo();
    window.location.replace("/hoje");
  }, []);
  return (
    <main className="grid min-h-dvh place-items-center" aria-busy="true">
      <p className="text-muted-foreground text-sm">Preparando a demonstração…</p>
    </main>
  );
}
