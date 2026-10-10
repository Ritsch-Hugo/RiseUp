import { Navigate, useParams } from 'react-router-dom'
import { Card, Icon, IconLink } from '../../../core/ui'
import { EXERCISE_IMAGES_PATH, MUSCLE_GROUPS } from '../config'
import { useExercises, type Exercise } from '../queries'
import { LibraryState } from './LibraryState'
import styles from './exercice.module.css'

const labelOf = (key: string) => MUSCLE_GROUPS.find((g) => g.key === key)?.label ?? key

/** Images de l'exercice : les exercices de base (free-exercise-db) en ont deux (départ / arrivée). */
function imagesOf(exercise: Exercise): string[] {
  if (!exercise.image_path) return []
  const paths = exercise.is_custom
    ? [exercise.image_path]
    : [exercise.image_path, exercise.image_path.replace(/0\.jpg$/, '1.jpg')]
  return paths.map((p) => EXERCISE_IMAGES_PATH + p)
}

export function ExercicePage() {
  const { id } = useParams()
  const { data: exercises, isPending, isError } = useExercises()
  const exercise = exercises?.find((e) => e.id === id)

  if (exercises && !exercise) return <Navigate to="/muscu/bibliotheque" replace />

  const images = exercise ? imagesOf(exercise) : []

  return (
    <>
      <div className={styles.titleRow}>
        <IconLink
          to={exercise ? `/muscu/bibliotheque/${exercise.primary_group}` : '/muscu/bibliotheque'}
          icon="chevronLeft"
          label="Retour"
        />
        <h2 className={styles.title}>{exercise?.name}</h2>
      </div>
      <LibraryState isPending={isPending} isError={isError}>
        {exercise && (
          <>
            {images.length > 0 ? (
              <div className={styles.images}>
                {images.map((src) => (
                  <img key={src} src={src} alt="" />
                ))}
              </div>
            ) : (
              <div className={styles.noImage}>
                <Icon name="dumbbell" size={64} />
              </div>
            )}

            <div className={styles.chips}>
              <span className={styles.chipMain}>{labelOf(exercise.primary_group)}</span>
              {exercise.secondary_groups.map((g) => (
                <span key={g} className={styles.chip}>
                  {labelOf(g)}
                </span>
              ))}
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
