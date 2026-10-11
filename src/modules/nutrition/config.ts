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
