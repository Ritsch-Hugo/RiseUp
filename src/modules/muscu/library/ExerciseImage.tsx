import { Icon } from '../../../core/ui'
import { EXERCISE_IMAGES_PATH } from '../config'
import { useSignedImageUrl, type Exercise } from '../queries'
import { isUploadedImage } from './exerciseForm'

type ExerciseImageProps = { exercise: Exercise; step?: 0 | 1; iconSize?: number }

/** Image d'un exercice : photo perso (URL signée) ou image statique de la bibliothèque de base. */
export function ExerciseImage({ exercise, step = 0, iconSize = 44 }: ExerciseImageProps) {
  const path = exercise.image_path
  const uploaded = isUploadedImage(path)
  const signed = useSignedImageUrl(path)
  const src = uploaded
    ? signed.data
    : path && EXERCISE_IMAGES_PATH + path.replace(/0\.jpg$/, `${step}.jpg`)
  if (!src) return path ? null : <Icon name="dumbbell" size={iconSize} />
  return <img src={src} alt="" loading="lazy" />
}
