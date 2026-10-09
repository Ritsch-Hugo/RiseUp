import { NavLink } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import styles from './TabBar.module.css'

export type Tab = { to: string; label: string; icon: IconName; end?: boolean }

export function TabBar({ tabs }: { tabs: Tab[] }) {
  return (
    <nav className={styles.bar} aria-label="Onglets du module">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            [styles.tab, isActive && styles.active].filter(Boolean).join(' ')
          }
        >
          <span className={styles.indicator} />
          <Icon name={tab.icon} />
          <span className={styles.label}>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
