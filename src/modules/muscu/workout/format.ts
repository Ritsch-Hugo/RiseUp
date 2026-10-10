import type { Tracking } from '../config'
import { formatNumber, type PrevSet } from './rows'

/** Durée en secondes → « 42:18 » ou « 1:02:05 ». */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${String(m).padStart(2, '0')}:${ss}`
}

/** Colonne « PRÉC. » : « 85 × 8 », « 8 » ou « 45 s ». */
export function formatPrevious(prev: PrevSet | undefined, tracking: Tracking): string {
  if (!prev) return '–'
  if (tracking === 'duree') return prev.duration_seconds ? `${prev.duration_seconds} s` : '–'
  if (tracking === 'reps') return `${prev.reps}`
  return `${formatNumber(prev.weight_kg)} × ${prev.reps}`
}

/** Ligne « Dernière fois » : « 85 kg × 8 · 8 · 7 · 6 » (ou liste complète si les charges diffèrent). */
export function formatLastTime(sets: PrevSet[], tracking: Tracking): string {
  if (sets.length === 0) return ''
  if (tracking === 'duree') return sets.map((s) => `${s.duration_seconds ?? 0} s`).join(' · ')
  if (tracking === 'reps') return sets.map((s) => s.reps).join(' · ')
  const weights = new Set(sets.map((s) => s.weight_kg))
  if (weights.size === 1) {
    return `${formatNumber(sets[0]!.weight_kg)} kg × ${sets.map((s) => s.reps).join(' · ')}`
  }
  return sets.map((s) => `${formatNumber(s.weight_kg)} × ${s.reps}`).join(' · ')
}

/** Durée lisible : « 58 min », « 1 h 02 ». */
export function formatDuration(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
