import { formatAmount, nutritionFor, type FoodValues, type Nutrition } from './food'
import { sumNutrition } from './journal'
import type { MealSlot } from '../config'

export type MealItemLike = { quantity_g: number; food: FoodValues }

/** Totaux d'un repas enregistré : somme de ses aliments pour leurs quantités. */
export function mealTotals(items: MealItemLike[]): Nutrition {
  return sumNutrition(items.map((i) => nutritionFor(i.food, i.quantity_g)))
}

/** « 559 kcal · P 56 · G 66 · L 7 » */
export function mealSummary(n: Nutrition): string {
  return `${formatAmount(n.kcal, 0)} kcal · P ${formatAmount(n.protein, 0)} · G ${formatAmount(n.carbs, 0)} · L ${formatAmount(n.fat, 0)}`
}

/** Quantité proposée à l'ajout d'un aliment : sa portion si elle existe, sinon 100 g. */
export const defaultQuantity = (food: { serving_g: number | null }): number => food.serving_g ?? 100

/** Quantité saisie : nombre > 0 (virgule acceptée), sinon null. */
export function parseQuantity(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

/** Aliments utilisés récemment, du plus récent au plus ancien, sans doublon. */
export function recentFoodIds(
  entries: { food_id: string; created_at: string }[],
  limit: number
): string[] {
  const sorted = [...entries].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return [...new Set(sorted.map((e) => e.food_id))].slice(0, limit)
}

/**
 * Créneau où ajouter un repas : le créneau choisi dans le journal s'il y en a un, sinon le créneau
 * habituel du repas, sinon celui proposé selon l'heure.
 */
export function slotForMeal(
  defaultSlot: MealSlot | null,
  contextSlot: MealSlot,
  fromJournal: boolean
): MealSlot {
  if (fromJournal) return contextSlot
  return defaultSlot ?? contextSlot
}
