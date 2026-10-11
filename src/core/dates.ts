/** Jour calendaire (heure de Paris) d'un instant, au format AAAA-MM-JJ. */
export function parisDay(date: Date | string = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}
