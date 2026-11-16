import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div className="space-y-4">
        <p className="text-5xl">🧭</p>
        <h1 className="text-xl font-semibold">Página não encontrada</h1>
        <Button asChild>
          <Link href="/hoje">Voltar para Hoje</Link>
        </Button>
      </div>
    </main>
  );
}
