-- Zoryka — lembretes por notificação (Bloco 5.3)

-- Preferências de notificação no perfil
alter table public.profiles
  add column if not exists notif_fechamento boolean not null default true,
  add column if not exists notif_habitos    boolean not null default true,
  add column if not exists notif_sequencia  boolean not null default true,
  add column if not exists silencio_inicio  time not null default '22:30',
  add column if not exists silencio_fim     time not null default '07:00',
  add column if not exists notif_max_dia    smallint not null default 3 check (notif_max_dia between 1 and 10);

-- Lembrete por hábito (no horário sugerido)
alter table public.habits
  add column if not exists lembrete boolean not null default false;

-- Aparelhos inscritos para receber push (um usuário pode ter vários)
create table public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  user_agent  text,
  criado_em   timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

-- Registro do que foi enviado (limite por dia e para não repetir o mesmo lembrete)
create table public.notification_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  data        date not null,           -- dia do usuário (no fuso dele)
  tipo        text not null check (tipo in ('habito', 'fechamento', 'sequencia', 'teste')),
  ref         text not null default '',
  enviado_em  timestamptz not null default now(),
  unique (user_id, data, tipo, ref)
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_log   enable row level security;

create policy "push: dono" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- O usuário só lê o próprio histórico; quem grava é o servidor (service role, que ignora RLS).
create policy "notificacoes: ler as próprias" on public.notification_log
  for select to authenticated using (user_id = (select auth.uid()));
