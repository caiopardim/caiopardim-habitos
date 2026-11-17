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
Auth + RLS) · Zod · date-fns · Vitest. Gráficos com Recharts (carregados sob demanda na tela Evolução).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do Supabase (opcional, veja abaixo)
npm run dev                  # http://localhost:3000
```

### Os três modos

| Modo             | Quando                                | Onde ficam os dados                                          |
| ---------------- | ------------------------------------- | ------------------------------------------------------------ |
| **Conta**        | Supabase configurado + usuário logado | Supabase (sincroniza entre dispositivos)                     |
| **Demonstração** | botão "Ver demonstração" (`/demo`)    | navegador, chave própria, dados fictícios — nunca importados |
| **Local**        | sem Supabase configurado              | navegador (`zoryka:local:v1`)                                |

Ao criar uma conta num navegador que tem dados do modo local, o app oferece **importar** esse histórico
(IDs são regenerados — `src/lib/data/import.ts`).

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
2. No **SQL Editor**, rode em ordem os arquivos de `supabase/migrations/` (ou `supabase db push` com a CLI):
   - `20261116000000_schema_inicial.sql` — tabelas, RLS e trigger que cria o perfil no cadastro;
   - `20261117000000_conta_e_onboarding.sql` — objetivo/lembrete no perfil e `delete_my_account()` (exclusão de conta);
   - `20261118000000_lembretes.sql` — preferências de notificação, aparelhos inscritos e registro de envios.
3. Em **Project Settings → API**, copie a URL e a `anon key` para o `.env.local`.
4. **Authentication → URL Configuration**: adicione `http://localhost:3000/auth/callback` (e a URL da Vercel)
   em _Redirect URLs_.
5. **Login com Google** (opcional): _Authentication → Providers → Google_, com Client ID/Secret do Google Cloud.
6. **Dados de exemplo** (opcional): preencha `SUPABASE_SERVICE_ROLE_KEY`, `SEED_USER_EMAIL` e
   `SEED_USER_PASSWORD` no `.env.local` e rode `npm run seed`. A service role key só é usada por esse script.

### Lembretes (notificações push)

1. Gere as chaves: `npx web-push generate-vapid-keys` e preencha `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` (na Vercel/Netlify e no `.env.local`).
2. Defina `CRON_SECRET` (texto aleatório) e `SUPABASE_SERVICE_ROLE_KEY` no servidor.
3. Agende `GET /api/cron/lembretes` a cada 15 minutos com `Authorization: Bearer <CRON_SECRET>`:
   - **Supabase (funciona no plano grátis):** edite e rode `supabase/cron_lembretes.sql` (pg_cron + pg_net);
   - **ou Vercel Pro:** crie um `vercel.json` com `"crons": [{ "path": "/api/cron/lembretes", "schedule": "*/15 * * * *" }]`
     (no plano Hobby a Vercel só aceita cron diário e o deploy falha).
4. No app: Configurações → Lembretes → "Receber neste aparelho" → "Enviar teste".

O que é enviado: fechar o dia (no horário escolhido, se faltar algo), por hábito (no horário sugerido, se ainda não
foi feito) e sequência em risco (20h). Respeita horário silencioso, máximo por dia e nunca repete o mesmo aviso no
dia (`notification_log`). No iPhone, push só funciona com o app instalado na tela de início (iOS 16.4+).

### Offline (PWA)

- `public/sw.js` guarda as telas e os arquivos do app (abre e navega sem internet) e recebe os pushes.
- Com conta, o último estado fica no aparelho e as marcações entram numa **fila persistente**
  (`src/lib/data/offline-repository.ts`): sobrevivem a fechar o app e são enviadas quando a conexão volta.
- Ícones, `apple-touch-icon`, telas de abertura do iOS (`public/splash/`) e convite de instalação próprio.

`supabase/tests/rls_smoke.sql` testa a RLS num Postgres local (dois usuários, um tentando ler/gravar dados do
outro) e `supabase/tests/conta_smoke.sql` testa a exclusão de conta. Rode depois de `stub_supabase.sql` e das migrations.

## Testes e CI

| Comando                             | O que testa                                                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                          | regras de negócio e dados (Vitest)                                                                                                                                                            |
| `npm run test:coverage`             | idem, com cobertura — o CI falha se `lib/domain` ficar abaixo de 95% das linhas                                                                                                               |
| `npm run build && npm run test:e2e` | ponta a ponta no navegador (Playwright): onboarding, check-in, desfazer, criar hábito, Evolução, celebrações, exportar/apagar, offline, push e acessibilidade (axe, alvos de toque, larguras) |

`.github/workflows/ci.yml` roda formatação, lint, tipos, testes com cobertura, build e ponta a ponta em todo push
e pull request.

### Ambientes

| Ambiente          | Onde                                         | Supabase                                                                    |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Desenvolvimento   | `npm run dev`                                | projeto de dev (ou modo local, sem Supabase)                                |
| Staging / preview | deploy de preview da Vercel (cada branch/PR) | projeto **separado** de staging — variáveis no ambiente _Preview_ da Vercel |
| Produção          | Vercel, branch `main`                        | projeto de produção — variáveis no ambiente _Production_                    |

**Deploy só com o CI verde:** a integração Git da Vercel publica a cada push. Para publicar a produção só depois
dos testes, desligue o deploy automático da `main` na Vercel (_Settings → Git → Ignored Build Step_ ou
`"git": { "deploymentEnabled": { "main": false } }` num `vercel.json`) e configure os segredos `VERCEL_TOKEN`,
`VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` no GitHub — o job `deploy` do CI publica depois que tudo passa.

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
- [x] **Fase 2** — Evolução: filtros, gráficos, por hábito com heatmap, insights automáticos e revisão semanal
- [x] **Fase 3** — Gamificação: temporadas, 25 medalhas, celebrações em tela cheia com compartilhamento, evolução do avatar animada
- [x] **Fase 4** — PWA, offline com fila de sincronização, lembretes por push, exportar CSV, excluir conta
- [ ] **Fase 5** — Monetização

> A Zoryka não substitui acompanhamento profissional de saúde.
