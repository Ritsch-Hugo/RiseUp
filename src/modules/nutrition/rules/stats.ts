import { addDays } from '../../../core/dates'
import { KCAL_PER_G } from '../config'

/** Ligne de la vue nutri_day_totals (nombres déjà convertis). */
export type DayTotals = {
  day: string
  slots_tracked: number
  kcal: number
  protein: number
  carbs: number
  sugars: number
  fat: number
  saturated_fat: number
  fiber: number
  salt: number
}

/** Jours suivis : au moins `minSlots(day)` créneaux avec une entrée, `minSlots` étant celui de l'objectif de l'époque. */
export function trackedSet(days: DayTotals[], minSlots: (day: string) => number): Set<string> {
  return new Set(days.filter((d) => d.slots_tracked >= minSlots(d.day)).map((d) => d.day))
}

export { bestStreak, currentStreak } from '../../../core/streak'

/** Les `n` jours qui finissent à `today` inclus, du plus ancien au plus récent. */
export const windowDays = (today: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)))

export type Averages = {
  /** Nombre de jours suivis sur lesquels la moyenne est calculée. */
  count: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugars: number
  salt: number
}

/**
 * Moyennes par jour sur les jours suivis de `days` (aujourd'hui exclu : sa saisie n'est pas terminée).
 * null sans jour suivi.
 */
export function averages(
  totals: DayTotals[],
  tracked: Set<string>,
  days: string[],
  today: string
): Averages | null {
  const byDay = new Map(totals.map((d) => [d.day, d]))
  const rows = days.filter((d) => d !== today && tracked.has(d)).map((d) => byDay.get(d)!)
  if (rows.length === 0) return null
  const mean = (key: keyof DayTotals) =>
    rows.reduce((t, r) => t + (r[key] as number), 0) / rows.length
  return {
    count: rows.length,
    kcal: mean('kcal'),
    protein: mean('protein'),
    carbs: mean('carbs'),
    fat: mean('fat'),
    fiber: mean('fiber'),
    sugars: mean('sugars'),
    salt: mean('salt'),
  }
}

/** Jours suivis (hors aujourd'hui) dont les calories sont à ± `tolerance` de l'objectif de ce jour. */
export function daysInTarget(
  totals: DayTotals[],
  tracked: Set<string>,
  days: string[],
  today: string,
  kcalGoal: (day: string) => number,
  tolerance: number
): number {
  const byDay = new Map(totals.map((d) => [d.day, d]))
  return days.filter((d) => {
    if (d === today || !tracked.has(d)) return false
    const goal = kcalGoal(d)
    const kcal = byDay.get(d)!.kcal
    return goal > 0 && Math.abs(kcal - goal) <= goal * tolerance
  }).length
}

/** Répartition des calories entre macros en % (P × 4, G × 4, L × 9), total ajusté à 100 ; null si tout est à 0. */
export function calorieShares(a: Pick<Averages, 'protein' | 'carbs' | 'fat'>) {
  const parts = [a.protein * KCAL_PER_G.protein, a.carbs * KCAL_PER_G.carbs, a.fat * KCAL_PER_G.fat]
  const sum = parts.reduce((t, p) => t + p, 0)
  if (sum <= 0) return null
  const raw = parts.map((p) => (p / sum) * 100)
  const floored = raw.map(Math.floor)
  let missing = 100 - floored.reduce((t, v) => t + v, 0)
  const order = raw.map((r, i) => ({ i, rest: r - floored[i]! })).sort((x, y) => y.rest - x.rest)
  for (const { i } of order) {
    if (missing <= 0) break
    floored[i]! += 1
    missing -= 1
  }
  return { protein: floored[0]!, carbs: floored[1]!, fat: floored[2]! }
}

/** Cases d'un mois (AAAA-MM-JJ du 1er) en semaines lundi → dimanche ; null = case vide. */
export function monthDays(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= count; d++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
