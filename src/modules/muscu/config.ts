import type { Enums } from '../../core'

export type MuscleGroup = Enums<'muscle_group'>

/** Les 10 groupes musculaires (ADR-005), dans l'ordre d'affichage. */
export const MUSCLE_GROUPS: { key: MuscleGroup; label: string; abbr: string }[] = [
  { key: 'pecs', label: 'Pecs', abbr: 'Pec' },
  { key: 'dos', label: 'Dos', abbr: 'Dos' },
  { key: 'epaules', label: 'Épaules', abbr: 'Épa' },
  { key: 'biceps', label: 'Biceps', abbr: 'Bic' },
  { key: 'triceps', label: 'Triceps', abbr: 'Tri' },
  { key: 'quadriceps', label: 'Quadriceps', abbr: 'Qua' },
  { key: 'ischios', label: 'Ischios', abbr: 'Isc' },
  { key: 'fessiers', label: 'Fessiers', abbr: 'Fes' },
  { key: 'mollets', label: 'Mollets', abbr: 'Mol' },
  { key: 'abdos', label: 'Abdos', abbr: 'Abd' },
]

/** Dossier public des images de la bibliothèque de base (free-exercise-db). */
export const EXERCISE_IMAGES_PATH = '/exercises/'
