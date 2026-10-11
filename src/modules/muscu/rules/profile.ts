import { addDays, parisDay, weekStart, type WeekWorkout } from './week'

export type WeekPoint = {
  weekStart: string
  count: number
  durationSeconds: number
  volume: number
}

/** Totaux par semaine sur les `weeks` dernières semaines (la semaine de `today` en dernier). */
export function weeklySeries(workouts: WeekWorkout[], today: string, weeks: number): WeekPoint[] {
  const current = weekStart(today)
  const points: WeekPoint[] = Array.from({ length: weeks }, (_, i) => ({
    weekStart: addDays(current, -7 * (weeks - 1 - i)),
    count: 0,
    durationSeconds: 0,
    volume: 0,
  }))
  const byStart = new Map(points.map((p) => [p.weekStart, p]))
  for (const w of workouts) {
    const p = byStart.get(weekStart(parisDay(w.startedAt)))
    if (!p) continue
    p.count += 1
    p.durationSeconds += w.durationSeconds
    p.volume += w.volume
  }
  return points
}

/** Évolution en % entre deux périodes ; null si la période précédente est vide. */
export function trendPercent(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Streak : semaines consécutives avec au moins `goal` séances.
 * La semaine en cours ne casse pas le streak (elle compte si l'objectif y est déjà atteint).
 */
export function weeklyStreak(counts: number[], goal: number): number {
  // counts : du plus ancien au plus récent, la dernière valeur = semaine en cours.
  let streak = 0
  for (let i = counts.length - 1; i >= 0; i--) {
    if (counts[i]! >= goal) streak += 1
    else if (i !== counts.length - 1) break
  }
  return streak
}

export type CalendarCell = { day: string; label: string; trained: boolean; today: boolean } | null

/** Premier jour du mois décalé de `n` mois (négatif = passé). */
export function shiftMonth(day: string, n: number): string {
  const [y, m] = day.split('-').map(Number) as [number, number]
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

/** Grille du mois de `month` (semaine commençant le lundi), cases vides = null ; `today` marque aujourd'hui. */
export function monthGrid(month: string, trainedDays: Set<string>, today = month): CalendarCell[] {
  const [y, m] = month.split('-').map(Number) as [number, number]
  const first = `${y}-${String(m).padStart(2, '0')}-01`
  const lead = (new Date(`${first}T00:00:00Z`).getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const cells: CalendarCell[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= daysInMonth; d++) {
    const day = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day, label: String(d), trained: trainedDays.has(day), today: day === today })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
