import { Link, Navigate, useParams } from 'react-router-dom'
import { Icon, IconLink } from '../../../core/ui'
import { ExerciseImage } from '../library/ExerciseImage'
import { LibraryState } from '../library/LibraryState'
import { useExercises } from '../queries'
import { usePrograms } from './programQueries'
import styles from './programs.module.css'

const THUMBS = 4

export function ProgrammePage() {
  const { id } = useParams()
  const { data: programs, isPending, isError } = usePrograms()
  const { data: exercises } = useExercises()
  const program = programs?.find((p) => p.id === id)

  if (programs && !program) return <Navigate to="/muscu/bibliotheque/programmes" replace />

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink to="/muscu/bibliotheque/programmes" icon="chevronLeft" label="Retour" />
        <span className={styles.titleText}>
          <span className={styles.title}>{program?.name}</span>
          {program && (
            <span className={styles.meta}>
              {program.sessions.length} séance{program.sessions.length > 1 ? 's' : ''}
              {program.days_per_week ? ` · ${program.days_per_week} jours par semaine` : ''}
            </span>
          )}
        </span>
        {program && (
          <IconLink
            to={`/muscu/bibliotheque/programmes/${program.id}/modifier`}
            icon="edit"
            label="Modifier le programme"
          />
        )}
      </div>
      <LibraryState isPending={isPending} isError={isError}>
        {program && (
          <>
            <h2>Séances du programme</h2>
            <div className={styles.list}>
              {program.sessions.map((s, i) => {
                const shown = s.exercises.slice(0, THUMBS)
                return (
                  <Link
                    key={s.id}
                    to={`/muscu/bibliotheque/programmes/${program.id}/seance/${s.id}`}
                    className={styles.card}
                  >
                    <span className={styles.cardText}>
                      <span className={styles.tag}>SÉANCE {i + 1}</span>
                      <span className={styles.cardTitle}>{s.name}</span>
                      <span className={styles.meta}>
                        {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                      </span>
                      {shown.length > 0 && (
                        <span className={styles.thumbs}>
                          {shown.map((se) => {
                            const ex = exercises?.find((e) => e.id === se.exercise_id)
                            return (
                              <span key={se.id} className={styles.thumb}>
                                {ex && <ExerciseImage exercise={ex} iconSize={20} />}
                              </span>
                            )
                          })}
                          {s.exercises.length > THUMBS && (
                            <span className={styles.thumb}>+{s.exercises.length - THUMBS}</span>
                          )}
                        </span>
                      )}
                    </span>
                    <Icon name="chevronRight" size={20} />
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </LibraryState>
    </>
  )
}
