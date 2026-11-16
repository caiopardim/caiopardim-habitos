-- Teste de fumaça da RLS em um Postgres local (fora do Supabase).
-- Uso: psql -f stub_supabase.sql -f ../migrations/*.sql -f rls_smoke.sql
\set ON_ERROR_STOP 0
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email, raw_user_meta_data) values
 ('11111111-1111-1111-1111-111111111111','a@x','{"nome":"Ana"}'),
 ('22222222-2222-2222-2222-222222222222','b@x','{"full_name":"Bruno Google"}');
select id, nome from public.profiles order by nome;  -- trigger criou os perfis

set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.life_areas (id, nome, cor) values ('aaaaaaaa-0000-0000-0000-000000000001','Saúde','#0f0');
insert into public.habits (id, area_id, tipo, nome) values ('aaaaaaaa-0000-0000-0000-0000000000a1','aaaaaaaa-0000-0000-0000-000000000001','bom','Ler');
insert into public.habit_logs (habit_id, data, status) values ('aaaaaaaa-0000-0000-0000-0000000000a1','2026-03-10','feito');

set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select 'B vê perfis' as t, count(*) from public.profiles;
select 'B vê hábitos de A' as t, count(*) from public.habits;
select 'B vê registros de A' as t, count(*) from public.habit_logs;
\echo '--- B tenta registrar no hábito de A (deve falhar):'
insert into public.habit_logs (habit_id, data, status) values ('aaaaaaaa-0000-0000-0000-0000000000a1','2026-03-11','feito');
\echo '--- B tenta criar hábito na área de A (deve falhar):'
insert into public.habits (area_id, tipo, nome) values ('aaaaaaaa-0000-0000-0000-000000000001','bom','X');
\echo '--- B tenta gravar com user_id de A (deve falhar):'
insert into public.tasks (user_id, titulo, data) values ('11111111-1111-1111-1111-111111111111','x','2026-03-10');
update public.habits set nome='hack' where id='aaaaaaaa-0000-0000-0000-0000000000a1';
delete from public.habit_logs;
update public.profiles set xp_total = 999 where id = '11111111-1111-1111-1111-111111111111';

set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select 'A ainda tem' as t, (select nome from public.habits) hab, (select count(*) from public.habit_logs) logs, (select xp_total from public.profiles) xp;
\echo '--- A: registro duplicado no mesmo dia (deve falhar por UNIQUE):'
insert into public.habit_logs (habit_id, data, status) values ('aaaaaaaa-0000-0000-0000-0000000000a1','2026-03-10','parcial');
\echo '--- A: meta quantidade sem valor (deve falhar por CHECK):'
insert into public.habits (tipo, nome, meta_tipo) values ('bom','Água','quantidade');
