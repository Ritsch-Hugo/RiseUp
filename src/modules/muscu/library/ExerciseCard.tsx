import { Link } from 'react-router-dom'
import type { Exercise } from '../queries'
import { ExerciseImage } from './ExerciseImage'
import styles from './library.module.css'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link to={`/muscu/bibliotheque/exercice/${exercise.id}`} className={styles.exercise}>
      <span className={styles.thumb}>
        <ExerciseImage exercise={exercise} />
      </span>
      <span className={styles.exerciseName}>{exercise.name}</span>
    </Link>
  )
}
