import type { ReactNode } from 'react'
import { Card } from '../../../core/ui'
import type { CalendarCell } from '../rules/profile'
import styles from './profile.module.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

type CalendarProps = {
  today: string
  cells: CalendarCell[]
  count: number
  /** Un jour du mois affiché (par défaut `today`). */
  month?: string
  /** Boutons de navigation entre les mois. */
  nav?: ReactNode
  /** Rend les jours d'entraînement cliquables. */
  onSelectDay?: (day: string) => void
  selectedDay?: string | null
}

export function Calendar({
  today,
  cells,
  count,
  month = today,
  nav,
  onSelectDay,
  selectedDay,
}: CalendarProps) {
  const title = new Date(`${month}T12:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <Card large>
      <div className={styles.calHead}>
        <h2 className={styles.calTitle}>{title}</h2>
        {nav ?? (
          <span className={styles.sub}>
            {count} séance{count > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className={styles.calGrid}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={styles.weekday}>
            {d}
          </span>
        ))}
        {cells.map((c, i) => {
          if (c === null) return <span key={i} />
          const className = `${c.trained ? styles.dayOn : styles.day} ${c.today ? styles.dayToday : ''} ${
            !c.trained && c.day > today ? styles.dayFuture : ''
          } ${c.day === selectedDay ? styles.daySelected : ''}`
          return onSelectDay && c.trained ? (
            <button
              key={c.day}
              type="button"
              className={`${className} ${styles.dayButton}`}
              aria-pressed={c.day === selectedDay}
              onClick={() => onSelectDay(c.day)}
            >
              {c.label}
            </button>
          ) : (
            <span key={c.day} className={className}>
              {c.label}
            </span>
          )
        })}
      </div>
    </Card>
  )
}
