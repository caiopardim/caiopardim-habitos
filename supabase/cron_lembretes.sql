-- Zoryka — agenda os lembretes a cada 15 minutos usando o próprio Supabase (funciona no plano grátis).
-- NÃO é uma migration: troque os dois valores abaixo e rode uma vez no SQL Editor.
--   SEU_DOMINIO     → endereço do app publicado (ex.: https://zoryka.app)
--   SEU_CRON_SECRET → o mesmo valor da variável CRON_SECRET do app
-- Para desfazer: select cron.unschedule('zoryka-lembretes');

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'zoryka-lembretes',
  '*/15 * * * *',
  $$
  select net.http_get(
    url := 'https://SEU_DOMINIO/api/cron/lembretes',
    headers := jsonb_build_object('Authorization', 'Bearer SEU_CRON_SECRET'),
    timeout_milliseconds := 55000
  );
  $$
);
