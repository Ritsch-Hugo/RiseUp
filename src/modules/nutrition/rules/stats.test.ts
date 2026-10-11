import { describe, expect, it } from 'vitest'
import {
  averages,
  bestStreak,
  calorieShares,
  currentStreak,
  daysInTarget,
  monthDays,
  trackedSet,
  windowDays,
  type DayTotals,
} from './stats'

const day = (d: string, slots: number, kcal = 2000, extra: Partial<DayTotals> = {}): DayTotals => ({
  day: d,
  slots_tracked: slots,
  kcal,
  protein: 100,
  carbs: 200,
  sugars: 40,
  fat: 60,
  saturated_fat: 15,
  fiber: 20,
  salt: 4,
  ...extra,
})

describe('trackedSet', () => {
  it('au moins N créneaux, N selon l’objectif du jour', () => {
    const t = trackedSet([day('2026-10-01', 1), day('2026-10-02', 2), day('2026-10-03', 3)], (d) =>
      d === '2026-10-01' ? 1 : 2
    )
    expect([...t].sort()).toEqual(['2026-10-01', '2026-10-02', '2026-10-03'])
    const strict = trackedSet([day('2026-10-01', 1)], () => 2)
    expect(strict.size).toBe(0)
  })
})

describe('currentStreak', () => {
  const tracked = new Set(['2026-10-07', '2026-10-08', '2026-10-09', '2026-10-05'])
  it('aujourd’hui non suivi ne casse pas la série', () => {
    expect(currentStreak(tracked, '2026-10-10')).toBe(3)
  })
  it('aujourd’hui suivi compte', () => {
    expect(currentStreak(new Set([...tracked, '2026-10-10']), '2026-10-10')).toBe(4)
  })
  it('un jour manqué avant hier casse', () => {
    expect(currentStreak(tracked, '2026-10-11')).toBe(0)
  })
  it('0 sans historique', () => expect(currentStreak(new Set(), '2026-10-10')).toBe(0))
})

describe('bestStreak', () => {
  it('plus longue série, y compris à cheval sur un mois', () => {
    const t = new Set([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-05',
      '2026-10-06',
    ])
    expect(bestStreak(t)).toBe(4)
  })
  it('0 sans jour suivi', () => expect(bestStreak(new Set())).toBe(0))
})

describe('windowDays', () => {
  it('n jours finissant à aujourd’hui', () => {
    const w = windowDays('2026-10-10', 7)
    expect(w).toHaveLength(7)
    expect(w[0]).toBe('2026-10-04')
    expect(w[6]).toBe('2026-10-10')
  })
})

describe('averages', () => {
  const totals = [
    day('2026-10-08', 2, 2000),
    day('2026-10-09', 2, 2400),
    day('2026-10-10', 2, 500), // aujourd'hui : exclu
    day('2026-10-07', 1, 100), // non suivi : exclu
  ]
  const tracked = new Set(['2026-10-08', '2026-10-09', '2026-10-10'])
  const days = windowDays('2026-10-10', 7)
  it('moyenne sur les jours suivis, aujourd’hui exclu', () => {
    const a = averages(totals, tracked, days, '2026-10-10')!
    expect(a.count).toBe(2)
    expect(a.kcal).toBe(2200)
    expect(a.protein).toBe(100)
  })
  it('null sans jour suivi', () => {
    expect(averages(totals, new Set(), days, '2026-10-10')).toBeNull()
  })
})

describe('daysInTarget', () => {
  it('±10 % de l’objectif, jours suivis hors aujourd’hui', () => {
    const totals = [
      day('2026-10-07', 2, 2300),
      day('2026-10-08', 2, 2000),
      day('2026-10-09', 2, 2640),
      day('2026-10-10', 2, 2400),
    ]
    const tracked = new Set(totals.map((d) => d.day))
    const n = daysInTarget(
      totals,
      tracked,
      windowDays('2026-10-10', 7),
      '2026-10-10',
      () => 2400,
      0.1
    )
    expect(n).toBe(2) // 2300 et 2640 (limite incluse) ; 2000 est en dessous
  })
})

describe('calorieShares', () => {
  it('somme toujours 100', () => {
    const s = calorieShares({ protein: 160, carbs: 260, fat: 70 })!
    expect(s).toEqual({ protein: 28, carbs: 45, fat: 27 })
    expect(s.protein + s.carbs + s.fat).toBe(100)
  })
  it('null si tout est à 0', () => {
    expect(calorieShares({ protein: 0, carbs: 0, fat: 0 })).toBeNull()
  })
})

describe('monthDays', () => {
  it('octobre 2026 : 3 cases vides puis 31 jours, multiple de 7', () => {
    const cells = monthDays('2026-10-01')
    expect(cells.slice(0, 3)).toEqual([null, null, null])
    expect(cells[3]).toBe('2026-10-01')
    expect(cells.filter(Boolean)).toHaveLength(31)
    expect(cells.length % 7).toBe(0)
  })
})
