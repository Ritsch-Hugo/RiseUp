import { useLocation } from 'react-router-dom'
import { COLORS } from './config'
import { Icon, ModuleLayout, type Tab } from '../../core/ui'
import { useStreak } from './stats/statsQueries'
import styles from './stats/stats.module.css'

const tabs: Tab[] = [
  { to: '/nutrition', label: 'Journal', icon: 'book', end: true },
  { to: '/nutrition/aliments', label: 'Aliments', icon: 'apple' },
  { to: '/nutrition/stats', label: 'Stats', icon: 'chart' },
]

/** Badge de la série de jours suivis, affiché sur le journal. */
function StreakBadge() {
  const { isPending, current } = useStreak()
  if (isPending) return null
  return (
    <div
      className={styles.badge}
      aria-label={`Série de ${current} jour${current > 1 ? 's' : ''} suivis`}
    >
      <Icon name="check" size={16} />
      <span>
        {current} jour{current > 1 ? 's' : ''}
      </span>
    </div>
  )
}

export function NutritionLayout() {
  const { pathname } = useLocation()
  return (
    <ModuleLayout
      title="Nutrition"
      colors={COLORS}
      tabs={tabs}
      headerRight={pathname === '/nutrition' ? <StreakBadge /> : undefined}
    />
  )
}
