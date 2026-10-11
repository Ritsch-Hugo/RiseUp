import { addDays } from './dates'

/**
 * Série en cours : jours consécutifs de `days` jusqu'à aujourd'hui.
 * Aujourd'hui ne casse pas la série tant qu'il n'est pas dans `days` (on part alors d'hier).
 */
export function currentStreak(days: Set<string>, today: string): number {
  let day = days.has(today) ? today : addDays(today, -1)
  let n = 0
  while (days.has(day)) {
    n += 1
    day = addDays(day, -1)
  }
  return n
}

/** Plus longue série de jours consécutifs de `days`. */
export function bestStreak(days: Set<string>): number {
  const sorted = [...days].sort()
  let best = 0
  let run = 0
  let previous: string | null = null
  for (const day of sorted) {
    run = previous !== null && addDays(previous, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  return best
}
