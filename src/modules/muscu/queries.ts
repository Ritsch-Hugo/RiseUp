import { useQuery } from '@tanstack/react-query'
import { supabase, type Tables } from '../../core'

export type Exercise = Tables<'muscu_exercises'>

/** Tous les exercices non archivés, triés par nom (≈100 lignes : filtrage côté client). */
export function useExercises() {
  return useQuery({
    queryKey: ['muscu', 'exercises'],
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('muscu_exercises')
        .select('*')
        .is('archived_at', null)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}
