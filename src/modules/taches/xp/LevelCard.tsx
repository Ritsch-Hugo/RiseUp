import { Link } from 'react-router-dom'
import { levelFromXp, rankFor } from '../rules/xp'
import { useXpTotal } from './xpQueries'
import styles from './xp.module.css'

/** Carte de niveau (écran Aujourd'hui) : niveau, rang, XP avant le suivant ; mène à Progrès. */
export function LevelCard() {
  const { data: total } = useXpTotal()
  if (total === undefined) return null
  const l = levelFromXp(total)
  return (
    <Link to="/taches/progres" className={styles.levelCard}>
      <div className={styles.cardTop}>
        <div className={styles.levelBadge}>
          <span className={styles.levelBadgeLabel}>Niv.</span>
          <span className={styles.levelBadgeValue}>{l.level}</span>
        </div>
        <div className={styles.cardText}>
          <span className={styles.cardTitle}>
            Niveau {l.level} · {rankFor(l.level)}
          </span>
          <span className={styles.cardSub}>
            {l.xpForNext - l.xpInto} XP avant le niveau {l.level + 1}
          </span>
        </div>
        <span className={styles.cardXp}>
          {l.xpInto} <span className={styles.cardXpTotal}>/ {l.xpForNext}</span>
        </span>
      </div>
      <div className={styles.bar}>
        <div style={{ width: `${l.progress * 100}%` }} />
      </div>
    </Link>
  )
}
