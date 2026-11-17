-- Teste da exclusão de conta (rodar depois das migrations, num Postgres local com stub_supabase.sql).
grant usage on schema public to authenticated, anon;
grant all on all tables in schema public to authenticated;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','a@x'),('22222222-2222-2222-2222-222222222222','b@x');
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.habits (tipo, nome) values ('bom','Ler');
reset role;
set role anon;
\echo '--- anon tenta excluir (deve falhar com permission denied):'
select public.delete_my_account();
reset role;
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select public.delete_my_account();
reset role;
\echo '--- esperado: só a@x continua, com 1 perfil e 1 hábito:'
select (select string_agg(email, ',') from auth.users) usuarios, (select count(*) from public.profiles) perfis, (select count(*) from public.habits) habitos;
