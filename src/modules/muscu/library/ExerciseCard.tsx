import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { EXERCISE_IMAGES_PATH } from '../config'
import type { Exercise } from '../queries'
import styles from './library.module.css'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link to={`/muscu/bibliotheque/exercice/${exercise.id}`} className={styles.exercise}>
      <span className={styles.thumb}>
        {exercise.image_path ? (
          <img src={EXERCISE_IMAGES_PATH + exercise.image_path} alt="" loading="lazy" />
        ) : (
          <Icon name="dumbbell" size={44} />
        )}
      </span>
      <span className={styles.exerciseName}>{exercise.name}</span>
    </Link>
  )
}
