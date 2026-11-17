-- Zoryka — sugestões enviadas pelo app (Bloco 5.12)
-- O usuário grava e lê só as próprias. O dono lê todas pelo painel do Supabase (Table Editor).

create table public.sugestoes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo       text not null check (tipo in ('ideia', 'problema', 'elogio')),
  texto      text not null check (char_length(texto) between 5 and 1000),
  pagina     text check (char_length(pagina) <= 100),
  criado_em  timestamptz not null default now()
);
create index sugestoes_user_idx on public.sugestoes (user_id, criado_em desc);

alter table public.sugestoes enable row level security;

create policy "sugestões: enviar as próprias" on public.sugestoes
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "sugestões: ler as próprias" on public.sugestoes
  for select to authenticated using (user_id = (select auth.uid()));
-- sem update/delete: o que foi enviado fica como foi enviado (a exclusão da conta apaga tudo).

-- No máximo 5 sugestões por pessoa a cada 24 horas (evita abuso).
create or replace function public.limitar_sugestoes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.sugestoes
      where user_id = new.user_id and criado_em > now() - interval '24 hours') >= 5 then
    raise exception 'limite de sugestões atingido' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger sugestoes_limite
  before insert on public.sugestoes
  for each row execute function public.limitar_sugestoes();
