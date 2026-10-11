import { describe, expect, it } from 'vitest'
import {
  daysReached,
  formatWater,
  parseMl,
  timeLabel,
  totalMl,
  waterStatus,
  weekdayLetter,
  weekTotals,
} from './water'

describe('formatWater', () => {
  it('litres au-dessus de 1 L, mL en dessous', () => {
    expect(formatWater(1500)).toBe('1,5 L')
    expect(formatWater(1000)).toBe('1 L')
    expect(formatWater(2500)).toBe('2,5 L')
    expect(formatWater(750)).toBe('750 mL')
    expect(formatWater(0)).toBe('0 mL')
  })
})

describe('waterStatus', () => {
  it('reste à boire / atteint', () => {
    expect(waterStatus(1500, 2500)).toBe('Encore 1 L pour atteindre ton objectif')
    expect(waterStatus(2500, 2500)).toBe('Objectif atteint')
    expect(waterStatus(3000, 2500)).toBe('Objectif atteint')
  })
})

describe('totalMl', () => {
  it('somme', () => expect(totalMl([{ amount_ml: 250 }, { amount_ml: 500 }])).toBe(750))
})

describe('weekTotals', () => {
  const rows = [
    { day: '2026-10-06', amount_ml: 500 },
    { day: '2026-10-06', amount_ml: 250 },
    { day: '2026-10-03', amount_ml: 2600 },
    { day: '2026-09-01', amount_ml: 999 },
  ]
  const t = weekTotals(rows, '2026-10-06', 7)
  it('7 jours, le dernier = endDay, hors période ignoré', () => {
    expect(t).toHaveLength(7)
    expect(t[0]!.day).toBe('2026-09-30')
    expect(t[6]).toEqual({ day: '2026-10-06', ml: 750 })
    expect(t.reduce((s, d) => s + d.ml, 0)).toBe(3350)
  })
  it('jours où l’objectif est atteint', () => {
    expect(daysReached(t, 2500)).toBe(1)
    expect(daysReached(t, 0)).toBe(0)
  })
})

describe('weekdayLetter', () => {
  it('lettre du jour', () => {
    expect(weekdayLetter('2026-10-05')).toBe('L')
    expect(weekdayLetter('2026-10-11')).toBe('D')
  })
})

describe('parseMl', () => {
  it('entier positif seulement', () => {
    expect(parseMl(' 330 ')).toBe(330)
    expect(parseMl('0')).toBeNull()
    expect(parseMl('-5')).toBeNull()
    expect(parseMl('12,5')).toBeNull()
    expect(parseMl('')).toBeNull()
    expect(parseMl('abc')).toBeNull()
  })
})

describe('timeLabel', () => {
  it('heure de Paris', () => expect(timeLabel('2026-10-06T14:20:00Z')).toBe('16:20'))
})
