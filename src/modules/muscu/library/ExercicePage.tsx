import { Navigate, useParams } from 'react-router-dom'
import { Card, IconLink } from '../../../core/ui'
import { EQUIPMENTS, MUSCLE_GROUPS } from '../config'
import { useExercises } from '../queries'
import { ExerciseImage } from './ExerciseImage'
import { isUploadedImage } from './exerciseForm'
import { LibraryState } from './LibraryState'
import styles from './exercice.module.css'

const labelOf = (key: string) => MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key

export function ExercicePage() {
  const { id } = useParams()
  const { data: exercises, isPending, isError } = useExercises()
  const exercise = exercises?.find((e) => e.id === id)

  if (exercises && !exercise) return <Navigate to="/muscu/bibliotheque" replace />

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink
          to={exercise ? `/muscu/bibliotheque/${exercise.primary_group}` : '/muscu/bibliotheque'}
          icon="chevronLeft"
          label="Retour"
        />
        <h2 className={styles.title}>{exercise?.name}</h2>
        {exercise && (
          <IconLink
            to={`/muscu/bibliotheque/exercice/${exercise.id}/modifier`}
            icon="edit"
            label="Modifier l’exercice"
          />
        )}
      </div>
      <LibraryState isPending={isPending} isError={isError}>
        {exercise && (
          <>
            {exercise.image_path ? (
              <div className={styles.images}>
                <ExerciseImage exercise={exercise} step={0} iconSize={64} />
                {!isUploadedImage(exercise.image_path) && (
                  <ExerciseImage exercise={exercise} step={1} iconSize={64} />
                )}
              </div>
            ) : (
              <div className={styles.noImage}>
                <ExerciseImage exercise={exercise} iconSize={64} />
              </div>
            )}

            <div className={styles.chips}>
              <span className={styles.chipMain}>{labelOf(exercise.primary_group)}</span>
              {exercise.secondary_groups.map((g) => (
                <span key={g} className={styles.chip}>
                  {labelOf(g)}
                </span>
              ))}
              {exercise.equipment && (
                <span className={styles.chip}>
                  {EQUIPMENTS.find((q) => q.key === exercise.equipment)?.label}
                </span>
              )}
            </div>

            <Card>
              <h2>Records et historique</h2>
              <p className={styles.hint}>
                Ton record, ton 1RM estimé, ta progression et tes séances précédentes apparaîtront
                ici après ta première série sur cet exercice.
              </p>
            </Card>

            {exercise.instructions && (
              <Card>
                <h2>Consignes</h2>
                <p className={styles.instructions}>{exercise.instructions}</p>
              </Card>
            )}
          </>
        )}
      </LibraryState>
    </>
  )
}
