"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { EvolutionWatcher } from "@/components/avatar/evolution-watcher";
import { useAppData } from "@/components/providers/app-data";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { repoKind } = useAppData();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh md:flex">
      <EvolutionWatcher />
      {/* Barra lateral (desktop) */}
      <aside className="bg-card/40 sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r p-4 md:flex">
        <Link href="/hoje" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg text-sm font-black">
            {APP_NAME.slice(0, 1)}
          </span>
          {APP_NAME}
        </Link>
        <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
          {[...NAV_ITEMS, { href: "/configuracoes", label: "Configurações", icon: Settings }].map(
            ({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:bg-accent hover:text-foreground flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  active(href) && "bg-accent text-foreground",
                )}
              >
                <Icon className={cn("size-5", active(href) && "text-primary")} />
                {label}
              </Link>
            ),
          )}
        </nav>
        {repoKind === "local" && <DemoBadge />}
      </aside>

      <div className="min-w-0 flex-1">
        {repoKind === "local" && (
          <div className="md:hidden">
            <DemoBadge />
          </div>
        )}
        <main className="mx-auto w-full max-w-3xl px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-12">{children}</main>
      </div>

      {/* Barra inferior (celular) */}
      <nav
        aria-label="Principal"
        className="bg-background/90 fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={cn(
                  "text-muted-foreground flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium",
                  active(href) && "text-foreground",
                )}
              >
                <Icon className={cn("size-5", active(href) && "text-primary")} />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function DemoBadge() {
  return (
    <p className="bg-primary/10 text-muted-foreground px-4 py-1.5 text-center text-xs md:rounded-lg md:text-left">
      Modo demonstração · dados salvos neste navegador
    </p>
  );
}
