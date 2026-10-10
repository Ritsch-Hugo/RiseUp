import { Card } from '../../../core/ui'
import type { CalendarCell } from '../rules/profile'
import styles from './profile.module.css'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function Calendar({
  today,
  cells,
  count,
}: {
  today: string
  cells: CalendarCell[]
  count: number
}) {
  const title = new Date(`${today}T12:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return (
    <Card large>
      <div className={styles.calHead}>
        <h2 className={styles.calTitle}>{title}</h2>
        <span className={styles.sub}>
          {count} séance{count > 1 ? 's' : ''}
        </span>
      </div>
      <div className={styles.calGrid}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={styles.weekday}>
            {d}
          </span>
        ))}
        {cells.map((c, i) =>
          c === null ? (
            <span key={i} />
          ) : (
            <span
              key={c.day}
              className={`${c.trained ? styles.dayOn : styles.day} ${c.today ? styles.dayToday : ''} ${
                !c.trained && c.day > today ? styles.dayFuture : ''
              }`}
            >
              {c.label}
            </span>
          )
        )}
      </div>
    </Card>
  )
}
