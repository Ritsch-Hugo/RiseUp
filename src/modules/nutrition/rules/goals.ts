import { DEFAULT_GOALS, KCAL_PER_G } from '../config'

export type GoalValues = typeof DEFAULT_GOALS

/** Objectif en vigueur un jour donné : la ligne au plus grand `effective_from` ≤ jour (AAAA-MM-JJ). */
export function goalForDay<T extends { effective_from: string }>(
  goals: T[],
  day: string
): T | null {
  let best: T | null = null
  for (const g of goals) {
    if (g.effective_from <= day && (!best || g.effective_from > best.effective_from)) best = g
  }
  return best
}

/** Calories apportées par les macros de l'objectif (P × 4 + G × 4 + L × 9). */
export function macroKcal(g: Pick<GoalValues, 'protein_g' | 'carbs_g' | 'fat_g'>): number {
  return g.protein_g * KCAL_PER_G.protein + g.carbs_g * KCAL_PER_G.carbs + g.fat_g * KCAL_PER_G.fat
}

/** Part de chaque macro en % des calories de l'objectif (arrondie). */
export function macroShares(g: GoalValues) {
  const pct = (kcal: number) => (g.kcal > 0 ? Math.round((kcal / g.kcal) * 100) : 0)
  return {
    protein: pct(g.protein_g * KCAL_PER_G.protein),
    carbs: pct(g.carbs_g * KCAL_PER_G.carbs),
    fat: pct(g.fat_g * KCAL_PER_G.fat),
  }
}

/** Phrase d'avertissement si les macros ne tombent pas pile sur les calories, sinon null. */
export function macroGapMessage(g: GoalValues): string | null {
  const total = macroKcal(g)
  const gap = g.kcal - total
  const n = (v: number) => Math.abs(v).toLocaleString('fr-FR')
  if (gap > 0) {
    return `Les macros font ${n(total)} kcal : ${n(gap)} kcal ne sont pas attribuées à ton objectif de ${n(g.kcal)}.`
  }
  if (gap < 0) {
    return `Les macros font ${n(total)} kcal : elles dépassent ton objectif de ${n(g.kcal)} de ${n(gap)} kcal.`
  }
  return null
}

export type GoalForm = {
  kcal: string
  protein: string
  carbs: string
  fat: string
  fiber: string
  salt: string
  /** En litres, comme affiché. */
  water: string
  slots: number
}

const toNumber = (s: string): number | null => {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) && n >= 0 ? n : null
}

const fmt = (n: number) => String(n).replace('.', ',')

export function goalToForm(g: GoalValues): GoalForm {
  return {
    kcal: String(g.kcal),
    protein: String(g.protein_g),
    carbs: String(g.carbs_g),
    fat: String(g.fat_g),
    fiber: String(g.fiber_g),
    salt: fmt(g.salt_g),
    water: fmt(g.water_ml / 1000),
    slots: g.min_slots_tracked,
  }
}

/** Valeurs prêtes à écrire, ou null si un champ est invalide (calories > 0, entiers pour les grammes). */
export function formToGoal(f: GoalForm): GoalValues | null {
  const kcal = toNumber(f.kcal)
  const protein = toNumber(f.protein)
  const carbs = toNumber(f.carbs)
  const fat = toNumber(f.fat)
  const fiber = toNumber(f.fiber)
  const salt = toNumber(f.salt)
  const water = toNumber(f.water)
  if ([kcal, protein, carbs, fat, fiber, salt, water].some((v) => v === null)) return null
  if (![kcal, protein, carbs, fat, fiber].every((v) => Number.isInteger(v))) return null
  if (kcal! <= 0) return null
  return {
    kcal: kcal!,
    protein_g: protein!,
    carbs_g: carbs!,
    fat_g: fat!,
    fiber_g: fiber!,
    salt_g: salt!,
    water_ml: Math.round(water! * 1000),
    min_slots_tracked: f.slots,
  }
}
