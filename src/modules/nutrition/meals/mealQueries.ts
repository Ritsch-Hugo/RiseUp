import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import type { MealSlot } from '../config'
import type { Food } from '../foods/foodQueries'

export type Meal = Tables<'nutri_meals'> & {
  items: (Pick<Tables<'nutri_meal_items'>, 'id' | 'food_id' | 'quantity_g'> & { food: Food })[]
}

const KEY = ['nutri', 'meals']

/** Repas enregistrés avec leurs aliments (petit volume : un seul appel). */
export function useMeals() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Meal[]> => {
      const { data, error } = await supabase
        .from('nutri_meals')
        .select('*, items:nutri_meal_items(id, food_id, quantity_g, food:nutri_foods(*))')
        .order('name')
      if (error) throw error
      return data.map((m) => ({
        ...m,
        items: m.items.flatMap((i) => (i.food ? [{ ...i, food: i.food }] : [])),
      }))
    },
    staleTime: 5 * 60_000,
  })
}

type SaveInput = {
  existingId?: string
  name: string
  defaultSlot: MealSlot | null
  items: { food_id: string; quantity_g: number }[]
}

/** Crée ou modifie un repas ; ses aliments sont remplacés par la liste donnée. */
export function useSaveMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ existingId, name, defaultSlot, items }: SaveInput) => {
      const id = existingId ?? crypto.randomUUID()
      if (existingId) {
        const { error } = await supabase
          .from('nutri_meals')
          .update({ name, default_slot: defaultSlot })
          .eq('id', id)
        if (error) throw error
        const { error: delError } = await supabase
          .from('nutri_meal_items')
          .delete()
          .eq('meal_id', id)
        if (delError) throw delError
      } else {
        const { error } = await supabase
          .from('nutri_meals')
          .insert({ id, name, default_slot: defaultSlot })
        if (error) throw error
      }
      if (items.length > 0) {
        const { error } = await supabase
          .from('nutri_meal_items')
          .insert(items.map((i) => ({ id: crypto.randomUUID(), meal_id: id, ...i })))
        if (error) throw error
      }
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteMeal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('nutri_meals').delete().eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
