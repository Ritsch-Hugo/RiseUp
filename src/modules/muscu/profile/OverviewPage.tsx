import { useRef, useState } from 'react'
import { Card } from '../../../core/ui'
import { PROFILE_WEEKS, WEEKLY_GOAL } from '../config'
import { LibraryState } from '../library/LibraryState'
import { recovery, weeklyLoad } from '../rules/muscles'
import { monthGrid, trendPercent, weeklySeries, weeklyStreak } from '../rules/profile'
import { parisDay } from '../rules/week'
import { formatDuration } from '../workout/format'
import { usePastWorkouts } from '../workout/historyQueries'
import { BarChart } from './BarChart'
import { BodyCard } from './BodyCard'
import { Calendar } from './Calendar'
import { useMuscleWorkouts } from './muscleQueries'
import { RecoveryCard } from './RecoveryCard'
import styles from './profile.module.css'

const monthLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })

export function OverviewPage() {
  const { data: past, isPending, isError } = usePastWorkouts()
  const [page, setPage] = useState(0)
  const scroller = useRef<HTMLDivElement>(null)

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {past && <Overview past={past} page={page} setPage={setPage} scroller={scroller} />}
    </LibraryState>
  )
}

type OverviewProps = {
  past: NonNullable<ReturnType<typeof usePastWorkouts>['data']>
  page: number
  setPage: (n: number) => void
  scroller: React.RefObject<HTMLDivElement>
}

function Overview({ past, page, setPage, scroller }: OverviewProps) {
  const muscles = useMuscleWorkouts()
  const today = parisDay(new Date())
  const series = weeklySeries(past, today, PROFILE_WEEKS * 2)
  const recent = series.slice(PROFILE_WEEKS)
  const before = series.slice(0, PROFILE_WEEKS)
  const sum = (pts: typeof recent, key: 'count' | 'durationSeconds' | 'volume') =>
    pts.reduce((t, p) => t + p[key], 0)
  const trend = trendPercent(sum(recent, 'count'), sum(before, 'count'))
  const streak = weeklyStreak(
    recent.map((p) => p.count),
    WEEKLY_GOAL
  )
  const months = [
    recent[0]!,
    recent[Math.floor(recent.length / 2)]!,
    recent[recent.length - 1]!,
  ].map((p) => monthLabel(p.weekStart))
  const trained = new Set(past.map((w) => parisDay(w.startedAt)))
  const monthCount = past.filter(
    (w) => parisDay(w.startedAt).slice(0, 7) === today.slice(0, 7)
  ).length

  const charts = [
    {
      title: 'Entraînements',
      value: String(sum(recent, 'count')),
      unit: 'séances',
      trend,
      values: recent.map((p) => p.count),
    },
    {
      title: 'Volume',
      value: Math.round(sum(recent, 'volume')).toLocaleString('fr-FR'),
      unit: 'kg',
      trend: null,
      values: recent.map((p) => p.volume),
    },
    {
      title: 'Durée',
      value: formatDuration(sum(recent, 'durationSeconds')),
      unit: 'd’entraînement',
      trend: null,
      values: recent.map((p) => p.durationSeconds),
    },
  ]

  return (
    <>
      {past.length === 0 && (
        <Card>
          <p className={styles.sub}>
            Pas encore de séance : tes graphiques, ta régularité et ton calendrier se rempliront dès
            ta première séance.
          </p>
        </Card>
      )}
      <div
        ref={scroller}
        className={styles.carousel}
        onScroll={(e) => {
          const el = e.currentTarget
          setPage(Math.round(el.scrollLeft / (el.scrollWidth / charts.length)))
        }}
      >
        {charts.map((c) => (
          <Card key={c.title} className={styles.chartCard}>
            <div className={styles.chartHead}>
              <span className={styles.chartTitle}>{c.title}</span>
              <span className={styles.sub}>3 derniers mois</span>
            </div>
            <div className={styles.chartValue}>
              <span className={styles.big}>{c.value}</span>
              <span className={styles.sub}>{c.unit}</span>
              {c.trend !== null && (
                <span className={c.trend >= 0 ? styles.trendUp : styles.trendDown}>
                  {c.trend >= 0 ? '+' : ''}
                  {c.trend} %
                </span>
              )}
            </div>
            <BarChart
              values={c.values}
              label={`${c.title} par semaine sur ${PROFILE_WEEKS} semaines`}
            />
            <div className={styles.months}>
              {months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
      <div className={styles.dots} aria-hidden>
        {charts.map((c, i) => (
          <span key={c.title} className={i === page ? styles.dotOn : styles.dot} />
        ))}
      </div>

      <Card large>
        <h2>Régularité</h2>
        <p className={styles.streak}>
          {streak > 0
            ? `${streak} semaine${streak > 1 ? 's' : ''} d’affilée avec au moins ${WEEKLY_GOAL} séances`
            : `Fais ${WEEKLY_GOAL} séances dans la semaine pour lancer ta série`}
        </p>
      </Card>

      {muscles.data && (
        <>
          <RecoveryCard recovery={recovery(muscles.data, new Date())} />
          <BodyCard load={weeklyLoad(muscles.data, today)} />
        </>
      )}

      <Calendar today={today} cells={monthGrid(today, trained)} count={monthCount} />
    </>
  )
}
