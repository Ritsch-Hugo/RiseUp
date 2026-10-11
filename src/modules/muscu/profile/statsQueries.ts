import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../core'
import type { ProgressRow } from '../rules/exerciseProgress'

/**
 * Toutes les séries des séances terminées (historique complet, usage perso donc volume modeste).
 * Calculé côté client pour l'instant : à remplacer par des vues SQL.
 */
export function useAllSetRows() {
  return useQuery({
    queryKey: ['muscu', 'all-set-rows'],
    staleTime: 60_000,
    queryFn: async (): Promise<ProgressRow[]> => {
      const { data, error } = await supabase
        .from('muscu_workout_exercises')
        .select(
          'exercise_id, workout:muscu_workouts!inner(started_at, ended_at), exercise:muscu_exercises!inner(name, primary_group, secondary_groups), sets:muscu_sets(weight_kg, reps, is_warmup)'
        )
        .not('workout.ended_at', 'is', null)
      if (error) throw error
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
