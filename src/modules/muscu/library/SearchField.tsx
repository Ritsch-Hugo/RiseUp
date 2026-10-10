import { Icon } from '../../../core/ui'
import styles from './library.module.css'

type SearchFieldProps = { value: string; onChange: (value: string) => void }

export function SearchField({ value, onChange }: SearchFieldProps) {
  return (
    <div className={styles.search}>
      <Icon name="search" size={20} />
      <label htmlFor="exercise-search" className={styles.srOnly}>
        Rechercher un exercice
      </label>
      <input
        id="exercise-search"
        type="search"
        placeholder="Rechercher un exercice"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
