import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parisDay, supabase } from '../../../core'
import { DEFAULT_GOALS } from '../config'
import { goalForDay, type GoalValues } from '../rules/goals'

const KEY = ['nutri', 'goals']

/** Objectif en vigueur aujourd'hui ; les valeurs par défaut tant que rien n'est enregistré. */
export function useCurrentGoals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<GoalValues> => {
      const { data, error } = await supabase.from('nutri_goals').select('*')
      if (error) throw error
      const g = goalForDay(data, parisDay())
      return g
        ? {
            kcal: g.kcal,
            protein_g: g.protein_g,
            carbs_g: g.carbs_g,
            fat_g: g.fat_g,
            fiber_g: g.fiber_g,
            salt_g: Number(g.salt_g),
            water_ml: g.water_ml,
            min_slots_tracked: g.min_slots_tracked,
          }
        : DEFAULT_GOALS
    },
  })
}

/**
 * Enregistre les objectifs à partir d'aujourd'hui : les jours passés gardent ceux de leur époque.
 * Plusieurs enregistrements le même jour modifient la même ligne.
 */
export function useSaveGoals() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values: GoalValues) => {
      const today = parisDay()
      const { data: existing, error: readError } = await supabase
        .from('nutri_goals')
        .select('id')
        .eq('effective_from', today)
        .maybeSingle()
      if (readError) throw readError
      const { error } = existing
        ? await supabase.from('nutri_goals').update(values).eq('id', existing.id)
        : await supabase
            .from('nutri_goals')
            .insert({ id: crypto.randomUUID(), effective_from: today, ...values })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
