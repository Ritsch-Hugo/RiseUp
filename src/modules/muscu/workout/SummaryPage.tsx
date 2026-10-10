import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '../../../core/ui'
import { LibraryState } from '../library/LibraryState'
import type { BrokenRecord } from '../rules/records'
import { formatNumber } from './rows'
import { useWorkoutSummary, type ExerciseSummary } from './summaryQueries'
import styles from './workout.module.css'

function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}

const RECORD_LABELS: Record<BrokenRecord, string> = {
  maxLoad: 'Charge max',
  best1RM: '1RM estimé',
  bestSet: 'Meilleure série',
  maxReps: 'Reps max',
}

function recordLine(e: ExerciseSummary, kind: BrokenRecord): string {
  const { records: now, before } = e
  switch (kind) {
    case 'maxLoad':
      return `${formatNumber(before.maxLoad)} → ${formatNumber(now.maxLoad)} kg`
    case 'best1RM':
      return `${formatNumber(Math.round(before.best1RM))} → ${formatNumber(Math.round(now.best1RM))} kg`
    case 'bestSet':
      return `${formatNumber(now.bestSet!.weight)} × ${now.bestSet!.reps}`
    case 'maxReps':
      return `${before.maxReps} → ${now.maxReps} reps`
  }
}

/** Écran affiché juste après « Terminer la séance ». */
export function SummaryPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, isPending, isError } = useWorkoutSummary(id)

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {data && (
        <>
          <div className={styles.summaryHead}>
            <span className={styles.summaryCheck}>✓</span>
            <h2>Séance terminée</h2>
            <span className={styles.sub}>
              {data.workout.name} ·{' '}
              {new Date(data.workout.started_at).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </span>
          </div>

          <div className={styles.summaryGrid}>
            <SummaryStat value={formatDuration(data.durationSeconds)} label="Durée" />
            <SummaryStat
              value={`${Math.round(data.volume).toLocaleString('fr-FR')} kg`}
              label="Volume"
            />
            <SummaryStat value={String(data.setCount)} label="Séries" />
            <SummaryStat value={String(data.exercises.length)} label="Exercices" />
          </div>

          <Card large>
            <h2>Records battus</h2>
            {data.exercises.some((e) => e.broken.length > 0) ? (
              data.exercises
                .filter((e) => e.broken.length > 0)
                .map((e) => (
                  <div key={e.exerciseId} className={styles.recordBlock}>
                    <Link
                      to={`/muscu/bibliotheque/exercice/${e.exerciseId}`}
                      className={styles.recordName}
                    >
                      {e.name}
                    </Link>
                    {e.broken.map((kind) => (
                      <span key={kind} className={styles.recordLine}>
                        {RECORD_LABELS[kind]} <strong>{recordLine(e, kind)}</strong>
                      </span>
                    ))}
                  </div>
                ))
            ) : (
              <p className={styles.homeText}>Pas de record cette fois. La régularité paie aussi.</p>
            )}
          </Card>

          <Button fullWidth onClick={() => navigate('/muscu', { replace: true })}>
            Terminé
          </Button>
        </>
      )}
    </LibraryState>
  )
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.summaryStat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
