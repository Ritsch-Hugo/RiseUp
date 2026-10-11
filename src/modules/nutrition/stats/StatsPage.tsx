import { Link } from 'react-router-dom'
import { Card, ComingSoon } from '../../../core/ui'
import styles from './stats.module.css'

/** Stats Nutrition : les graphes arrivent plus tard ; en attendant, accès aux objectifs. */
export function StatsPage() {
  return (
    <>
      <Link to="/nutrition/stats/objectifs" className={styles.link}>
        <Card className={styles.goalsCard}>
          <span className={styles.goalsTitle}>Objectifs</span>
          <span className={styles.sub}>Calories, macros, eau et jours suivis</span>
        </Card>
      </Link>
      <ComingSoon name="Stats" />
    </>
  )
}
