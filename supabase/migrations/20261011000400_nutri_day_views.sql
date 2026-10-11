-- Totaux par jour du journal et de l'eau, dérivés à la lecture (rien de dérivé n'est stocké, ADR-004).
-- security_invoker : la RLS de l'utilisateur qui interroge s'applique.

-- Un jour est « suivi » quand slots_tracked >= min_slots_tracked de l'objectif de l'époque (calculé côté appli).
create view public.nutri_day_totals
with (security_invoker = true) as
select
  user_id,
  day,
  count(distinct slot) as slots_tracked,
  count(*) as entries,
  sum(kcal) as kcal,
  sum(protein) as protein,
  sum(carbs) as carbs,
  sum(sugars) as sugars,
  sum(fat) as fat,
  sum(saturated_fat) as saturated_fat,
  sum(fiber) as fiber,
  sum(salt) as salt
from public.nutri_entries
group by user_id, day;

create view public.nutri_water_day
with (security_invoker = true) as
select user_id, day, sum(amount_ml)::int as amount_ml
from public.nutri_water
group by user_id, day;
