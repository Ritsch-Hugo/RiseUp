import { levelFromXp, rankFor } from '../rules/xp'
import { Icon } from '../../../core/ui'
import { RewardsSection } from '../rewards/RewardsSection'
import { BADGES, PROGRESS_CHART_DAYS } from '../config'
import { useActiveStreak, useBadges, useProgressStats, useXpTotal } from './xpQueries'
import styles from './xp.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

const W = 318
const H = 90

/** Écran Progrès : niveau, chiffres clés, tâches terminées par jour, badges. */
export function ProgressPage() {
  const { data: total } = useXpTotal()
  const { data: stats } = useProgressStats()
  const { data: streak } = useActiveStreak()
  const { data: unlocked } = useBadges()
  if (total === undefined || !stats) return <ListSkeleton />

  const l = levelFromXp(total)
  const max = Math.max(1, ...stats.chart.map((d) => d.completed))
  const step = W / PROGRESS_CHART_DAYS
  const barW = step - 4

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Progrès</h2>

      <div className={styles.bigCard}>
        <div className={styles.cardTop}>
          <div className={styles.bigBadge}>
            <span className={styles.bigBadgeLabel}>NIV.</span>
            <span className={styles.bigBadgeValue}>{l.level}</span>
          </div>
          <div className={styles.cardText}>
            <span className={styles.rank}>{rankFor(l.level)}</span>
            <span className={styles.cardSub}>{total.toLocaleString('fr-FR')} XP au total</span>
          </div>
        </div>
        <div className={styles.toNext}>
          <div className={styles.toNextHead}>
            <span className={styles.cardSub}>Vers le niveau {l.level + 1}</span>
            <span className={styles.cardXp}>
              {l.xpInto} / {l.xpForNext} XP
            </span>
          </div>
          <div className={styles.barThick}>
            <div style={{ width: `${l.progress * 100}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.tiles}>
        <div className={styles.tile}>
          <span className={styles.tileValue}>{stats.totalCompleted}</span>
          <span className={styles.cardSub}>tâches terminées</span>
        </div>
        <div className={styles.tile}>
          <span className={`${styles.tileValue} ${styles.good}`}>
            {stats.successRate === null ? '–' : `${stats.successRate} %`}
          </span>
          <span className={styles.cardSub}>taux de réussite</span>
        </div>
        <div className={styles.tile}>
          <span className={styles.tileValue}>{streak?.best ?? 0} j</span>
          <span className={styles.cardSub}>meilleure série</span>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.chartHead}>
          <h3 className={styles.chartTitle}>Tâches terminées</h3>
          <span className={styles.cardSub}>{PROGRESS_CHART_DAYS} derniers jours</span>
        </div>
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Tâches terminées par jour sur ${PROGRESS_CHART_DAYS} jours`}
        >
          {stats.chart.map((d, i) => {
            const h = Math.max(4, (d.completed / max) * H)
            return (
              <rect
                key={d.day}
                x={i * step}
                y={H - h}
                width={barW}
                height={h}
                rx={4}
                fill="var(--accent)"
                fillOpacity={i === stats.chart.length - 1 ? 1 : 0.45}
              />
            )
          })}
        </svg>
        <span className={styles.cardSub}>
          Taux de réussite : tâches arrivées à échéance sur 30 jours qui ont été terminées.
        </span>
      </div>

      <div className={styles.badgesHead}>
        <h3 className={styles.section}>Badges</h3>
        <span className={styles.cardSub}>
          {unlocked?.size ?? 0} sur {BADGES.length}
        </span>
      </div>
      <div className={styles.badges}>
        {BADGES.map((b) => {
          const on = unlocked?.has(b.key) ?? false
          return (
            <div key={b.key} className={on ? styles.badge : styles.badgeLocked}>
              <span className={on ? styles.badgeIcon : styles.badgeIconLocked}>
                <Icon name={on ? b.icon : 'lock'} size={on ? 24 : 22} strokeWidth={2.2} />
              </span>
              <span className={styles.badgeLabel}>{b.label}</span>
            </div>
          )
        })}
      </div>

      <RewardsSection totalXp={total} />
    </div>
  )
}
