import { addDays } from '../../../core/dates'

/** Volume en litres lisible : 1500 → « 1,5 L », 1000 → « 1 L », 750 → « 750 mL ». */
export function formatWater(ml: number): string {
  if (ml < 1000) return `${Math.round(ml)} mL`
  return `${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`
}

export const totalMl = (rows: { amount_ml: number }[]): number =>
  rows.reduce((t, r) => t + r.amount_ml, 0)

/** Phrase sous l'anneau. */
export function waterStatus(drunk: number, goal: number): string {
  if (goal <= 0) return ''
  if (drunk >= goal) return 'Objectif atteint'
  return `Encore ${formatWater(goal - drunk)} pour atteindre ton objectif`
}

export type WaterDay = { day: string; ml: number }

/** Total par jour sur les `days` derniers jours, `endDay` en dernier. */
export function weekTotals(
  rows: { day: string; amount_ml: number }[],
  endDay: string,
  days: number
): WaterDay[] {
  const out: WaterDay[] = Array.from({ length: days }, (_, i) => ({
    day: addDays(endDay, -(days - 1 - i)),
    ml: 0,
  }))
  for (const r of rows) {
    const d = out.find((x) => x.day === r.day)
    if (d) d.ml += r.amount_ml
  }
  return out
}

export const daysReached = (totals: WaterDay[], goal: number): number =>
  goal > 0 ? totals.filter((d) => d.ml >= goal).length : 0

/** Lettre du jour de la semaine (L M M J V S D) pour un jour AAAA-MM-JJ. */
export function weekdayLetter(day: string): string {
  return 'DLMMJVS'[new Date(`${day}T12:00:00Z`).getUTCDay()]!
}

/** Quantité en mL saisie à la main : entier > 0, sinon null. */
export function parseMl(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'))
  return Number.isFinite(n) && n > 0 && Number.isInteger(n) ? n : null
}

/** Heure (Paris) « 16:20 » d'un instant. */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  })
}
