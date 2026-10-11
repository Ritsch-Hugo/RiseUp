/** Énergie par gramme de macro (kcal). */
export const KCAL_PER_G = { protein: 4, carbs: 4, fat: 9 } as const

/** Objectifs : pas des boutons − / + des calories. */
export const GOAL_KCAL_STEP = 50
export const GOAL_SLOT_OPTIONS = [1, 2, 3] as const

/** Objectifs par défaut tant que Hugo n'en a pas enregistré (identiques aux défauts de la table nutri_goals). */
export const DEFAULT_GOALS = {
  kcal: 2400,
  protein_g: 160,
  carbs_g: 260,
  fat_g: 70,
  fiber_g: 30,
  salt_g: 5,
  water_ml: 2500,
  min_slots_tracked: 2,
}

/** Fiche aliment : quantité par défaut et pas des boutons − / + (grammes, portions). */
export const DEFAULT_QUANTITY_G = 100
export const QUANTITY_STEP_G = 10
export const PORTION_STEP = 0.5

/** Créneaux du journal, dans l'ordre d'affichage (libellé court pour les pastilles). */
export const MEAL_SLOTS = [
  { key: 'petit_dej', label: 'Petit-déjeuner', short: 'Petit-déj' },
  { key: 'dejeuner', label: 'Déjeuner', short: 'Déjeuner' },
  { key: 'diner', label: 'Dîner', short: 'Dîner' },
  { key: 'collation', label: 'Collations', short: 'Collation' },
] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]['key']

/** Créneau proposé selon l'heure (Paris) : avant ces heures → petit-déj, déjeuner, collation ; ensuite dîner. */
export const SLOT_SUGGESTION_HOURS = { petit_dej: 11, dejeuner: 15, collation: 18 }
