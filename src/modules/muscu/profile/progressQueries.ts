import { useQuery } from '@tanstack/react-query'
import { fetchAll, supabase } from '../../../core'
import { PROGRESS_PERIODS } from '../config'
import type { ProgressRow } from '../rules/exerciseProgress'

const MAX_DAYS = Math.max(...PROGRESS_PERIODS.map((p) => p.days))

/**
 * Séries des exercices « poids × reps » sur la plus longue période proposée ; le filtre par période
 * se fait côté client. Calculé côté client pour l'instant : à remplacer par des vues SQL.
 */
export function useProgressRows() {
  return useQuery({
    queryKey: ['muscu', 'progress-rows'],
    staleTime: 60_000,
    queryFn: async (): Promise<ProgressRow[]> => {
      const since = new Date(Date.now() - MAX_DAYS * 24 * 3600 * 1000).toISOString()
      const data = await fetchAll((from, to) =>
        supabase
          .from('muscu_workout_exercises')
          .select(
            'id, exercise_id, workout:muscu_workouts!inner(started_at, ended_at), exercise:muscu_exercises!inner(name, primary_group, secondary_groups, tracking), sets:muscu_sets(weight_kg, reps, is_warmup)'
          )
          .not('workout.ended_at', 'is', null)
          .gte('workout.started_at', since)
          .eq('exercise.tracking', 'poids_reps')
          .order('id')
          .range(from, to)
      )
      return data.map((r) => ({
        exerciseId: r.exercise_id,
        name: r.exercise.name,
        primary: r.exercise.primary_group,
        secondary: r.exercise.secondary_groups,
        startedAt: r.workout.started_at,
        sets: r.sets,
      }))
    },
  })
}
