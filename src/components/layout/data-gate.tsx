"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAppData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";

/** Mostra carregamento/erro e garante que o onboarding seja feito antes do resto. */
export function DataGate({ children }: { children: React.ReactNode }) {
  const { status, snapshot, reload } = useAppData();
  const pathname = usePathname();
  const router = useRouter();
  const onboarding = pathname.startsWith("/onboarding");
  const done = snapshot?.profile.onboardingConcluido;

  useEffect(() => {
    if (status !== "ready") return;
    if (!done && !onboarding) router.replace("/onboarding");
    if (done && onboarding) router.replace("/hoje");
  }, [status, done, onboarding, router]);

  if (status === "error") {
    return (
      <main className="grid min-h-dvh place-items-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-4xl">📡</p>
          <p className="font-semibold">Não foi possível carregar seus dados.</p>
          <Button onClick={() => void reload()}>Tentar de novo</Button>
        </div>
      </main>
    );
  }

  if (status === "loading" || !snapshot || done === onboarding) {
    return (
      <main className="grid min-h-dvh place-items-center" aria-busy="true">
        <div className="border-muted border-t-primary size-8 animate-spin rounded-full border-2" />
        <span className="sr-only">Carregando…</span>
      </main>
    );
  }

  return <>{children}</>;
}
