import { parisDay } from '../../core'
import type { ModuleSummary } from '../../core/module'
import { splitToday } from './rules/tasks'
import { levelFromXp } from './rules/xp'
import { useTasks } from './tasks/taskQueries'
import { useActiveStreak, useXpTotal } from './xp/xpQueries'

/** Résumé de l'accueil : niveau, tâches à faire aujourd'hui, série de jours actifs. */
export function useSummary(): ModuleSummary | null {
  const { data: tasks } = useTasks()
  const { data: total } = useXpTotal()
  const { data: streak } = useActiveStreak()
  if (!tasks || total === undefined) return null

  const todo = splitToday(
    tasks.filter((t) => !t.is_boss),
    parisDay()
  ).todo.length
  const parts = [
    `Niveau ${levelFromXp(total).level}`,
    todo === 0 ? 'rien à faire' : `${todo} tâche${todo > 1 ? 's' : ''} à faire`,
  ]
  if (streak && streak.current > 0) parts.push(`série ${streak.current} j`)
  return { text: parts.join(' · '), active: todo > 0 }
}
