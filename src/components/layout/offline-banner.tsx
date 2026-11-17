"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

/** Faixa discreta quando a conexão cai (só faz sentido com conta, que sincroniza com o servidor). */
export function OfflineBanner({ ativo }: { ativo: boolean }) {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (!ativo || online) return null;
  return (
    <p
      role="status"
      className="bg-muted text-muted-foreground sticky top-0 z-30 flex items-center justify-center gap-2 px-4 py-2 text-center text-xs"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      Você está offline. O que você marcar será sincronizado quando a conexão voltar — mantenha o app aberto.
    </p>
  );
}
