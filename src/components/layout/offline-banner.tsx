"use client";

import { useSyncExternalStore } from "react";
import { CloudUpload, WifiOff } from "lucide-react";
import type { SyncStatus } from "@/lib/data/offline-repository";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const alteracoes = (n: number) => `${n} ${n === 1 ? "alteração" : "alterações"}`;

/**
 * Faixa discreta de conexão (só com conta, que sincroniza com o servidor):
 * offline → avisa que tudo fica guardado; de volta → mostra o que está sendo enviado.
 */
export function OfflineBanner({ sync }: { sync: SyncStatus | null }) {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (!sync) return null;
  if (!online) {
    return (
      <p
        role="status"
        className="bg-muted text-muted-foreground sticky top-0 z-30 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs"
      >
        <WifiOff className="size-4 shrink-0" aria-hidden />
        Você está offline — tudo fica guardado no aparelho
        {sync.pendentes > 0 ? ` (${alteracoes(sync.pendentes)} para sincronizar)` : ""} e é enviado quando a
        conexão voltar.
      </p>
    );
  }
  if (sync.pendentes > 0) {
    return (
      <p
        role="status"
        className="bg-muted text-muted-foreground sticky top-0 z-30 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs"
      >
        <CloudUpload className="size-4 shrink-0 animate-pulse motion-reduce:animate-none" aria-hidden />
        Sincronizando {alteracoes(sync.pendentes)}…
      </p>
    );
  }
  return null;
}
