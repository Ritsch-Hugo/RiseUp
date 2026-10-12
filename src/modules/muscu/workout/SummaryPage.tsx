import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Sheet } from '../../../core/ui'
import { LibraryState } from '../library/LibraryState'
import type { BrokenRecord } from '../rules/records'
import { formatDuration } from './format'
import { formatNumber } from './rows'
import { useDeleteWorkout } from './workoutQueries'
import { useWorkoutSummary, type ExerciseSummary } from './summaryQueries'
import styles from './workout.module.css'

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
  const remove = useDeleteWorkout()
  const [confirming, setConfirming] = useState(false)

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
          <Button variant="danger" fullWidth onClick={() => setConfirming(true)}>
            Supprimer cette séance
          </Button>

          <Sheet
            open={confirming}
            onClose={() => setConfirming(false)}
            title="Supprimer la séance ?"
          >
            <p className={styles.homeText}>
              Les séries, le volume et les records de cette séance disparaissent pour de bon.
            </p>
            <div className={styles.sheetActions}>
              <Button
                variant="danger"
                fullWidth
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(data.workout.id, {
                    onSuccess: () => navigate('/muscu', { replace: true }),
                  })
                }
              >
                Supprimer
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
                Annuler
              </Button>
            </div>
          </Sheet>
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
