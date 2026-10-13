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

/** Accueil Muscu : nombre de dernières séances affichées et de pastilles muscles par séance. */
export const HOME_RECENT_WORKOUTS = 5
export const HOME_MUSCLE_BUBBLES = 4

/** Profil : nombre de semaines des graphes (≈ 3 mois) et objectif hebdomadaire du streak. */
export const PROFILE_WEEKS = 13
export const WEEKLY_GOAL = 3

/** Muscles sollicités : séries effectives par semaine pour atteindre 100 %, poids des groupes secondaires. */
export const MUSCLE_WEEKLY_TARGET_SETS = 15
export const SECONDARY_GROUP_WEIGHT = 0.5

/** Récupération : 12 h + 4 h × séries effectives de la dernière séance, plafonné à 48 h (indicatif). */
export const RECOVERY_BASE_HOURS = 12
export const RECOVERY_HOURS_PER_SET = 4
export const RECOVERY_MAX_HOURS = 48
/** « Presque prêt » sous ce nombre d'heures restantes ; en dessous de ce taux d'avancement, la barre est en rouge. */
export const RECOVERY_ALMOST_READY_HOURS = 6
export const RECOVERY_DANGER_PROGRESS = 0.5
/** Fenêtre de séances chargée pour la récupération et les muscles sollicités (jours). */
export const MUSCLE_HISTORY_DAYS = 9

/** Profil › Exercices : périodes proposées (jours) et période par défaut. */
export const PROGRESS_PERIODS = [
  { key: '1m', label: '1 M', days: 30 },
  { key: '3m', label: '3 M', days: 91 },
  { key: '6m', label: '6 M', days: 182 },
  { key: '1a', label: '1 A', days: 365 },
] as const
export type ProgressPeriod = (typeof PROGRESS_PERIODS)[number]['key']
export const DEFAULT_PROGRESS_PERIOD: ProgressPeriod = '3m'

/** Profil › Stats avancées : nombre de records affichés, semaines de régularité. */
export const STATS_TOP_RECORDS = 5
export const STATS_REGULARITY_WEEKS = 8

/** Équilibre du volume : haut / bas du corps (abdos avec le bas), et push / pull au sein du haut. */
export const UPPER_GROUPS: MuscleGroup[] = ['pecs', 'dos', 'epaules', 'biceps', 'triceps']
export const LOWER_GROUPS: MuscleGroup[] = ['quadriceps', 'ischios', 'fessiers', 'mollets', 'abdos']
export const PUSH_GROUPS: MuscleGroup[] = ['pecs', 'epaules', 'triceps']
export const PULL_GROUPS: MuscleGroup[] = ['dos', 'biceps']

/** Couleurs du module (voir ModuleColors dans core/module.ts). */
export const COLORS = { accent: '#ff7a45', solid: '#d9531f', text: '#ff9468' }
