const DAY_MS = 24 * 3600 * 1000

/** Jour calendaire (heure de Paris) d'un instant, au format AAAA-MM-JJ. */
export function parisDay(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

const toUtc = (day: string) => new Date(`${day}T00:00:00Z`).getTime()
const fromUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10)

/** Lundi de la semaine d'un jour AAAA-MM-JJ (semaine lundi → dimanche). */
export function weekStart(day: string): string {
  const offset = (new Date(toUtc(day)).getUTCDay() + 6) % 7
  return fromUtc(toUtc(day) - offset * DAY_MS)
}

export function addDays(day: string, n: number): string {
  return fromUtc(toUtc(day) + n * DAY_MS)
}

export type WeekWorkout = { startedAt: string; durationSeconds: number; volume: number }

/** Totaux des séances comptées dont le jour (Paris) tombe dans la semaine de `weekDay`. */
export function weekStats(workouts: WeekWorkout[], weekDay: string) {
  const start = weekStart(weekDay)
  const inWeek = workouts.filter((w) => weekStart(parisDay(w.startedAt)) === start)
  return {
    count: inWeek.length,
    durationSeconds: inWeek.reduce((t, w) => t + w.durationSeconds, 0),
    volume: inWeek.reduce((t, w) => t + w.volume, 0),
  }
}
