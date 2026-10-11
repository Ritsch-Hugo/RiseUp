import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../core'
import type { MuscleGroup } from '../config'

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
 * Tout vient des vues SQL `muscu_workout_stats` (durée, volume, groupes) et `muscu_workout_records`.
 */
export function usePastWorkouts() {
  return useQuery({
    queryKey: ['muscu', 'past-workouts'],
    staleTime: 60_000,
    queryFn: async (): Promise<PastWorkout[]> => {
      const [stats, records] = await Promise.all([
        supabase.from('muscu_workout_stats').select('*').order('started_at', { ascending: true }),
        supabase.from('muscu_workout_records').select('id, records'),
      ])
      if (stats.error) throw stats.error
      if (records.error) throw records.error
      const broken = new Map(records.data.map((r) => [r.id, Number(r.records)]))

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
