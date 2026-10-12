import { useQuery } from '@tanstack/react-query'
import { fetchAll, supabase } from '../../../core'
import { MUSCLE_HISTORY_DAYS } from '../config'
import type { MuscleWorkout } from '../rules/muscles'

/** Séances terminées des derniers jours, réduites à ce qu'il faut pour la sollicitation et la récupération. */
export function useMuscleWorkouts() {
  return useQuery({
    queryKey: ['muscu', 'muscle-workouts'],
    staleTime: 60_000,
    queryFn: async (): Promise<MuscleWorkout[]> => {
      const since = new Date(Date.now() - MUSCLE_HISTORY_DAYS * 24 * 3600 * 1000).toISOString()
      const data = await fetchAll((from, to) =>
        supabase
          .from('muscu_workouts')
          .select(
            'id, started_at, ended_at, muscu_workout_exercises(exercise:muscu_exercises(primary_group, secondary_groups), sets:muscu_sets(is_warmup))'
          )
          .not('ended_at', 'is', null)
          .gte('started_at', since)
          .order('id')
          .range(from, to)
      )
      return data.map((w) => ({
        startedAt: w.started_at,
        endedAt: w.ended_at!,
        exercises: w.muscu_workout_exercises.flatMap((e) =>
          e.exercise
            ? [
                {
                  primary: e.exercise.primary_group,
                  secondary: e.exercise.secondary_groups,
                  workingSets: e.sets.filter((s) => !s.is_warmup).length,
                },
              ]
            : []
        ),
      }))
    },
  })
}
