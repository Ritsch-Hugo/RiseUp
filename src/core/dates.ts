/** Jour calendaire (heure de Paris) d'un instant, au format AAAA-MM-JJ. */
export function parisDay(date: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

/** Jour AAAA-MM-JJ décalé de `n` jours (calendrier, indépendant du fuseau). */
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Minutes écoulées depuis minuit, heure de Paris. */
export function parisMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('fr-FR', {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
    timeZone: 'Europe/Paris',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  return get('hour') * 60 + get('minute')
}
