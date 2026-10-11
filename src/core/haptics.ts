/** Vibrations courtes (Chrome Android) ; sans effet ailleurs et si « réduire les animations » est actif. */
const PATTERNS = {
  /** Case cochée, ajout, série validée. */
  tap: 12,
  /** Gain d'XP, récompense. */
  success: [14, 40, 22],
  /** Niveau gagné, boss vaincu. */
  level: [20, 60, 20, 60, 70],
} as const

export type Haptic = keyof typeof PATTERNS

export function haptic(kind: Haptic): void {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    navigator.vibrate(PATTERNS[kind] as number | number[])
  } catch {
    // Pas de vibration disponible : on ignore.
  }
}
