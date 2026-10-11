import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Tables } from '../../../core'
import { RECENT_ENTRIES_FETCHED } from '../config'
import type { FoodFormResult } from '../rules/food'

export type Food = Tables<'nutri_foods'>

const KEY = ['nutri', 'foods']

/** Aliments non archivés (petit volume : un seul appel, filtrage côté client). */
export function useFoods() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Food[]> => {
      const { data, error } = await supabase
        .from('nutri_foods')
        .select('*')
        .is('archived_at', null)
        .order('name')
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000,
  })
}

type FoodValuesToSave = Extract<FoodFormResult, { values: unknown }>['values'] & {
  source?: 'off' | 'perso'
  barcode?: string | null
}

/** Crée l'aliment (`existingId` absent) ou le modifie ; renvoie son id. */
export function useSaveFood() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      existingId,
      values,
    }: {
      existingId?: string
      values: FoodValuesToSave
    }) => {
      if (existingId) {
        const { error } = await supabase.from('nutri_foods').update(values).eq('id', existingId)
        if (error) throw error
        return existingId
      }
      const id = crypto.randomUUID()
      const { error } = await supabase
        .from('nutri_foods')
        .insert({ id, source: 'perso', ...values })
      if (error) throw error
      return id
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

/** Favori : mise à jour optimiste. */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      const { error } = await supabase
        .from('nutri_foods')
        .update({ is_favorite: favorite })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: KEY })
      const previous = queryClient.getQueryData<Food[]>(KEY)
      queryClient.setQueryData<Food[]>(KEY, (foods) =>
        foods?.map((f) => (f.id === id ? { ...f, is_favorite: favorite } : f))
      )
      return { previous }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

/** Archive : l'aliment disparaît des listes mais reste lisible dans le journal. */
export function useArchiveFood() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('nutri_foods')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}

/** Entrées récentes du journal (id d'aliment + date), pour l'onglet « Récents ». */
export function useRecentEntries() {
  return useQuery({
    queryKey: ['nutri', 'entries', 'recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutri_entries')
        .select('food_id, created_at')
        .order('created_at', { ascending: false })
        .limit(RECENT_ENTRIES_FETCHED)
      if (error) throw error
      return data
    },
    staleTime: 60_000,
  })
}
