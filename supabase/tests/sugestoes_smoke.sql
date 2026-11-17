-- Sugestões: cada um envia/lê só as próprias, com limite de 5 por dia.
-- Rode depois de stub_supabase.sql e das migrations.
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@x'),
  ('22222222-2222-2222-2222-222222222222', 'b@x');

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.sugestoes (tipo, texto) select 'ideia', 'sugestão número ' || g from generate_series(1, 5) g;
\set ON_ERROR_STOP 0
insert into public.sugestoes (tipo, texto) values ('ideia', 'a sexta passa do limite'); -- deve falhar
insert into public.sugestoes (user_id, tipo, texto)
values ('22222222-2222-2222-2222-222222222222', 'ideia', 'em nome de outra pessoa'); -- deve falhar
\set ON_ERROR_STOP 1
select 'A tem 5 sugestões' as teste, count(*) = 5 as ok from public.sugestoes;

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'B não vê as de A' as teste, count(*) = 0 as ok from public.sugestoes;
reset role;
