-- Vues dérivées du module Tâches (rien de dérivé n'est stocké, ADR-004). security_invoker : RLS de l'appelant.

-- XP total = somme du journal d'XP ; le niveau se calcule à partir de ce total.
create view public.taches_xp_total
with (security_invoker = true) as
select user_id, sum(xp)::int as total_xp
from public.taches_xp_events
group by user_id;

-- Jours actifs (heure de Paris) : au moins une tâche terminée ou une habitude validée
-- (cochée, ou compteur ayant atteint son objectif). Sert à la série du badge « Série N j ».
create view public.taches_active_days
with (security_invoker = true) as
select user_id, (completed_at at time zone 'Europe/Paris')::date as day
from public.taches_tasks
where completed_at is not null
union
select l.user_id, l.day
from public.taches_habit_logs l
join public.taches_habits h on h.id = l.habit_id
where (h.type = 'fait' and l.value >= 1)
   or (h.type = 'compteur' and l.value >= coalesce(h.target, 2147483647));

-- Nombre de tâches terminées par jour (heure de Paris).
create view public.taches_completed_by_day
with (security_invoker = true) as
select user_id, (completed_at at time zone 'Europe/Paris')::date as day, count(*)::int as completed
from public.taches_tasks
where completed_at is not null
group by user_id, (completed_at at time zone 'Europe/Paris')::date;
