-- Auditoria de segurança: toda tabela do schema public precisa de RLS ligada e de pelo menos uma política.
-- Rode no SQL Editor (ou em Postgres local depois das migrations). Resultado esperado: nenhuma linha.
select c.relname as tabela,
       case
         when not c.relrowsecurity then 'RLS desligada'
         when not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
           then 'RLS ligada, mas sem nenhuma política (ninguém acessa)'
       end as problema
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and (
    not c.relrowsecurity
    or not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
  )
order by 1;

-- Funções "security definer" do schema public (devem ser poucas e revisadas):
select p.proname as funcao_security_definer, pg_get_function_identity_arguments(p.oid) as argumentos
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;
