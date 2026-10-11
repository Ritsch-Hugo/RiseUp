import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { parisDay, supabase, type Tables } from '../../../core'
import { DEFAULT_GOALS } from '../config'
import { goalForDay, type GoalValues } from '../rules/goals'

const KEY = ['nutri', 'goals']

const toValues = (g: Tables<'nutri_goals'> | null): GoalValues =>
  g
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

/** Objectif en vigueur un jour donné d'après l'historique des objectifs ; défauts si rien d'enregistré. */
export const goalsOnDay = (rows: Tables<'nutri_goals'>[], day: string): GoalValues =>
  toValues(goalForDay(rows, day))

const fetchGoalRows = async () => {
  const { data, error } = await supabase.from('nutri_goals').select('*')
  if (error) throw error
  return data
}

/** Toutes les lignes d'objectifs (historique daté). */
export function useGoalRows() {
  return useQuery({ queryKey: KEY, queryFn: fetchGoalRows })
}

/** Objectif en vigueur un jour donné ; les valeurs par défaut tant que rien n'est enregistré. */
export function useGoalsForDay(day: string) {
  return useQuery({
    queryKey: KEY,
    queryFn: fetchGoalRows,
    select: (rows) => goalsOnDay(rows, day),
  })
}

/** Objectif en vigueur aujourd'hui. */
export const useCurrentGoals = () => useGoalsForDay(parisDay())

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
