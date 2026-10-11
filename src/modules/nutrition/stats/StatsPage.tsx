import { useState } from 'react'
import { Link } from 'react-router-dom'
import { parisDay } from '../../../core'
import { Card, IconLink } from '../../../core/ui'
import { KCAL_TARGET_TOLERANCE, STATS_PERIODS, type StatsPeriod } from '../config'
import { goalsOnDay, useGoalRows } from '../goals/goalsQueries'
import { formatAmount } from '../rules/food'
import { ringFraction } from '../rules/journal'
import { averages, calorieShares, daysInTarget, monthDays, windowDays } from '../rules/stats'
import { formatWater, weekdayLetter } from '../rules/water'
import { useDayTotals, useStreak, useWaterDays } from './statsQueries'
import styles from './stats.module.css'
import { ListSkeleton } from '../../../core/ui/Skeleton'

const CHART_W = 318
const CHART_H = 110

const shortDate = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

export function StatsPage() {
  const streak = useStreak()
  const goalRows = useGoalRows()
  const water = useWaterDays()
  const totals = useDayTotals()
  const [period, setPeriod] = useState<StatsPeriod>('7')

  if (streak.isPending || !goalRows.data || !totals.data) {
    return <ListSkeleton />
  }
  return (
    <StatsView
      period={period}
      setPeriod={setPeriod}
      totals={totals.data}
      tracked={streak.tracked!}
      goalRows={goalRows.data}
      waterDays={water.data ?? []}
      current={streak.current}
      best={streak.best}
    />
  )
}

type ViewProps = {
  period: StatsPeriod
  setPeriod: (p: StatsPeriod) => void
  totals: NonNullable<ReturnType<typeof useDayTotals>['data']>
  tracked: Set<string>
  goalRows: NonNullable<ReturnType<typeof useGoalRows>['data']>
  waterDays: { day: string; ml: number }[]
  current: number
  best: number
}

function StatsView({
  period,
  setPeriod,
  totals,
  tracked,
  goalRows,
  waterDays,
  current,
  best,
}: ViewProps) {
  const today = parisDay()
  const n = STATS_PERIODS.find((p) => p.key === period)!.days
  const days = windowDays(today, n)
  const goalToday = goalsOnDay(goalRows, today)
  const avg = averages(totals, tracked, days, today)
  const inTarget = daysInTarget(
    totals,
    tracked,
    days,
    today,
    (d) => goalsOnDay(goalRows, d).kcal,
    KCAL_TARGET_TOLERANCE
  )
  const shares = avg && calorieShares(avg)
  const byDay = new Map(totals.map((d) => [d.day, d]))

  // Eau : moyenne sur les jours où l'on a bu, objectif atteint selon l'objectif de chaque jour.
  const waterByDay = new Map(waterDays.map((d) => [d.day, d.ml]))
  const waterLogged = days.filter((d) => (waterByDay.get(d) ?? 0) > 0)
  const waterAvg = waterLogged.length
    ? waterLogged.reduce((t, d) => t + waterByDay.get(d)!, 0) / waterLogged.length
    : 0
  const waterReached = days.filter(
    (d) =>
      (waterByDay.get(d) ?? 0) >= goalsOnDay(goalRows, d).water_ml &&
      goalsOnDay(goalRows, d).water_ml > 0
  ).length

  const max = Math.max(goalToday.kcal, ...days.map((d) => byDay.get(d)?.kcal ?? 0), 1)
  const gap = n <= 7 ? 11 : n <= 30 ? 2 : 0.5
  const barW = (CHART_W - gap * (n - 1)) / n
  const goalY = CHART_H - (goalToday.kcal / max) * CHART_H
  const labels =
    n <= 7 ? days.map(weekdayLetter) : [days[0]!, days[Math.floor(n / 2)]!, today].map(shortDate)

  const MACROS = [
    { key: 'protein', goal: 'protein_g', label: 'Protéines', color: 'var(--macro-protein)' },
    { key: 'carbs', goal: 'carbs_g', label: 'Glucides', color: 'var(--macro-carbs)' },
    { key: 'fat', goal: 'fat_g', label: 'Lipides', color: 'var(--macro-fat)' },
  ] as const

  const month = `${today.slice(0, 7)}-01`
  const monthTitle = new Date(`${month}T12:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h2 className={styles.title}>Stats</h2>
        <IconLink to="/nutrition/stats/objectifs" icon="target" label="Objectifs" />
      </div>

      <div className={styles.segmented} role="group" aria-label="Période">
        {STATS_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={p.key === period ? styles.segOn : styles.seg}
            aria-pressed={p.key === period}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <Card>
        <div className={styles.head}>
          <h3 className={styles.cardTitle}>Calories</h3>
          <span className={styles.sub}>objectif {formatAmount(goalToday.kcal, 0)} kcal</span>
        </div>
        {avg ? (
          <div className={styles.figures}>
            <div>
              <span className={styles.big}>{formatAmount(avg.kcal, 0)}</span>
              <span className={styles.sub}>moyenne par jour</span>
            </div>
            <div>
              <span className={`${styles.big} ${styles.good}`}>
                {inTarget} / {avg.count}
              </span>
              <span className={styles.sub}>jours dans l’objectif</span>
            </div>
          </div>
        ) : (
          <p className={styles.sub}>Pas encore de jour suivi sur cette période.</p>
        )}
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          role="img"
          aria-label={`Calories par jour sur ${n} jours, objectif de ${formatAmount(goalToday.kcal, 0)}`}
        >
          {days.map((d, i) => {
            const kcal = byDay.get(d)?.kcal ?? 0
            if (kcal <= 0) return null
            const h = Math.max(3, (kcal / max) * CHART_H)
            return (
              <rect
                key={d}
                x={i * (barW + gap)}
                y={CHART_H - h}
                width={barW}
                height={h}
                rx={Math.min(6, barW / 2)}
                fill="var(--accent)"
                fillOpacity={d === today ? 1 : tracked.has(d) ? 0.5 : 0.25}
              />
            )
          })}
          <line
            x1={0}
            x2={CHART_W}
            y1={goalY}
            y2={goalY}
            stroke="var(--text)"
            strokeOpacity={0.6}
            strokeWidth={1.5}
            strokeDasharray="5 5"
          />
        </svg>
        <div className={n <= 7 ? styles.letters : styles.dates}>
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
        {avg && (
          <p className={styles.sub}>
            Moyenne sur {avg.count} jour{avg.count > 1 ? 's' : ''} suivi{avg.count > 1 ? 's' : ''}{' '}
            (hors aujourd’hui).
          </p>
        )}
      </Card>

      {avg && (
        <>
          <Card>
            <div className={styles.head}>
              <h3 className={styles.cardTitle}>Macros</h3>
              <span className={styles.sub}>moyenne par jour</span>
            </div>
            {MACROS.map((m) => (
              <div key={m.key} className={styles.macro}>
                <div className={styles.macroHead}>
                  <span className={styles.macroName} style={{ color: m.color }}>
                    {m.label}
                  </span>
                  <span className={styles.sub}>
                    {formatAmount(avg[m.key], 0)} / {goalToday[m.goal]} g
                  </span>
                </div>
                <div className={styles.track}>
                  <div
                    style={{
                      width: `${ringFraction(avg[m.key], goalToday[m.goal]) * 100}%`,
                      background: m.color,
                    }}
                  />
                </div>
              </div>
            ))}
            {shares && (
              <div className={styles.shares}>
                <span className={styles.sharesTitle}>RÉPARTITION DES CALORIES</span>
                <div className={styles.shareBar}>
                  {MACROS.map((m) => (
                    <div key={m.key} style={{ width: `${shares[m.key]}%`, background: m.color }} />
                  ))}
                </div>
                <div className={styles.legend}>
                  {MACROS.map((m) => (
                    <span key={m.key}>
                      {m.label} {shares[m.key]} %
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card>
            <h3 className={styles.cardTitle}>Fibres, sucres, sel</h3>
            <div className={styles.row}>
              <span>Fibres</span>
              <span className={styles.rowValue}>
                {formatAmount(avg.fiber, 0)} g{' '}
                <span className={styles.sub}>/ {goalToday.fiber_g} g</span>
              </span>
            </div>
            <div className={styles.row}>
              <span>Sucres</span>
              <span className={styles.rowValue}>{formatAmount(avg.sugars, 0)} g</span>
            </div>
            <div className={styles.row}>
              <span>Sel</span>
              <span className={styles.rowValue}>
                <span className={avg.salt > goalToday.salt_g ? styles.over : undefined}>
                  {formatAmount(avg.salt, 1)} g
                </span>{' '}
                <span className={styles.sub}>/ {formatAmount(goalToday.salt_g, 1)} g max</span>
              </span>
            </div>
          </Card>
        </>
      )}

      <Link to="/nutrition/eau" className={styles.waterCard}>
        <span className={styles.waterText}>
          <span className={styles.cardTitle}>Eau</span>
          <span className={styles.sub}>
            objectif atteint {waterReached} jour{waterReached > 1 ? 's' : ''} sur {n}
          </span>
        </span>
        <span className={styles.rowValue}>
          {waterLogged.length > 0 ? formatWater(waterAvg) : '–'}{' '}
          <span className={styles.sub}>/ jour</span>
        </span>
      </Link>

      <Card>
        <div className={styles.head}>
          <h3 className={styles.cardTitle}>Régularité</h3>
          <span className={styles.sub}>jours suivis</span>
        </div>
        <div className={styles.figures}>
          <div>
            <span className={`${styles.big} ${styles.accent}`}>
              {current} jour{current > 1 ? 's' : ''}
            </span>
            <span className={styles.sub}>série en cours</span>
          </div>
          <div>
            <span className={styles.big}>
              {best} jour{best > 1 ? 's' : ''}
            </span>
            <span className={styles.sub}>meilleure série</span>
          </div>
        </div>
        <p className={styles.monthTitle}>{monthTitle}</p>
        <div className={styles.calGrid}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((l, i) => (
            <span key={i} className={styles.weekday}>
              {l}
            </span>
          ))}
          {monthDays(month).map((d, i) =>
            d === null ? (
              <span key={i} />
            ) : (
              <span
                key={d}
                className={`${tracked.has(d) ? styles.dayOn : styles.day} ${d === today ? styles.dayToday : ''} ${
                  d > today ? styles.dayFuture : ''
                }`}
              >
                {Number(d.slice(8))}
              </span>
            )
          )}
        </div>
        <p className={styles.sub}>
          On récompense la régularité du suivi, pas le fait de manger moins. L’eau ne compte pas
          dans la série.
        </p>
      </Card>
    </div>
  )
}
