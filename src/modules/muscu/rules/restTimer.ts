/** Secondes restantes avant `endsAt` (arrondi au supérieur, jamais négatif). */
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

/** Décale la fin du repos de `deltaSeconds` ; ne peut pas passer avant « maintenant ». */
export function adjustRest(endsAt: number, deltaSeconds: number, now: number): number {
  return Math.max(now, endsAt + deltaSeconds * 1000)
}

/** Avancement de la barre (0 → 1) pour un repos de `totalSeconds`. */
export function restProgress(endsAt: number, totalSeconds: number, now: number): number {
  if (totalSeconds <= 0) return 1
  return Math.min(1, Math.max(0, 1 - remainingSeconds(endsAt, now) / totalSeconds))
}

/** Secondes écoulées depuis `startedAt` (chrono). */
export const elapsedSeconds = (startedAt: number, now: number) =>
  Math.max(0, Math.floor((now - startedAt) / 1000))
