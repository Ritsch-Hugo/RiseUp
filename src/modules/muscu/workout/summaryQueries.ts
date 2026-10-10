import { useQuery } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import { brokenRecords, exerciseRecords, type BrokenRecord } from '../rules/records'
import { workoutVolume } from '../rules/volume'

export type ExerciseSummary = {
  exerciseId: string
  name: string
  setCount: number
  broken: BrokenRecord[]
  records: ReturnType<typeof exerciseRecords>
  /** Records avant cette séance (pour afficher « 92 → 95 kg »). */
  before: ReturnType<typeof exerciseRecords>
}

export type WorkoutSummary = {
  workout: Tables<'muscu_workouts'>
  durationSeconds: number
  volume: number
  setCount: number
  exercises: ExerciseSummary[]
}

const SET_COLUMNS = 'weight_kg, reps, is_warmup'

/**
 * Résumé d'une séance terminée. Calculé côté client pour l'instant :
 * à remplacer par des vues SQL (rien de dérivé stocké).
 */
export function useWorkoutSummary(id: string | undefined) {
  return useQuery({
    queryKey: ['muscu', 'summary', id],
    enabled: !!id,
    queryFn: async (): Promise<WorkoutSummary> => {
      const { data, error } = await supabase
        .from('muscu_workouts')
        .select(
          `*, muscu_workout_exercises(id, exercise_id, position, exercise:muscu_exercises(name), sets:muscu_sets(${SET_COLUMNS}))`
        )
        .eq('id', id!)
        .single()
      if (error) throw error
      const { muscu_workout_exercises: wes, ...workout } = data
      const exerciseIds = wes.map((we) => we.exercise_id)

      const history = new Map<string, { weight_kg: number; reps: number; is_warmup: boolean }[]>()
      if (exerciseIds.length > 0) {
        const { data: past, error: e2 } = await supabase
          .from('muscu_workout_exercises')
          .select(
            `exercise_id, workout:muscu_workouts!inner(ended_at), sets:muscu_sets(${SET_COLUMNS})`
          )
          .in('exercise_id', exerciseIds)
          .neq('workout_id', id!)
          .not('workout.ended_at', 'is', null)
        if (e2) throw e2
        for (const row of past) {
          history.set(row.exercise_id, [...(history.get(row.exercise_id) ?? []), ...row.sets])
        }
      }

      const exercises = [...wes]
        .sort((a, b) => a.position - b.position)
        .map((we): ExerciseSummary => {
          const records = exerciseRecords(we.sets)
          const before = exerciseRecords(history.get(we.exercise_id) ?? [])
          return {
            exerciseId: we.exercise_id,
            name: we.exercise?.name ?? 'Exercice',
            setCount: we.sets.length,
            records,
            before,
            broken: brokenRecords(before, records),
          }
        })
        .filter((e) => e.setCount > 0)

      const allSets = wes.flatMap((we) => we.sets)
      const end = workout.ended_at ? new Date(workout.ended_at).getTime() : Date.now()
      return {
        workout,
        durationSeconds: (end - new Date(workout.started_at).getTime()) / 1000,
        volume: workoutVolume(allSets),
        setCount: allSets.filter((s) => !s.is_warmup).length,
        exercises,
      }
    },
  })
}
