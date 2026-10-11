import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { parisDay } from '../../core'
import { Icon, ModuleLayout, type Tab } from '../../core/ui'
import { ensureRecurringQuests } from './quests/questAwards'
import { useActiveStreak } from './xp/xpQueries'
import styles from './tasks/tasks.module.css'

const tabs: Tab[] = [
  { to: '/taches', label: 'Aujourd’hui', icon: 'checkSquare', end: true },
  { to: '/taches/a-venir', label: 'À venir', icon: 'calendar' },
  { to: '/taches/quetes', label: 'Quêtes', icon: 'flag' },
  { to: '/taches/progres', label: 'Progrès', icon: 'trophy' },
]

/** Badge « Série N j » : jours consécutifs avec au moins une tâche ou habitude validée. */
function StreakBadge() {
  const { data } = useActiveStreak()
  if (!data) return null
  return (
    <div
      className={styles.streakBadge}
      aria-label={`Série de ${data.current} jour${data.current > 1 ? 's' : ''}`}
    >
      <Icon name="bolt" size={16} strokeWidth={2.2} />
      <span>Série {data.current} j</span>
    </div>
  )
}

export function TachesLayout() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  // Nouvelle période : les quêtes « reconduire » sont recréées une seule fois.
  useEffect(() => {
    ensureRecurringQuests(parisDay())
      .then((changed) => {
        if (changed) queryClient.invalidateQueries({ queryKey: ['taches', 'quests'] })
      })
      .catch(() => undefined)
  }, [queryClient])
  return (
    <ModuleLayout
      title="Tâches"
      tabs={tabs}
      headerRight={pathname === '/taches' ? <StreakBadge /> : undefined}
    />
  )
}
