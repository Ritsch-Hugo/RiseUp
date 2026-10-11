import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../core'
import type { MuscleGroup } from '../config'
import { brokenCountByWorkout } from '../rules/history'

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
 * Durée, volume et groupes viennent de la vue SQL `muscu_workout_stats` ; les records sont encore
 * calculés côté client (à remplacer par une fonction SQL).
 */
export function usePastWorkouts() {
  return useQuery({
    queryKey: ['muscu', 'past-workouts'],
    staleTime: 60_000,
    queryFn: async (): Promise<PastWorkout[]> => {
      const [stats, content] = await Promise.all([
        supabase.from('muscu_workout_stats').select('*').order('started_at', { ascending: true }),
        supabase
          .from('muscu_workout_exercises')
          .select('workout_id, exercise_id, position, sets:muscu_sets(weight_kg, reps, is_warmup)'),
      ])
      if (stats.error) throw stats.error
      if (content.error) throw content.error

      const byWorkout = new Map<string, typeof content.data>()
      for (const e of content.data) {
        byWorkout.set(e.workout_id, [...(byWorkout.get(e.workout_id) ?? []), e])
      }
      const broken = brokenCountByWorkout(
        stats.data.map((w) => ({
          id: w.id!,
          exercises: [...(byWorkout.get(w.id!) ?? [])]
            .sort((a, b) => a.position - b.position)
            .map((e) => ({ exerciseId: e.exercise_id, sets: e.sets })),
        }))
      )

      return stats.data
        .map((w) => ({
          id: w.id!,
          name: w.name!,
          sessionId: w.session_id,
          startedAt: w.started_at!,
          durationSeconds: Number(w.duration_seconds),
          volume: Number(w.volume),
          records: broken.get(w.id!) ?? 0,
          groups: w.groups ?? [],
        }))
        .reverse()
    },
  })
}
