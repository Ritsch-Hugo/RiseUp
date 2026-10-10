import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Icon, IconLink } from '../../../core/ui'
import { ExerciseImage } from '../library/ExerciseImage'
import { LibraryState } from '../library/LibraryState'
import { useExercises } from '../queries'
import { useOpenWorkout, useStartWorkout } from '../workout/workoutQueries'
import { usePrograms } from './programQueries'
import { formatTarget } from './programs'
import styles from './programs.module.css'

/** Aperçu d'une séance type et bouton « Lancer la séance ». */
export function LancerSeancePage() {
  const { id, sessionId } = useParams()
  const navigate = useNavigate()
  const { data: programs, isPending, isError } = usePrograms()
  const { data: exercises } = useExercises()
  const { data: open } = useOpenWorkout()
  const start = useStartWorkout()
  const program = programs?.find((p) => p.id === id)
  const session = program?.sessions.find((s) => s.id === sessionId)

  if (programs && !session) return <Navigate to="/muscu/bibliotheque/programmes" replace />

  return (
    <LibraryState isPending={isPending} isError={isError}>
      {program && session && (
        <>
          <div className={styles.titleRow}>
            <IconLink
              to={`/muscu/bibliotheque/programmes/${program.id}`}
              icon="chevronLeft"
              label="Retour"
            />
            <span className={styles.titleText}>
              <span className={styles.title}>{program.name}</span>
              <span className={styles.meta}>
                {program.sessions.length} séance{program.sessions.length > 1 ? 's' : ''}
                {program.days_per_week ? ` · ${program.days_per_week} jours par semaine` : ''}
              </span>
            </span>
            <IconLink
              to={`/muscu/bibliotheque/programmes/${program.id}/seance/${session.id}/modifier`}
              icon="edit"
              label="Modifier la séance"
            />
          </div>

          <div className={styles.chips}>
            {program.sessions.map((s) => (
              <Link
                key={s.id}
                replace
                to={`/muscu/bibliotheque/programmes/${program.id}/seance/${s.id}`}
                className={s.id === session.id ? styles.chipOn : styles.chip}
              >
                {s.name}
              </Link>
            ))}
          </div>

          <div className={styles.cardText}>
            <span className={styles.bigTitle}>{session.name}</span>
            <span className={styles.meta}>
              {session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className={styles.list}>
            {session.exercises.map((se) => {
              const ex = exercises?.find((e) => e.id === se.exercise_id)
              return (
                <div key={se.id} className={styles.launchRow}>
                  <span className={styles.launchThumb}>
                    {ex && <ExerciseImage exercise={ex} iconSize={26} />}
                  </span>
                  <span className={styles.cardText}>
                    <span className={styles.lineName}>{ex?.name ?? 'Exercice archivé'}</span>
                    <span className={styles.meta}>
                      {formatTarget(se.target_sets, se.target_reps_min, se.target_reps_max)}
                    </span>
                  </span>
                </div>
              )
            })}
            {session.exercises.length === 0 && (
              <p className={styles.empty}>Cette séance n’a pas encore d’exercice.</p>
            )}
          </div>

          {open ? (
            <Button fullWidth onClick={() => navigate('/muscu/seance')}>
              Reprendre la séance en cours ({open.name})
            </Button>
          ) : (
            <Button
              fullWidth
              disabled={start.isPending || session.exercises.length === 0}
              onClick={() =>
                start.mutate(
                  { name: session.name, session },
                  { onSuccess: () => navigate('/muscu/seance') }
                )
              }
            >
              <span className={styles.buttonContent}>
                <Icon name="play" size={18} />
                Lancer la séance
              </span>
            </Button>
          )}
          {start.isError && <p className={styles.error}>Impossible de lancer la séance.</p>}
        </>
      )}
    </LibraryState>
  )
}
