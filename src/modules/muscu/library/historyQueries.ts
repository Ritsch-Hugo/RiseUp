import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../core'
import { exerciseRecords } from '../rules/records'

export type HistorySession = {
  workoutId: string
  startedAt: string
  sets: { weight_kg: number; reps: number; duration_seconds: number | null; is_warmup: boolean }[]
}

/**
 * Séances terminées d'un exercice (plus récente d'abord) + records.
 * Calculé côté client pour l'instant : à remplacer par des vues SQL.
 */
export function useExerciseHistory(exerciseId: string | undefined) {
  return useQuery({
    queryKey: ['muscu', 'exercise-history', exerciseId],
    enabled: !!exerciseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muscu_workout_exercises')
        .select(
          'workout:muscu_workouts!inner(id, started_at, ended_at), sets:muscu_sets(position, weight_kg, reps, duration_seconds, is_warmup)'
        )
        .eq('exercise_id', exerciseId!)
        .not('workout.ended_at', 'is', null)
      if (error) throw error
      const sessions: HistorySession[] = data
        .map((row) => ({
          workoutId: row.workout.id,
          startedAt: row.workout.started_at,
          sets: [...row.sets].sort((a, b) => a.position - b.position),
        }))
        .filter((s) => s.sets.length > 0)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      return { sessions, records: exerciseRecords(sessions.flatMap((s) => s.sets)) }
    },
  })
}
