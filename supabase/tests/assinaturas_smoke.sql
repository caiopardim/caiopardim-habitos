-- Planos: o usuário não consegue se dar Premium. Rode depois de stub_supabase.sql e das migrations.
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated; -- igual ao Supabase: quem barra é a RLS
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@x'),
  ('22222222-2222-2222-2222-222222222222', 'b@x');

select 'teste grátis de 7 dias criado no cadastro' as teste,
       count(*) = 2 and bool_and(trial_ate > now() + interval '6 days') as ok
from public.assinaturas;

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'A só vê a própria assinatura' as teste, count(*) = 1 as ok from public.assinaturas;
update public.assinaturas set premium_ate = now() + interval '10 years'; -- não altera nada (sem política)
\set ON_ERROR_STOP 0
insert into public.pagamentos (user_id, mp_payment_id, ciclo, valor, status)
values (auth.uid(), 'fake', 'anual', 0, 'approved'); -- deve falhar (RLS)
\set ON_ERROR_STOP 1
reset role;

select 'ninguém virou Premium sozinho' as teste, bool_and(premium_ate is null) as ok from public.assinaturas;
select 'nenhum pagamento falso' as teste, count(*) = 0 as ok from public.pagamentos;
