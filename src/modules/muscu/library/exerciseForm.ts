import type { Equipment, MuscleGroup, Tracking } from '../config'

export type ExerciseForm = {
  name: string
  primary: MuscleGroup
  secondary: MuscleGroup[]
  equipment: Equipment | null
  tracking: Tracking
  instructions: string
}

/** Valeurs prêtes à écrire dans muscu_exercises, ou null si le formulaire est invalide. */
export function toExerciseValues(form: ExerciseForm) {
  const name = form.name.trim()
  if (name === '') return null
  return {
    name,
    primary_group: form.primary,
    secondary_groups: form.secondary.filter((g) => g !== form.primary),
    equipment: form.equipment,
    tracking: form.tracking,
    instructions: form.instructions.trim() || null,
  }
}

/** Les photos perso sont rangées dans Storage sous `<user_id>/…` ; les images de base sont statiques. */
export const isUploadedImage = (path: string | null): boolean =>
  path !== null && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//.test(path)
