"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HardDriveUpload } from "lucide-react";
import { toast } from "sonner";
import { ZorykaLogo } from "@/components/brand/logo";
import { useAppData } from "@/components/providers/app-data";
import { Button } from "@/components/ui/button";
import { snapshotSummary } from "@/lib/data/import";
import type { Snapshot } from "@/lib/data/types";
import { AppSkeleton } from "./app-skeleton";
import { ErrorState } from "./error-state";

/**
 * Mostra carregamento/erro, oferece importar dados do navegador para a conta nova
 * e garante que o onboarding seja feito antes do resto.
 */
export function DataGate({ children }: { children: React.ReactNode }) {
  const { status, snapshot, reload, localImport } = useAppData();
  const pathname = usePathname();
  const router = useRouter();
  const onboarding = pathname.startsWith("/onboarding");
  const done = snapshot?.profile.onboardingConcluido;

  useEffect(() => {
    if (status !== "ready" || localImport) return;
    if (!done && !onboarding) router.replace("/onboarding");
    if (done && onboarding) router.replace("/hoje");
  }, [status, done, onboarding, router, localImport]);

  if (status === "error") return <ErrorState onRetry={() => void reload()} />;
  if (status === "loading" || !snapshot) return <AppSkeleton />;
  if (localImport) return <ImportPrompt local={localImport} />;
  if (done === onboarding) return <AppSkeleton />;
  return <>{children}</>;
}

function ImportPrompt({ local }: { local: Snapshot }) {
  const { importLocalData, dismissLocalImport } = useAppData();
  const [importando, setImportando] = useState(false);
  const r = snapshotSummary(local);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5 py-10">
      <ZorykaLogo className="self-center text-xl" markClassName="h-8" />
      <section className="bg-card space-y-4 rounded-2xl border p-5">
        <HardDriveUpload className="text-primary size-8" aria-hidden />
        <div className="space-y-1">
          <h1 className="text-xl font-bold">Encontramos dados neste navegador</h1>
          <p className="text-muted-foreground text-sm">
            Você usou a Zoryka aqui antes de criar a conta. Quer levar esse histórico com você? Depois de
            importar, ele aparece em todos os seus dispositivos.
          </p>
        </div>
        <ul className="grid grid-cols-3 gap-2 text-center">
          {[
            [r.habitos, r.habitos === 1 ? "hábito" : "hábitos"],
            [r.dias, r.dias === 1 ? "dia registrado" : "dias registrados"],
            [r.tarefas, r.tarefas === 1 ? "tarefa" : "tarefas"],
          ].map(([n, l]) => (
            <li key={String(l)} className="bg-muted rounded-lg p-2">
              <p className="text-lg font-bold tabular-nums">{n}</p>
              <p className="text-muted-foreground text-[11px] leading-tight">{l}</p>
            </li>
          ))}
        </ul>
        <div className="space-y-2">
          <Button
            className="w-full"
            disabled={importando}
            onClick={async () => {
              setImportando(true);
              try {
                await importLocalData();
                toast.success("Pronto! Seus dados agora estão na sua conta.");
              } catch (e) {
                console.error(e);
                toast.error("Não foi possível importar agora. Tente novamente.");
                setImportando(false);
              }
            }}
          >
            {importando ? "Importando…" : "Importar para minha conta"}
          </Button>
          <Button variant="ghost" className="w-full" disabled={importando} onClick={dismissLocalImport}>
            Começar do zero
          </Button>
        </div>
      </section>
      <p className="text-muted-foreground text-center text-xs">
        Os dados de demonstração nunca são importados — só o que você registrou de verdade.
      </p>
    </main>
  );
}
