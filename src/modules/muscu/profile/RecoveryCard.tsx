import { Card } from '../../../core/ui'
import { MUSCLE_GROUPS, RECOVERY_ALMOST_READY_HOURS, RECOVERY_DANGER_PROGRESS } from '../config'
import type { Recovery } from '../rules/muscles'
import styles from './profile.module.css'

function status(r: Recovery) {
  if (r.remainingHours <= 0) return { text: 'Prêt', color: 'var(--positive)' }
  if (r.remainingHours <= RECOVERY_ALMOST_READY_HOURS)
    return { text: 'Presque prêt', color: 'var(--positive)' }
  const text = `Encore ${Math.ceil(r.remainingHours)} h`
  return r.progress < RECOVERY_DANGER_PROGRESS
    ? { text, color: 'var(--danger)' }
    : { text, color: 'var(--accent-2)' }
}

export function RecoveryCard({ recovery }: { recovery: Recovery[] }) {
  return (
    <Card large>
      <h2 className={styles.cardTitle}>Récupération musculaire</h2>
      <p className={styles.cardSub}>Prêt pour une nouvelle séance ?</p>
      <div className={styles.recoveryList}>
        {MUSCLE_GROUPS.map((g) => {
          const r = recovery.find((x) => x.group === g.key)!
          const s = status(r)
          return (
            <div key={g.key} className={styles.recoveryRow}>
              <span className={styles.recoveryName}>{g.label}</span>
              <span className={styles.recoveryTrack}>
                <span
                  className={styles.recoveryFill}
                  style={{ width: `${Math.round(r.progress * 100)}%`, background: s.color }}
                />
              </span>
              <span className={styles.recoveryStatus} style={{ color: s.color }}>
                {s.text}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
