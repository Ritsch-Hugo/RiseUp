-- Records battus par séance, dérivés à la lecture (même règle que src/modules/muscu/rules/records.ts).
-- Par exercice d'une séance : charge max, meilleur 1RM (Epley, 1 à 12 reps), meilleure série (poids × reps)
-- et reps max (séries sans charge), échauffement exclu. Un exercice compte s'il bat au moins un de ses
-- records face aux séances comptées précédentes ; sans historique, rien n'est « battu ».

create view public.muscu_workout_records
with (security_invoker = true) as
with entry as (
  select
    st.id as workout_id,
    st.user_id,
    st.started_at,
    we.id as entry_id,
    we.exercise_id,
    coalesce(max(s.weight_kg) filter (where s.weight_kg > 0), 0)::float8 as max_load,
    coalesce(max(
      case when s.weight_kg > 0 and s.reps between 1 and 12
        then case when s.reps = 1 then s.weight_kg::float8
                  else s.weight_kg::float8 * (1 + s.reps::float8 / 30) end
      end
    ), 0) as best_1rm,
    coalesce(max(s.weight_kg::float8 * s.reps) filter (where s.weight_kg > 0), 0) as best_set,
    coalesce(max(s.reps) filter (where s.weight_kg = 0), 0)::float8 as max_reps
  from public.muscu_workout_stats st
  join public.muscu_workout_exercises we on we.workout_id = st.id
  left join public.muscu_sets s
    on s.workout_exercise_id = we.id and not s.is_warmup and s.reps >= 1
  group by st.id, st.user_id, st.started_at, we.id, we.exercise_id
)
select
  e.workout_id as id,
  e.user_id,
  count(*) filter (
    where (p.max_load > 0 or p.max_reps > 0)
      and (e.max_load > p.max_load or e.best_1rm > p.best_1rm
           or e.best_set > p.best_set or e.max_reps > p.max_reps)
  ) as records
from entry e
cross join lateral (
  select
    coalesce(max(o.max_load), 0) as max_load,
    coalesce(max(o.best_1rm), 0) as best_1rm,
    coalesce(max(o.best_set), 0) as best_set,
    coalesce(max(o.max_reps), 0) as max_reps
  from entry o
  where o.exercise_id = e.exercise_id
    and (o.started_at, o.workout_id) < (e.started_at, e.workout_id)
) p
group by e.workout_id, e.user_id;
