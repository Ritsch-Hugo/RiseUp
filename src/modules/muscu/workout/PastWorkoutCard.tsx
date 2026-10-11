import { Link } from 'react-router-dom'
import { HOME_MUSCLE_BUBBLES, MUSCLE_GROUPS } from '../config'
import { formatDuration } from './format'
import type { PastWorkout } from './historyQueries'
import styles from './workout.module.css'

export function WeekStat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.weekStat}>
      <span className={styles.weekValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export function PastWorkoutCard({ workout }: { workout: PastWorkout }) {
  const date = new Date(workout.startedAt)
  const shown = workout.groups.slice(0, HOME_MUSCLE_BUBBLES)
  const hidden = workout.groups.length - shown.length
  return (
    <Link to={`/muscu/resume/${workout.id}`} className={styles.pastCard}>
      <div className={styles.pastTitle}>
        <span className={styles.pastName}>{workout.name}</span>
        <span className={styles.sub}>
          {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
          {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className={styles.weekStats}>
        <WeekStat value={formatDuration(workout.durationSeconds)} label="Durée" />
        <WeekStat
          value={`${Math.round(workout.volume).toLocaleString('fr-FR')} kg`}
          label="Volume"
        />
        <WeekStat value={String(workout.records)} label="Records" />
      </div>
      <div className={styles.bubbles}>
        {shown.map((g) => (
          <span key={g} className={styles.bubble}>
            {MUSCLE_GROUPS.find((m) => m.key === g)?.abbr}
          </span>
        ))}
        {hidden > 0 && <span className={styles.bubbleMore}>+{hidden}</span>}
      </div>
    </Link>
  )
}
