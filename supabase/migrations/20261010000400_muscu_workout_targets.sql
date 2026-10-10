-- Objectifs copiés dans la séance réalisée (ADR-005 : « copiées depuis le programme, pas liées »).
-- Modifier un programme ne change donc ni l'affichage ni le repos d'une séance déjà lancée.
alter table public.muscu_workout_exercises
  add column target_sets int check (target_sets > 0),
  add column target_reps_min int check (target_reps_min > 0),
  add column target_reps_max int check (target_reps_max >= target_reps_min),
  add column rest_seconds int check (rest_seconds >= 0);
