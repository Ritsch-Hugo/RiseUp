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
