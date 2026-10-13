import { parisDay } from '../../core'
import type { ModuleSummary } from '../../core/module'
import { useEntries } from './journal/journalQueries'
import { useCurrentGoals } from './goals/goalsQueries'
import { formatAmount } from './rules/food'
import { sumNutrition } from './rules/journal'
import { useWater } from './water/waterQueries'

const liters = (ml: number) => (ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })

/** Résumé de l'accueil : calories restantes et eau du jour. */
export function useSummary(): ModuleSummary | null {
  const today = parisDay()
  const { data: entries } = useEntries(today)
  const { data: goals } = useCurrentGoals()
  const { data: water } = useWater(today)
  if (!entries || !goals || !water) return null

  const kcal = Math.round(sumNutrition(entries).kcal)
  const left = goals.kcal - kcal
  const waterMl = water.reduce((t, w) => t + w.amount_ml, 0)
  const stat =
    left >= 0
      ? { value: formatAmount(left, 0), unit: 'kcal restantes' }
      : { value: formatAmount(-left, 0), unit: 'kcal en trop' }
  return {
    text: `Eau ${liters(waterMl)} / ${liters(goals.water_ml)} L`,
    stat,
    active: entries.length === 0,
    progress: goals.kcal > 0 ? Math.min(1, Math.max(0, kcal / goals.kcal)) : 0,
  }
}
