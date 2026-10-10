import { describe, expect, it } from 'vitest'
import { formatClock, formatLastTime, formatPrevious } from './format'

const set = (weight_kg: number, reps: number) => ({
  weight_kg,
  reps,
  duration_seconds: null,
  is_warmup: false,
})

describe('formatClock', () => {
  it('mm:ss puis h:mm:ss', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(2538)).toBe('42:18')
    expect(formatClock(3725)).toBe('1:02:05')
    expect(formatClock(-5)).toBe('00:00')
  })
})

describe('formatLastTime', () => {
  it('même charge', () => {
    expect(formatLastTime([set(85, 8), set(85, 8), set(85, 7)], 'poids_reps')).toBe(
      '85 kg × 8 · 8 · 7'
    )
  })
  it('charges différentes', () => {
    expect(formatLastTime([set(85, 8), set(87.5, 6)], 'poids_reps')).toBe('85 × 8 · 87,5 × 6')
  })
  it('reps seules, durée, vide', () => {
    expect(formatLastTime([set(0, 12), set(0, 10)], 'reps')).toBe('12 · 10')
    expect(formatLastTime([{ ...set(0, 0), duration_seconds: 45 }], 'duree')).toBe('45 s')
    expect(formatLastTime([], 'poids_reps')).toBe('')
  })
})

describe('formatPrevious', () => {
  it('sans donnée', () => {
    expect(formatPrevious(undefined, 'poids_reps')).toBe('–')
  })
  it('selon le suivi', () => {
    expect(formatPrevious(set(85, 8), 'poids_reps')).toBe('85 × 8')
    expect(formatPrevious(set(0, 8), 'reps')).toBe('8')
  })
})
