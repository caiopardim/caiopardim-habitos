# Zoryka

**Sua evolução, um dia de cada vez.** App web (PWA, mobile-first) de hábitos e evolução pessoal: registre o que você faz, o que evita e acompanhe
sua evolução com pontuação, sequência e XP. **Um dia ruim é uma queda no gráfico, não um recomeço do zero.**

> Nome e slogan centralizados em `src/lib/config.ts` (`APP_NAME`, `APP_TAGLINE`).

## Marca

- Arquivos de referência em `docs/brand/`. O símbolo (arcos + sol) está em `src/components/brand/logo.tsx`
  (`ZorykaMark`, `ZorykaLogo`, `ZorykaAppIcon`), e os ícones em `src/app/icon.svg`, `src/app/apple-icon.png`
  e `public/icons/`.
- Paleta: rosa `#E8546F`/`#F26D85`, laranja `#F57A2A`/`#FF8A3D`, amarelo `#F5B12E`/`#FFC247`
  (claro/escuro), creme `#F7EFE6` e preto quente `#14110F`. Tokens em `src/app/globals.css`.
- Fontes: Sora (títulos e logotipo) e Inter (interface).

## Stack

Next.js 15 (App Router) · TypeScript estrito · Tailwind CSS v4 + componentes shadcn/ui · Supabase (Postgres +
Auth + RLS) · Zod · date-fns · Vitest. Gráficos (Recharts) entram na Fase 2.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase (opcional, veja abaixo)
npm run dev                  # http://localhost:3000
```

**Sem Supabase configurado o app roda em modo demonstração**: sem login, dados salvos no `localStorage` do
navegador. No onboarding há o botão “Pular e carregar 60 dias de exemplo”.

### Scripts

| Comando                              | O que faz                                                       |
| ------------------------------------ | --------------------------------------------------------------- |
| `npm run dev`                        | servidor de desenvolvimento                                     |
| `npm run build` / `npm start`        | build e servidor de produção                                    |
| `npm test`                           | testes de domínio (Vitest)                                      |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript                                             |
| `npm run format`                     | Prettier                                                        |
| `npm run seed`                       | cria um usuário de exemplo com 60 dias de histórico no Supabase |

## Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode `supabase/migrations/20261116000000_schema_inicial.sql`
   (ou `supabase db push` com a CLI). Isso cria as tabelas, a RLS e o trigger que cria o perfil no cadastro.
3. Em **Project Settings → API**, copie a URL e a `anon key` para o `.env.local`.
4. **Authentication → URL Configuration**: adicione `http://localhost:3000/auth/callback` (e a URL da Vercel)
   em _Redirect URLs_.
5. **Login com Google** (opcional): _Authentication → Providers → Google_, com Client ID/Secret do Google Cloud.
6. **Dados de exemplo** (opcional): preencha `SUPABASE_SERVICE_ROLE_KEY`, `SEED_USER_EMAIL` e
   `SEED_USER_PASSWORD` no `.env.local` e rode `npm run seed`. A service role key só é usada por esse script.

`supabase/tests/rls_smoke.sql` testa a RLS num Postgres local (dois usuários, um tentando ler/gravar dados do
outro).

## Arquitetura

```
src/
  app/
    (auth)/           entrar, cadastro, recuperar-senha
    auth/             callback do Supabase e redefinição de senha
    (app)/            área logada (AppDataProvider + DataGate)
      onboarding/
      (shell)/        telas com navegação: hoje, habitos, evolucao, perfil, configuracoes
  components/
    ui/               componentes base (estilo shadcn/ui)
    providers/        AppDataProvider: estado, atualizações otimistas, fila de sincronização
    today/ habits/ layout/ auth/
  lib/
    domain/           REGRAS DE NEGÓCIO puras + testes (execução, pontuação, sequência, XP, maus hábitos)
    data/             Repository: SupabaseRepository e LocalRepository (modo demo) + mapeamento Zod
    demo/             gerador determinístico dos 60 dias de exemplo (usado no demo e no seed)
supabase/migrations/  schema versionado com RLS
```

- **Datas** são strings `yyyy-MM-dd` no fuso do usuário (`todayInTz`); nunca o dia UTC do servidor.
- **Resumos diários** são calculados no cliente pelas mesmas funções de `lib/domain` e gravados em
  `daily_summaries` (com XP total e nível no perfil) sempre que um dia muda.

## Regras de negócio (resumo)

- **Execução** = itens concluídos / previstos (bons hábitos agendados + tarefas + maus hábitos). Meta numérica
  conta proporcionalmente (teto 1).
- **Pontuação do Dia (0–100)** = 70% bons hábitos e tarefas (ponderados pela dificuldade 1/2/3) + 30% maus
  hábitos evitados. Sem maus hábitos, 100% vem da execução.
- **Sequência**: o dia conta se execução ≥ 60% (configurável). Dias sem itens previstos, o dia de hoje
  (enquanto não termina) e 1 dia de descanso por semana (seg–dom) são neutros.
- **Dia perfeito**: execução 100% e nenhum mau hábito ocorrido.
- **XP**: 10/20/30 por dificuldade (parcial proporcional), +10 por mau hábito evitado, +50 por dia perfeito.
  Nível: `xp_para_proximo = round(100 · nível^1.5)`.
- Registros podem ser editados até 7 dias atrás.

## Fases

- [x] **Fase 0** — Setup
- [x] **Fase 1** — Auth, onboarding, CRUD de hábitos/tarefas, tela Hoje, regras com testes
- [ ] **Fase 2** — Evolução (gráficos, filtros) e detalhe do hábito com heatmap
- [ ] **Fase 3** — Gamificação (temporadas, conquistas, perfil)
- [ ] **Fase 4** — PWA, offline, lembretes, exportar CSV, excluir conta
- [ ] **Fase 5** — Monetização

> A Zoryka não substitui acompanhamento profissional de saúde.
