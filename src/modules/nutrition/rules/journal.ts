import { SLOT_SUGGESTION_HOURS, type MealSlot } from '../config'
import type { Nutrition } from './food'

const round2 = (n: number) => Math.round(n * 100) / 100

const ZERO: Nutrition = {
  kcal: 0,
  protein: 0,
  carbs: 0,
  sugars: 0,
  fat: 0,
  saturated_fat: 0,
  fiber: 0,
  salt: 0,
}

/** Somme des valeurs (copiées dans les entrées) d'une liste d'entrées. */
export function sumNutrition(entries: Nutrition[]): Nutrition {
  const total = { ...ZERO }
  for (const e of entries) {
    for (const k of Object.keys(total) as (keyof Nutrition)[]) total[k] += e[k]
  }
  for (const k of Object.keys(total) as (keyof Nutrition)[]) total[k] = round2(total[k])
  return total
}

/** Part de l'objectif atteinte, bornée à [0, 1] pour l'anneau (0 sans objectif). */
export function ringFraction(value: number, goal: number): number {
  if (goal <= 0) return 0
  return Math.min(1, Math.max(0, value / goal))
}

/** Change la quantité d'une entrée en gardant ses valeurs d'origine (proportionnelles). */
export function rescaleEntry(
  entry: Nutrition & { quantity_g: number },
  quantityG: number
): Nutrition & { quantity_g: number } {
  const k = entry.quantity_g > 0 ? quantityG / entry.quantity_g : 0
  const out = { quantity_g: quantityG } as Nutrition & { quantity_g: number }
  for (const key of Object.keys(ZERO) as (keyof Nutrition)[]) out[key] = round2(entry[key] * k)
  return out
}

/** Créneau proposé à une heure donnée (0-23). */
export function suggestSlot(hour: number): MealSlot {
  if (hour < SLOT_SUGGESTION_HOURS.petit_dej) return 'petit_dej'
  if (hour < SLOT_SUGGESTION_HOURS.dejeuner) return 'dejeuner'
  if (hour < SLOT_SUGGESTION_HOURS.collation) return 'collation'
  return 'diner'
}

/** « Aujourd'hui · mar. 6 oct. », « Hier · … » ou « lun. 5 oct. ». */
export function dayLabel(day: string, today: string, yesterday: string): string {
  const date = new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
  if (day === today) return `Aujourd’hui · ${date}`
  if (day === yesterday) return `Hier · ${date}`
  return date
}

export const isDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
