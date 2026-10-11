-- Stats d'une séance, dérivées à la lecture (rien de dérivé n'est stocké, ADR-004).
-- Séance comptée = terminée avec au moins une série hors échauffement.
-- security_invoker : la vue applique la RLS de l'utilisateur qui l'interroge.

create view public.muscu_workout_stats
with (security_invoker = true) as
select
  w.id,
  w.user_id,
  w.session_id,
  w.name,
  w.started_at,
  w.ended_at,
  extract(epoch from (w.ended_at - w.started_at))::numeric as duration_seconds,
  t.volume,
  t.working_sets,
  -- groupes principaux travaillés, sans doublon, dans l'ordre de la séance
  (
    select coalesce(array_agg(g.primary_group order by g.first_position), '{}')
    from (
      select e.primary_group, min(we.position) as first_position
      from public.muscu_workout_exercises we
      join public.muscu_exercises e on e.id = we.exercise_id
      where we.workout_id = w.id
      group by e.primary_group
    ) g
  ) as groups
from public.muscu_workouts w
cross join lateral (
  select
    coalesce(sum(s.weight_kg * s.reps) filter (where not s.is_warmup), 0) as volume,
    count(*) filter (where not s.is_warmup) as working_sets
  from public.muscu_workout_exercises we
  join public.muscu_sets s on s.workout_exercise_id = we.id
  where we.workout_id = w.id
) t
where w.ended_at is not null
  and t.working_sets > 0;
