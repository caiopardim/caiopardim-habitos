-- Zoryka — planos e pagamentos (Bloco 5.11)
-- Segurança: o usuário só LÊ a própria assinatura. Quem escreve é o servidor (service role),
-- depois de confirmar o pagamento direto com o Mercado Pago. Assim ninguém se dá Premium sozinho.

create table public.assinaturas (
  user_id            uuid primary key references auth.users (id) on delete cascade,
  -- fim do teste grátis de 7 dias (definido no cadastro)
  trial_ate          timestamptz,
  -- acesso Premium pago até esta data (renovações somam a partir daqui)
  premium_ate        timestamptz,
  ciclo              text check (ciclo in ('mensal', 'anual')),
  -- assinatura recorrente no cartão (Mercado Pago preapproval)
  mp_preapproval_id  text unique,
  status             text not null default 'sem_assinatura'
                       check (status in ('sem_assinatura', 'pendente', 'ativa', 'cancelada', 'pausada')),
  atualizado_em      timestamptz not null default now()
);

create table public.pagamentos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  mp_payment_id  text not null unique,           -- idempotência do webhook
  ciclo          text not null check (ciclo in ('mensal', 'anual')),
  valor          numeric(10, 2) not null,
  metodo         text,                            -- pix, credit_card…
  status         text not null,                   -- approved, refunded…
  criado_em      timestamptz not null default now()
);
create index pagamentos_user_idx on public.pagamentos (user_id, criado_em desc);

alter table public.assinaturas enable row level security;
alter table public.pagamentos  enable row level security;

create policy "assinatura: ler a própria" on public.assinaturas
  for select to authenticated using (user_id = (select auth.uid()));
create policy "pagamentos: ler os próprios" on public.pagamentos
  for select to authenticated using (user_id = (select auth.uid()));
-- sem políticas de insert/update/delete: só o servidor (service role) grava.

-- Teste grátis de 7 dias para quem se cadastrar a partir de agora…
create or replace function public.handle_new_user_assinatura()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.assinaturas (user_id, trial_ate)
  values (new.id, now() + interval '7 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_assinatura
  after insert on auth.users
  for each row execute function public.handle_new_user_assinatura();

-- …e para quem já tem conta (começa a contar agora).
insert into public.assinaturas (user_id, trial_ate)
select id, now() + interval '7 days' from auth.users
on conflict (user_id) do nothing;
