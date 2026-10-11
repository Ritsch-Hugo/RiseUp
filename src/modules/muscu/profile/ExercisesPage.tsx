import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '../../../core/ui'
import {
  DEFAULT_PROGRESS_PERIOD,
  MUSCLE_GROUPS,
  PROGRESS_PERIODS,
  type MuscleGroup,
  type ProgressPeriod,
} from '../config'
import { LibraryState } from '../library/LibraryState'
import { progressByExercise, type ProgressMetric } from '../rules/exerciseProgress'
import { addDays, parisDay } from '../rules/week'
import { formatNumber } from '../workout/rows'
import { LineChart } from './LineChart'
import { useProgressRows } from './progressQueries'
import styles from './profile.module.css'

const METRICS: { key: ProgressMetric; label: string; unit: string }[] = [
  { key: 'maxLoad', label: 'Charge max', unit: 'kg' },
  { key: 'oneRM', label: '1RM estimé', unit: 'kg' },
  { key: 'volume', label: 'Volume', unit: 'kg' },
]

const groupLabel = (g: MuscleGroup) => MUSCLE_GROUPS.find((x) => x.key === g)!.label
const round1 = (n: number) => Math.round(n * 10) / 10
const monthLabel = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { month: 'short', timeZone: 'UTC' })

export function ExercisesPage() {
  const { data, isPending, isError } = useProgressRows()
  const [period, setPeriod] = useState<ProgressPeriod>(DEFAULT_PROGRESS_PERIOD)
  const [metric, setMetric] = useState<ProgressMetric>('maxLoad')

  const today = parisDay(new Date())
  const days = PROGRESS_PERIODS.find((p) => p.key === period)!.days
  const since = addDays(today, -days)
  const unit = METRICS.find((m) => m.key === metric)!.unit
  const mid = addDays(today, -Math.round(days / 2))
  const list = progressByExercise(data ?? [], metric, since)
  const months = [since, mid, today].map(monthLabel)

  return (
    <LibraryState isPending={isPending} isError={isError}>
      <div className={styles.chips} role="group" aria-label="Période">
        {PROGRESS_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={p.key === period ? styles.chipOn : styles.chip}
            aria-pressed={p.key === period}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className={styles.chips} role="group" aria-label="Mesure">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            className={m.key === metric ? styles.chipOn : styles.chip}
            aria-pressed={m.key === metric}
            onClick={() => setMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {list.map((e) => (
        <Link
          key={e.exerciseId}
          to={`/muscu/bibliotheque/exercice/${e.exerciseId}`}
          className={styles.exoLink}
        >
          <Card className={styles.exoCard}>
            <div className={styles.exoHead}>
              <div className={styles.exoName}>
                <span className={styles.exoTitle}>{e.name}</span>
                <span className={styles.sub}>
                  {[e.primary, ...e.secondary.filter((g) => g !== e.primary)]
                    .slice(0, 2)
                    .map(groupLabel)
                    .join(' · ')}
                </span>
              </div>
              <div className={styles.exoValue}>
                <span className={styles.exoBig}>
                  {formatNumber(round1(e.last))} {unit}
                </span>
                {e.delta !== null && (
                  <span className={e.delta >= 0 ? styles.trendUp : styles.trendDown}>
                    {e.delta >= 0 ? '+' : '−'}
                    {formatNumber(round1(Math.abs(e.delta)))} {unit}
                  </span>
                )}
              </div>
            </div>
            <LineChart
              values={e.points.map((p) => p.value)}
              label={`Courbe de progression de ${e.name}`}
            />
            <div className={styles.months}>
              {months.map((m, i) => (
                <span key={i}>{m}</span>
              ))}
            </div>
          </Card>
        </Link>
      ))}
      {list.length === 0 && (
        <p className={styles.sub}>Aucune séance avec charge sur cette période.</p>
      )}
    </LibraryState>
  )
}
