import { useQuery, type QueryClient } from '@tanstack/react-query'
import { addDays, parisDay, supabase } from '../../../core'
import { bestStreak, currentStreak } from '../../../core/streak'
import { PROGRESS_CHART_DAYS, SUCCESS_RATE_DAYS } from '../config'
import { fetchTotalXp } from './xpAwards'

const XP_KEY = ['taches', 'xp']
const DAYS_KEY = ['taches', 'active-days']
const STATS_KEY = ['taches', 'stats']

/** À appeler après tout gain / annulation d'XP ou changement de tâche terminée. */
export function invalidateProgress(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: XP_KEY })
  queryClient.invalidateQueries({ queryKey: DAYS_KEY })
  queryClient.invalidateQueries({ queryKey: STATS_KEY })
}

export function useXpTotal() {
  return useQuery({ queryKey: [...XP_KEY, 'total'], queryFn: fetchTotalXp })
}

/** Événements d'XP d'un jour (pour afficher l'XP réellement gagné sur chaque ligne). */
export function useXpOnDay(day: string) {
  return useQuery({
    queryKey: [...XP_KEY, 'day', day],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('taches_xp_events')
        .select('source, source_id, xp')
        .eq('day', day)
      if (error) throw error
      return data
    },
  })
}

/** Jours actifs, série en cours et meilleure série. */
export function useActiveStreak() {
  return useQuery({
    queryKey: DAYS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from('taches_active_days').select('day')
      if (error) throw error
      const days = new Set(data.flatMap((d) => (d.day ? [d.day] : [])))
      return { current: currentStreak(days, parisDay()), best: bestStreak(days) }
    },
  })
}

/** Chiffres de l'écran Progrès : tâches terminées, taux de réussite, graphe des derniers jours. */
export function useProgressStats() {
  return useQuery({
    queryKey: [...STATS_KEY, 'progress'],
    queryFn: async () => {
      const today = parisDay()
      const since = addDays(today, -(PROGRESS_CHART_DAYS - 1))
      const rateSince = addDays(today, -(SUCCESS_RATE_DAYS - 1))
      const [byDay, dueAll, dueDone] = await Promise.all([
        supabase.from('taches_completed_by_day').select('day, completed'),
        supabase
          .from('taches_tasks')
          .select('id', { count: 'exact', head: true })
          .is('archived_at', null)
          .gte('due_date', rateSince)
          .lte('due_date', today),
        supabase
          .from('taches_tasks')
          .select('id', { count: 'exact', head: true })
          .is('archived_at', null)
          .not('completed_at', 'is', null)
          .gte('due_date', rateSince)
          .lte('due_date', today),
      ])
      if (byDay.error) throw byDay.error
      if (dueAll.error) throw dueAll.error
      if (dueDone.error) throw dueDone.error
      const counts = new Map(byDay.data.map((d) => [d.day!, Number(d.completed)]))
      const total = [...counts.values()].reduce((t, n) => t + n, 0)
      const due = dueAll.count ?? 0
      return {
        totalCompleted: total,
        /** Part des tâches arrivées à échéance sur la période qui ont été terminées ; null sans échéance. */
        successRate: due > 0 ? Math.round(((dueDone.count ?? 0) / due) * 100) : null,
        chart: Array.from({ length: PROGRESS_CHART_DAYS }, (_, i) => {
          const day = addDays(since, i)
          return { day, completed: counts.get(day) ?? 0 }
        }),
      }
    },
  })
}
