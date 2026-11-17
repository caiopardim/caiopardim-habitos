import { WifiOff } from "lucide-react";
import { ZorykaLogo } from "@/components/brand/logo";
import { RetryButton } from "@/components/pwa/retry-button";

export const metadata = { title: "Sem conexão" };

/** Mostrada pelo service worker quando uma tela ainda não guardada é aberta sem internet. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <ZorykaLogo className="text-xl" markClassName="h-8" />
      <WifiOff className="text-muted-foreground size-10" aria-hidden />
      <div className="space-y-1">
        <h1 className="text-xl font-bold">Você está sem conexão</h1>
        <p className="text-muted-foreground text-sm">
          Esta tela ainda não foi guardada no aparelho. As telas que você já abriu funcionam offline — e o que
          você marcar é sincronizado quando a internet voltar.
        </p>
      </div>
      <RetryButton />
    </main>
  );
}
