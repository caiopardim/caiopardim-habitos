-- Zoryka — conta e onboarding (Bloco 5.1 / 5.2)

-- Objetivo principal e horário para fechar o dia (usado pelos lembretes do Bloco 5.3).
alter table public.profiles
  add column if not exists objetivo text check (objetivo is null or char_length(objetivo) <= 40),
  add column if not exists lembrete_horario time;

-- Exclusão de conta pelo próprio usuário (LGPD).
-- Apaga o usuário de auth.users; o "on delete cascade" remove todos os dados dele.
-- security definer: roda como dono da função, mas só apaga quem chamou (auth.uid()).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'não autenticado';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
