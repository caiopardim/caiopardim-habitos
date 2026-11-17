-- Teste de RLS dos lembretes (rodar depois de stub_supabase.sql e das migrations).
grant usage on schema public to authenticated; grant all on all tables in schema public to authenticated;
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','a@x'),('22222222-2222-2222-2222-222222222222','b@x');
set role authenticated; set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
insert into public.push_subscriptions (endpoint, p256dh, auth) values ('https://push/a','k','s');
\echo '--- esperado ERRO: usuário não grava no log (só o servidor):'
insert into public.notification_log (user_id, data, tipo) values ('11111111-1111-1111-1111-111111111111','2026-03-01','teste');
set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
\echo '--- esperado 0: B não vê assinaturas de A'
select count(*) from public.push_subscriptions;
\echo '--- esperado ERRO: B não inscreve aparelho em nome de A'
insert into public.push_subscriptions (user_id, endpoint, p256dh, auth) values ('11111111-1111-1111-1111-111111111111','https://push/b','k','s');
