/** « 6-8 » → { min: 6, max: 8 } ; « 10 » → { min: 10, max: 10 } ; invalide → null. */
export function parseRepsRange(text: string): { min: number; max: number } | null {
  const m = /^\s*(\d{1,3})\s*(?:[-–]\s*(\d{1,3}))?\s*$/.exec(text)
  if (!m) return null
  const min = Number(m[1])
  const max = m[2] === undefined ? min : Number(m[2])
  return min >= 1 && max >= min ? { min, max } : null
}

export function formatRepsRange(min: number | null, max: number | null): string {
  if (min === null || max === null) return ''
  return min === max ? `${min}` : `${min}-${max}`
}

/** « 4 × 6-8 », ou « 3 séries » quand il n'y a pas de répétitions cibles. */
export function formatTarget(sets: number | null, min: number | null, max: number | null): string {
  const reps = formatRepsRange(min, max)
  if (sets === null) return reps
  return reps ? `${sets} × ${reps}` : `${sets} série${sets > 1 ? 's' : ''}`
}

/** Échange l'élément `index` avec son voisin (dir = -1 vers le haut, +1 vers le bas) ; no-op aux bords. */
export function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target]!, copy[index]!]
  return copy
}

/** Prochaine position libre (max + 1, ou 0 si la liste est vide). */
export const nextPosition = (items: { position: number }[]) =>
  items.reduce((max, i) => Math.max(max, i.position), -1) + 1
