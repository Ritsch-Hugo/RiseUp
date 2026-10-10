import { REST_STEP_SECONDS } from '../config'
import { remainingSeconds, restProgress } from '../rules/restTimer'
import { formatClock } from './format'
import styles from './workout.module.css'

type RestCardProps = {
  endsAt: number
  total: number
  now: number
  onAdjust: (dir: -1 | 1) => void
  onStop: () => void
}

export function RestCard({ endsAt, total, now, onAdjust, onStop }: RestCardProps) {
  const left = remainingSeconds(endsAt, now)
  const finished = left === 0
  return (
    <div className={styles.rest} role="timer" aria-label="Minuteur de repos">
      <div className={styles.restHead}>
        <span className={styles.restLabel}>{finished ? 'Repos terminé' : 'Repos'}</span>
        <span className={finished ? styles.restClockDone : styles.restClock}>
          {formatClock(left)}
        </span>
      </div>
      <div className={styles.restTrack}>
        <div
          className={styles.restFill}
          style={{ width: `${restProgress(endsAt, total, now) * 100}%` }}
        />
      </div>
      <div className={styles.restButtons}>
        <button type="button" onClick={() => onAdjust(-1)}>
          − {REST_STEP_SECONDS} s
        </button>
        <button type="button" onClick={() => onAdjust(1)}>
          + {REST_STEP_SECONDS} s
        </button>
        <button type="button" className={styles.restSkip} onClick={onStop}>
          {finished ? 'Fermer' : 'Passer'}
        </button>
      </div>
    </div>
  )
}
