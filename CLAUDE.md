# Zoryka — contexto do projeto

App de hábitos (Next.js 15 + Supabase). Especificação completa entregue por fases; ver README (seção Fases).
Interface **toda em português do Brasil**. Slogan: "sua evolução, um dia de cada vez".
Marca: ver seção "Marca" do README; use os tokens de `globals.css` (nunca cores soltas) e `ZorykaLogo`/`ZorykaMark`.

## Comandos

`npm run dev` · `npm test` (Vitest) · `npm run lint` · `npm run typecheck` · `npm run build` · `npm run format`

## Convenções

- TypeScript estrito, sem `any`. Regras de negócio puras em `src/lib/domain/` sempre com `*.test.ts`.
- Datas de calendário = string `yyyy-MM-dd` no fuso do usuário (`todayInTz`). Nunca `new Date().toISOString()` para "hoje".
- Acesso a dados só via `Repository` (`src/lib/data`); telas usam `useAppData()` / `useReadyData()`.
  Mutações são otimistas e passam pela fila serial do `AppDataProvider`.
- Sem Supabase no `.env.local` o app roda em modo demonstração (`LocalRepository`).
- Componentes base em `src/components/ui` no estilo shadcn/ui (escritos à mão; o CLI do shadcn pode estar bloqueado na rede).
- SQL: migrations novas em `supabase/migrations/`, sempre com RLS. Não aplicar em produção — o dono revisa e roda.
- Commits em pt-BR com prefixo convencional (`feat`/`fix`/`refactor`/`test`/`chore`).
