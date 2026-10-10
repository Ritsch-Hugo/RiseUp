import { NavLink } from 'react-router-dom'
import styles from './library.module.css'

/** Bascule Exercices / Programmes en haut de la bibliothèque. */
export function LibrarySwitch() {
  return (
    <nav className={styles.switch} aria-label="Bibliothèque">
      <NavLink
        to="/muscu/bibliotheque"
        end
        className={({ isActive }) => (isActive ? styles.switchOn : styles.switchOff)}
      >
        Exercices
      </NavLink>
      <NavLink
        to="/muscu/bibliotheque/programmes"
        className={({ isActive }) => (isActive ? styles.switchOn : styles.switchOff)}
      >
        Programmes
      </NavLink>
    </nav>
  )
}
