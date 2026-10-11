import { useQuery } from '@tanstack/react-query'
import { addDays, parisDay, supabase } from '../../../core'
import { STATS_PERIODS } from '../config'
import { goalsOnDay, useGoalRows } from '../goals/goalsQueries'
import { bestStreak, currentStreak, trackedSet, type DayTotals } from '../rules/stats'

const MAX_WATER_DAYS = Math.max(...STATS_PERIODS.map((p) => p.days))

/** Totaux du journal par jour, tout l'historique (une ligne par jour : petit volume). */
export function useDayTotals() {
  return useQuery({
    queryKey: ['nutri', 'day-totals'],
    queryFn: async (): Promise<DayTotals[]> => {
      const { data, error } = await supabase.from('nutri_day_totals').select('*').order('day')
      if (error) throw error
      return data.map((d) => ({
        day: d.day!,
        slots_tracked: Number(d.slots_tracked),
        kcal: Number(d.kcal),
        protein: Number(d.protein),
        carbs: Number(d.carbs),
        sugars: Number(d.sugars),
        fat: Number(d.fat),
        saturated_fat: Number(d.saturated_fat),
        fiber: Number(d.fiber),
        salt: Number(d.salt),
      }))
    },
    staleTime: 60_000,
  })
}

/** Eau par jour sur la plus longue période des stats. */
export function useWaterDays() {
  return useQuery({
    queryKey: ['nutri', 'water-days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutri_water_day')
        .select('day, amount_ml')
        .gte('day', addDays(parisDay(), -(MAX_WATER_DAYS - 1)))
      if (error) throw error
      return data.map((d) => ({ day: d.day!, ml: Number(d.amount_ml) }))
    },
    staleTime: 60_000,
  })
}

/** Jours suivis (objectif de l'époque pour le nombre de créneaux), série en cours et meilleure série. */
export function useStreak() {
  const totals = useDayTotals()
  const goals = useGoalRows()
  if (!totals.data || !goals.data) {
    return {
      isPending: true as const,
      totals: undefined,
      tracked: undefined,
      current: 0,
      best: 0,
      goalRows: undefined,
    }
  }
  const rows = goals.data
  const tracked = trackedSet(totals.data, (d) => goalsOnDay(rows, d).min_slots_tracked)
  return {
    isPending: false as const,
    totals: totals.data,
    tracked,
    current: currentStreak(tracked, parisDay()),
    best: bestStreak(tracked),
    goalRows: rows,
  }
}
