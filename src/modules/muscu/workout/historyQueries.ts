import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../core'
import type { MuscleGroup } from '../config'
import { brokenCountByWorkout } from '../rules/history'
import { workoutVolume } from '../rules/volume'

export type PastWorkout = {
  id: string
  name: string
  /** Séance type d'origine (null pour une séance libre ou une séance type supprimée). */
  sessionId: string | null
  startedAt: string
  durationSeconds: number
  volume: number
  records: number
  /** Groupes principaux travaillés, sans doublon, dans l'ordre de la séance. */
  groups: MuscleGroup[]
}

/**
 * Séances terminées et comptées (≥ 1 série hors échauffement), plus récente d'abord.
 * Calculé côté client pour l'instant : à remplacer par des vues SQL.
 */
export function usePastWorkouts() {
  return useQuery({
    queryKey: ['muscu', 'past-workouts'],
    staleTime: 60_000,
    queryFn: async (): Promise<PastWorkout[]> => {
      const { data, error } = await supabase
        .from('muscu_workouts')
        .select(
          'id, name, session_id, started_at, ended_at, muscu_workout_exercises(exercise_id, position, exercise:muscu_exercises(primary_group), sets:muscu_sets(weight_kg, reps, is_warmup))'
        )
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: true })
      if (error) throw error

      const workouts = data
        .map((w) => ({
          ...w,
          exercises: [...w.muscu_workout_exercises].sort((a, b) => a.position - b.position),
        }))
        .filter((w) => w.exercises.some((e) => e.sets.some((s) => !s.is_warmup)))

      const broken = brokenCountByWorkout(
        workouts.map((w) => ({
          id: w.id,
          exercises: w.exercises.map((e) => ({ exerciseId: e.exercise_id, sets: e.sets })),
        }))
      )

      return workouts
        .map((w) => ({
          id: w.id,
          name: w.name,
          sessionId: w.session_id,
          startedAt: w.started_at,
          durationSeconds:
            (new Date(w.ended_at!).getTime() - new Date(w.started_at).getTime()) / 1000,
          volume: workoutVolume(w.exercises.flatMap((e) => e.sets)),
          records: broken.get(w.id) ?? 0,
          groups: [
            ...new Set(w.exercises.flatMap((e) => (e.exercise ? [e.exercise.primary_group] : []))),
          ],
        }))
        .reverse()
    },
  })
}
