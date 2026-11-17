-- Zoryka — schema inicial
-- Todas as tabelas têm RLS: cada usuário só lê e escreve os próprios dados.

-- ─────────────────────────────────────────────────────────────
-- Perfis (1:1 com auth.users)
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  nome                 text not null default '',
  fuso                 text not null default 'America/Sao_Paulo',
  limite_sequencia     numeric(3, 2) not null default 0.60
                         check (limite_sequencia between 0.10 and 1.00),
  xp_total             integer not null default 0 check (xp_total >= 0),
  nivel                integer not null default 1 check (nivel >= 1),
  onboarding_concluido boolean not null default false,
  criado_em            timestamptz not null default now()
);

-- Cria o perfil automaticamente no cadastro (e-mail ou Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Áreas da vida
-- ─────────────────────────────────────────────────────────────
create table public.life_areas (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome     text not null check (char_length(nome) between 1 and 40),
  cor      text not null,
  ordem    smallint not null default 0,
  em_foco  boolean not null default true
);
create index life_areas_user_idx on public.life_areas (user_id);

-- ─────────────────────────────────────────────────────────────
-- Hábitos (bons e maus)
-- ─────────────────────────────────────────────────────────────
create table public.habits (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area_id      uuid references public.life_areas (id) on delete set null,
  tipo         text not null check (tipo in ('bom', 'mau')),
  nome         text not null check (char_length(nome) between 1 and 60),
  emoji        text not null default '✅',
  cor          text not null default '#a3e635',
  meta_tipo    text not null default 'check' check (meta_tipo in ('check', 'quantidade')),
  meta_valor   numeric(12, 2) check (meta_valor is null or meta_valor > 0),
  unidade      text check (unidade is null or char_length(unidade) <= 20),
  dias_semana  smallint[] not null default '{}'
                 check (dias_semana <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  dificuldade  text not null default 'media' check (dificuldade in ('facil', 'media', 'dificil')),
  horario      time,
  inicio       date not null default current_date,
  arquivado    boolean not null default false,
  arquivado_em date,
  criado_em    timestamptz not null default now(),
  constraint meta_quantidade_tem_valor
    check (meta_tipo = 'check' or meta_valor is not null)
);
create index habits_user_idx on public.habits (user_id);

-- ─────────────────────────────────────────────────────────────
-- Tarefas avulsas
-- ─────────────────────────────────────────────────────────────
create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  area_id      uuid references public.life_areas (id) on delete set null,
  titulo       text not null check (char_length(titulo) between 1 and 120),
  prioridade   text not null default 'media' check (prioridade in ('alta', 'media', 'baixa')),
  dificuldade  text not null default 'media' check (dificuldade in ('facil', 'media', 'dificil')),
  data         date not null,
  concluida    boolean not null default false,
  concluida_em timestamptz,
  criado_em    timestamptz not null default now()
);
create index tasks_user_data_idx on public.tasks (user_id, data);

-- ─────────────────────────────────────────────────────────────
-- Registros diários (check-in)
-- ─────────────────────────────────────────────────────────────
create table public.habit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habit_id     uuid not null references public.habits (id) on delete cascade,
  data         date not null,
  status       text not null check (status in ('feito', 'parcial', 'nao_feito', 'evitei', 'aconteceu')),
  valor        numeric(12, 2) check (valor is null or valor >= 0),
  concluido_em timestamptz,
  unique (habit_id, data)
);
create index habit_logs_user_data_idx on public.habit_logs (user_id, data);

-- Dias de descanso (proteção de sequência: 1 por semana — validado no app)
create table public.rest_days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data    date not null,
  primary key (user_id, data)
);

-- ─────────────────────────────────────────────────────────────
-- Resumos diários (recalculados pelo app a cada mudança no dia)
-- ─────────────────────────────────────────────────────────────
create table public.daily_summaries (
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data            date not null,
  execucao        numeric(5, 4) not null default 0 check (execucao between 0 and 1),
  pontuacao       smallint not null default 0 check (pontuacao between 0 and 100),
  xp_ganho        integer not null default 0 check (xp_ganho >= 0),
  dia_perfeito    boolean not null default false,
  conta_sequencia boolean not null default false,
  atualizado_em   timestamptz not null default now(),
  primary key (user_id, data)
);

-- ─────────────────────────────────────────────────────────────
-- Gamificação (usadas na Fase 3)
-- ─────────────────────────────────────────────────────────────
create table public.seasons (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  numero         integer not null check (numero >= 1),
  inicio         date not null,
  fim            date not null,
  meta_media     smallint not null check (meta_media between 0 and 100),
  media_atingida numeric(5, 2),
  status         text not null default 'em_andamento'
                   check (status in ('em_andamento', 'concluida', 'falhou')),
  unique (user_id, inicio)
);

create table public.achievements (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo         text not null,
  conquistado_em timestamptz not null default now(),
  unique (user_id, codigo)
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles        enable row level security;
alter table public.life_areas      enable row level security;
alter table public.habits          enable row level security;
alter table public.tasks           enable row level security;
alter table public.habit_logs      enable row level security;
alter table public.rest_days       enable row level security;
alter table public.daily_summaries enable row level security;
alter table public.seasons         enable row level security;
alter table public.achievements    enable row level security;

-- Perfil: só o próprio (insert é feito pelo trigger; delete pelo cascade de auth.users)
create policy "perfil: ler o próprio" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil: editar o próprio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Tabelas com user_id simples
create policy "areas: dono" on public.life_areas
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "descanso: dono" on public.rest_days
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "resumos: dono" on public.daily_summaries
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "temporadas: dono" on public.seasons
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "conquistas: dono" on public.achievements
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Hábitos e tarefas: a área referenciada também precisa ser do usuário
create policy "habitos: dono" on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (area_id is null or exists (
      select 1 from public.life_areas a where a.id = area_id and a.user_id = (select auth.uid())
    ))
  );

create policy "tarefas: dono" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and (area_id is null or exists (
      select 1 from public.life_areas a where a.id = area_id and a.user_id = (select auth.uid())
    ))
  );

-- Registros: o hábito referenciado também precisa ser do usuário
create policy "registros: dono" on public.habit_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.habits h where h.id = habit_id and h.user_id = (select auth.uid())
    )
  );
