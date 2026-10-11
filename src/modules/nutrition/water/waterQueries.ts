import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addDays, supabase, type Tables } from '../../../core'
import { WATER_CHART_DAYS } from '../config'

export type WaterRow = Tables<'nutri_water'>

const dayKey = (day: string) => ['nutri', 'water', 'day', day]
const weekKey = (day: string) => ['nutri', 'water', 'week', day]

/** Ajouts d'eau d'un jour, du plus ancien au plus récent. */
export function useWater(day: string) {
  return useQuery({
    queryKey: dayKey(day),
    queryFn: async (): Promise<WaterRow[]> => {
      const { data, error } = await supabase
        .from('nutri_water')
        .select('*')
        .eq('day', day)
        .order('created_at')
      if (error) throw error
      return data
    },
  })
}

/** Ajouts des `WATER_CHART_DAYS` jours qui finissent à `day`. */
export function useWaterWeek(day: string) {
  return useQuery({
    queryKey: weekKey(day),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutri_water')
        .select('day, amount_ml')
        .gte('day', addDays(day, -(WATER_CHART_DAYS - 1)))
        .lte('day', day)
      if (error) throw error
      return data
    },
  })
}

/** Ajoute `ml` à `day` ; le total s'affiche tout de suite (mise à jour optimiste). */
export function useAddWater() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ day, ml, id }: { day: string; ml: number; id: string }) => {
      const { error } = await supabase.from('nutri_water').insert({ id, day, amount_ml: ml })
      if (error) throw error
    },
    onMutate: async ({ day, ml, id }) => {
      await queryClient.cancelQueries({ queryKey: dayKey(day) })
      const previous = queryClient.getQueryData<WaterRow[]>(dayKey(day))
      const now = new Date().toISOString()
      queryClient.setQueryData<WaterRow[]>(dayKey(day), (rows) => [
        ...(rows ?? []),
        { id, user_id: '', day, amount_ml: ml, created_at: now, updated_at: now },
      ])
      return { previous, day }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(dayKey(context!.day), context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['nutri', 'water'] }),
  })
}

/** Annule un ajout (le dernier, depuis l'écran Eau). */
export function useRemoveWater() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (row: WaterRow) => {
      const { error } = await supabase.from('nutri_water').delete().eq('id', row.id)
      if (error) throw error
    },
    onMutate: async (row) => {
      await queryClient.cancelQueries({ queryKey: dayKey(row.day) })
      const previous = queryClient.getQueryData<WaterRow[]>(dayKey(row.day))
      queryClient.setQueryData<WaterRow[]>(dayKey(row.day), (rows) =>
        rows?.filter((r) => r.id !== row.id)
      )
      return { previous, day: row.day }
    },
    onError: (_e, _v, context) => queryClient.setQueryData(dayKey(context!.day), context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['nutri', 'water'] }),
  })
}
