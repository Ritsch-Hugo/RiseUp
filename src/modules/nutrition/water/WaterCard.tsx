import { Link } from 'react-router-dom'
import { Card, Icon } from '../../../core/ui'
import { WATER_JOURNAL_QUICK_ADDS, WATER_QUICK_ADDS } from '../config'
import { ringFraction } from '../rules/journal'
import { formatWater, totalMl } from '../rules/water'
import { useAddWater, useWater } from './waterQueries'
import styles from './water.module.css'

/** Carte Eau du journal : total du jour, barre, ajouts rapides, lien vers le détail. */
export function WaterCard({ day, goalMl }: { day: string; goalMl: number }) {
  const { data: rows } = useWater(day)
  const add = useAddWater()
  const drunk = totalMl(rows ?? [])
  const detail = `/nutrition/eau?jour=${day}`

  return (
    <Card>
      <Link to={detail} className={styles.cardLink}>
        <div className={styles.cardHead}>
          <Icon name="droplet" size={22} />
          <h2 className={styles.cardTitle}>Eau</h2>
          <span className={styles.cardTotal}>
            {formatWater(drunk)} <span className={styles.sub}>/ {formatWater(goalMl)}</span>
          </span>
        </div>
        <div className={styles.track}>
          <div style={{ width: `${ringFraction(drunk, goalMl) * 100}%` }} />
        </div>
      </Link>
      <div className={styles.quick}>
        {WATER_QUICK_ADDS.slice(0, WATER_JOURNAL_QUICK_ADDS).map((q) => (
          <button
            key={q.ml}
            type="button"
            className={styles.quickButton}
            onClick={() => add.mutate({ id: crypto.randomUUID(), day, ml: q.ml })}
          >
            + {q.ml} mL
          </button>
        ))}
        <Link to={detail} className={styles.quickOther}>
          Autre
        </Link>
      </div>
    </Card>
  )
}
