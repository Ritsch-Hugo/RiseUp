import { NavLink, Outlet } from 'react-router-dom'
import styles from './profile.module.css'

const tabs = [
  { to: '/muscu/profil', label: 'Vue d’ensemble', end: true },
  { to: '/muscu/profil/exercices', label: 'Exercices', end: false },
  { to: '/muscu/profil/stats', label: 'Stats avancées', end: false },
]

export function ProfilePage() {
  return (
    <>
      <h2 className={styles.title}>Profil</h2>
      <nav className={styles.tabs} aria-label="Sections du profil">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => (isActive ? styles.tabOn : styles.tab)}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </>
  )
}
