import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto da tela enquanto os dados carregam (no lugar de um "Carregando…"). */
export function AppSkeleton() {
  return (
    <div className="min-h-dvh md:flex" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando seus dados…</span>
      <aside className="hidden h-dvh w-60 shrink-0 flex-col gap-3 border-r p-4 md:flex">
        <Skeleton className="mb-4 h-7 w-32" />
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </aside>
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-4 pt-6 md:px-8 md:pt-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="size-16 rounded-full" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </main>
    </div>
  );
}
