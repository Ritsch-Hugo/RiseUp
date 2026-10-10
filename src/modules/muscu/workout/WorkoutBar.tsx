import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { formatClock } from './format'
import type { OpenWorkout } from './workoutQueries'
import styles from './workout.module.css'

/** Barre « séance en cours » affichée au-dessus des onglets Muscu quand la séance est réduite. */
export function WorkoutBar({ workout }: { workout: OpenWorkout }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const complete = workout.exercises.filter(
    (we) => we.target_sets !== null && we.sets.length >= we.target_sets
  ).length

  return (
    <Link to="/muscu/seance" className={styles.bar} aria-label="Ouvrir la séance en cours">
      <span className={styles.dot} />
      <span className={styles.barText}>
        <span className={styles.barName}>{workout.name}</span>
        <span className={styles.sub}>
          Séance en cours · {complete} / {workout.exercises.length} exercices
        </span>
      </span>
      <span className={styles.barClock}>
        {formatClock((now - new Date(workout.started_at).getTime()) / 1000)}
      </span>
      <Icon name="arrowUp" size={20} />
    </Link>
  )
}
