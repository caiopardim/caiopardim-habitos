-- Zoryka — retenção D1, D7 e D30 por semana de cadastro (o número mais importante do produto).
-- Rode no SQL Editor do Supabase (usa auth.users, então precisa do papel de administrador).
-- "Ativo no dia N" = registrou algum hábito ou concluiu alguma tarefa exatamente N dias depois do cadastro
-- (no fuso do usuário). Não é exposto à API nem a nenhum usuário.

with usuarios as (
  select u.id,
         (u.created_at at time zone coalesce(p.fuso, 'America/Sao_Paulo'))::date as dia_cadastro
  from auth.users u
  left join public.profiles p on p.id = u.id
),
atividade as (
  select user_id, data from public.habit_logs where status in ('feito', 'parcial', 'evitei', 'aconteceu')
  union
  select user_id, data from public.tasks where concluida
),
marcos as (
  select u.id,
         date_trunc('week', u.dia_cadastro)::date as semana,
         u.dia_cadastro,
         bool_or(a.data = u.dia_cadastro + 1)  as d1,
         bool_or(a.data = u.dia_cadastro + 7)  as d7,
         bool_or(a.data = u.dia_cadastro + 30) as d30
  from usuarios u
  left join atividade a on a.user_id = u.id
  group by u.id, u.dia_cadastro
)
select semana,
       count(*)                                                                        as cadastros,
       round(100.0 * count(*) filter (where d1)  / nullif(count(*) filter (where dia_cadastro + 1  <= current_date), 0), 1) as "D1 %",
       round(100.0 * count(*) filter (where d7)  / nullif(count(*) filter (where dia_cadastro + 7  <= current_date), 0), 1) as "D7 %",
       round(100.0 * count(*) filter (where d30) / nullif(count(*) filter (where dia_cadastro + 30 <= current_date), 0), 1) as "D30 %"
from marcos
group by semana
order by semana desc;
