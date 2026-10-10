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

export type Equipment = Enums<'equipment_type'>

export const EQUIPMENTS: { key: Equipment; label: string }[] = [
  { key: 'barre', label: 'Barre' },
  { key: 'halteres', label: 'Haltères' },
  { key: 'machine', label: 'Machine' },
  { key: 'poulie', label: 'Poulie' },
  { key: 'poids_du_corps', label: 'Poids du corps' },
  { key: 'autre', label: 'Autre' },
]

export type Tracking = Enums<'exercise_tracking'>

/** Ce qu'on note à chaque série d'un exercice. */
export const TRACKINGS: { key: Tracking; label: string }[] = [
  { key: 'poids_reps', label: 'Poids × reps' },
  { key: 'reps', label: 'Reps' },
  { key: 'duree', label: 'Durée' },
]

/** Photos perso (Supabase Storage, bucket privé) : taille max du grand côté, en pixels. */
export const EXERCISE_PHOTO_MAX_SIDE = 1024
export const EXERCISE_PHOTO_QUALITY = 0.8
export const EXERCISE_IMAGES_BUCKET = 'exercise-images'

/** Programmes : choix « jours par semaine » et valeurs par défaut d'un exercice ajouté à une séance type. */
export const PROGRAM_DAYS_OPTIONS = [2, 3, 4, 5, 6]
export const DEFAULT_PROGRAM_DAYS = 3
export const DEFAULT_TARGET_SETS = 3
export const DEFAULT_TARGET_REPS_MIN = 8
export const DEFAULT_TARGET_REPS_MAX = 12
export const DEFAULT_REST_SECONDS = 90

/** Minuteur de repos : pas des boutons − / + (secondes). */
export const REST_STEP_SECONDS = 15

/** 1RM estimé (Epley) : valable de 1 à 12 reps. */
export const ONE_RM_MAX_REPS = 12
