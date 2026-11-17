"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { CelebrationCenter } from "@/components/gamification/celebration-center";
import { useAppData } from "@/components/providers/app-data";
import { ZorykaLogo } from "@/components/brand/logo";
import { APP_NAME, isSupabaseConfigured } from "@/lib/config";
import type { RepoKind } from "@/lib/data/types";
import { OfflineBanner } from "./offline-banner";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { repoKind, sync } = useAppData();
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh md:flex">
      <CelebrationCenter />
      {/* Barra lateral (desktop) */}
      <aside className="bg-card/40 sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r p-4 md:flex">
        <Link
          href="/hoje"
          className="mb-6 flex items-center px-2 py-1 text-base"
          aria-label={`${APP_NAME} — início`}
        >
          <ZorykaLogo />
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
        <ModeBadge kind={repoKind} />
      </aside>

      <div className="min-w-0 flex-1">
        <OfflineBanner sync={sync} />
        <div className="md:hidden">
          <ModeBadge kind={repoKind} />
        </div>
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

function ModeBadge({ kind }: { kind: RepoKind | null }) {
  if (kind === "demo") {
    return (
      <p className="bg-primary/10 px-4 py-2 text-center text-xs md:rounded-lg md:text-left">
        <span className="text-muted-foreground">Demonstração com dados fictícios · </span>
        <Link
          href={isSupabaseConfigured ? "/cadastro" : "/configuracoes"}
          className="font-semibold underline underline-offset-2"
        >
          {isSupabaseConfigured ? "Criar minha conta" : "Sair da demonstração"}
        </Link>
      </p>
    );
  }
  if (kind === "local") {
    return (
      <p className="bg-primary/10 text-muted-foreground px-4 py-1.5 text-center text-xs md:rounded-lg md:text-left">
        Modo local · seus dados ficam só neste navegador
      </p>
    );
  }
  return null;
}
