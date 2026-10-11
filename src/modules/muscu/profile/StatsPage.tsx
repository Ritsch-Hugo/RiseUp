import { Card } from '../../../core/ui'
import { MUSCLE_GROUPS, STATS_REGULARITY_WEEKS, STATS_TOP_RECORDS, WEEKLY_GOAL } from '../config'
import { LibraryState } from '../library/LibraryState'
import { weeklySeries } from '../rules/profile'
import { balance, daysAgoLabel, topRecords, volumeByGroup, volumeShares } from '../rules/stats'
import { parisDay } from '../rules/week'
import { usePastWorkouts } from '../workout/historyQueries'
import { formatNumber } from '../workout/rows'
import { useAllSetRows } from './statsQueries'
import styles from './profile.module.css'

const round1 = (n: number) => Math.round(n * 10) / 10

function SplitBar({
  title,
  parts,
}: {
  title: string
  parts: { label: string; pct: number; color: string }[] | null
}) {
  return (
    <div className={styles.split}>
      <span className={styles.cardSub}>{title}</span>
      {parts ? (
        <>
          <div className={styles.splitBar}>
            {parts.map((p) => (
              <div key={p.label} style={{ width: `${p.pct}%`, background: p.color }} />
            ))}
          </div>
          <div className={styles.splitLegend}>
            {parts.map((p) => (
              <span key={p.label} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: p.color }} />
                {p.label} {p.pct} %
              </span>
            ))}
          </div>
        </>
      ) : (
        <span className={styles.sub}>Pas encore de volume ce mois-ci.</span>
      )}
    </div>
  )
}

const WIDTH = 318
const HEIGHT = 90

export function StatsPage() {
  const sets = useAllSetRows()
  const past = usePastWorkouts()
  return (
    <LibraryState
      isPending={sets.isPending || past.isPending}
      isError={sets.isError || past.isError}
    >
      {sets.data && past.data && <Stats rows={sets.data} past={past.data} />}
    </LibraryState>
  )
}

function Stats({
  rows,
  past,
}: {
  rows: NonNullable<ReturnType<typeof useAllSetRows>['data']>
  past: NonNullable<ReturnType<typeof usePastWorkouts>['data']>
}) {
  const today = parisDay(new Date())
  const records = topRecords(rows, STATS_TOP_RECORDS)
  const volume = volumeByGroup(rows, today.slice(0, 7))
  const shares = volumeShares(volume)
  const ranked = [...MUSCLE_GROUPS].sort((a, b) => shares[b.key] - shares[a.key])
  const bal = balance(volume)
  const weeks = weeklySeries(past, today, STATS_REGULARITY_WEEKS).map((p) => p.count)
  const max = Math.max(WEEKLY_GOAL, ...weeks)
  const step = WIDTH / weeks.length
  const goalY = HEIGHT - (WEEKLY_GOAL / max) * HEIGHT

  return (
    <>
      <Card large>
        <div className={styles.calHead}>
          <h2 className={styles.cardTitle}>Records personnels</h2>
          <span className={styles.sub}>1RM estimé</span>
        </div>
        {records.length === 0 && <p className={styles.sub}>Aucun record pour l’instant.</p>}
        {records.map((r) => (
          <div key={r.exerciseId} className={styles.recordRow}>
            <span className={styles.recordText}>
              <span className={styles.recordName}>{r.name}</span>
              <span className={styles.sub}>
                {formatNumber(r.weight)} kg × {r.reps} · {daysAgoLabel(r.day, today)}
              </span>
            </span>
            <span className={styles.recordValue}>{formatNumber(round1(r.oneRM))} kg</span>
          </div>
        ))}
      </Card>

      <Card large>
        <div className={styles.calHead}>
          <h2 className={styles.cardTitle}>Répartition du volume</h2>
          <span className={styles.sub}>Ce mois-ci</span>
        </div>
        <div className={styles.recoveryList}>
          {ranked.map((g) => (
            <div key={g.key} className={styles.recoveryRow}>
              <span className={styles.recoveryName}>{g.label}</span>
              <span className={styles.volumeTrack}>
                <span
                  className={styles.recoveryFill}
                  style={{
                    width: `${(shares[g.key] / (shares[ranked[0]!.key] || 1)) * 100}%`,
                    background: 'var(--accent)',
                  }}
                />
              </span>
              <span className={styles.volumePct}>{shares[g.key]} %</span>
            </div>
          ))}
        </div>
      </Card>

      <Card large>
        <div className={styles.calHead}>
          <h2 className={styles.cardTitle}>Régularité</h2>
          <span className={styles.sub}>Objectif : {WEEKLY_GOAL} séances / sem.</span>
        </div>
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`Séances par semaine sur ${STATS_REGULARITY_WEEKS} semaines, objectif de ${WEEKLY_GOAL}`}
        >
          {weeks.map((n, i) => {
            const h = Math.max(4, (n / max) * HEIGHT)
            return (
              <rect
                key={i}
                x={i * step}
                y={HEIGHT - h}
                width={step - 8}
                height={h}
                rx={5}
                fill="var(--accent)"
                fillOpacity={i === weeks.length - 1 ? 1 : 0.4}
              />
            )
          })}
          <line
            x1={0}
            x2={WIDTH}
            y1={goalY}
            y2={goalY}
            stroke="var(--accent-2)"
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        </svg>
        <div className={styles.months}>
          <span>{STATS_REGULARITY_WEEKS} semaines</span>
          <span>Cette semaine</span>
        </div>
      </Card>

      <Card large>
        <h2 className={styles.cardTitle}>Équilibre du volume</h2>
        <SplitBar
          title="Haut / Bas du corps"
          parts={
            bal.upperLower && [
              { label: 'Haut', pct: bal.upperLower[0], color: 'var(--accent)' },
              { label: 'Bas', pct: bal.upperLower[1], color: 'var(--positive)' },
            ]
          }
        />
        <SplitBar
          title="Push / Pull (haut du corps)"
          parts={
            bal.pushPull && [
              { label: 'Push', pct: bal.pushPull[0], color: 'var(--accent)' },
              { label: 'Pull', pct: bal.pushPull[1], color: 'var(--accent-2)' },
            ]
          }
        />
      </Card>
    </>
  )
}
