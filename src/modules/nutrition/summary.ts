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
  const kcalText =
    left >= 0
      ? `${formatAmount(left, 0)} kcal restantes`
      : `${formatAmount(-left, 0)} kcal au-dessus de l’objectif`
  return {
    text: `${kcalText} · eau ${liters(waterMl)} / ${liters(goals.water_ml)} L`,
    active: entries.length === 0,
    progress: goals.kcal > 0 ? Math.min(1, Math.max(0, kcal / goals.kcal)) : 0,
  }
}
