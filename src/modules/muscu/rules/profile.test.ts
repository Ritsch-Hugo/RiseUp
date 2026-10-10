import { describe, expect, it } from 'vitest'
import { monthGrid, trendPercent, weeklySeries, weeklyStreak } from './profile'

describe('weeklySeries', () => {
  it('13 semaines, la semaine courante en dernier', () => {
    const s = weeklySeries(
      [
        { startedAt: '2026-10-06T10:00:00Z', durationSeconds: 3600, volume: 1000 },
        { startedAt: '2026-09-29T10:00:00Z', durationSeconds: 1800, volume: 500 },
        { startedAt: '2025-01-01T10:00:00Z', durationSeconds: 1, volume: 1 },
      ],
      '2026-10-10',
      13
    )
    expect(s).toHaveLength(13)
    expect(s[12]).toMatchObject({ weekStart: '2026-10-05', count: 1, volume: 1000 })
    expect(s[11]).toMatchObject({ weekStart: '2026-09-28', count: 1, volume: 500 })
    expect(s.reduce((t, p) => t + p.count, 0)).toBe(2)
  })
})

describe('trendPercent', () => {
  it('+12 %', () => expect(trendPercent(112, 100)).toBe(12))
  it('null sans période précédente', () => expect(trendPercent(5, 0)).toBeNull())
})

describe('weeklyStreak', () => {
  it('la semaine en cours incomplète ne casse pas', () => {
    expect(weeklyStreak([3, 4, 3, 1], 3)).toBe(3)
  })
  it('la semaine en cours complète compte', () => {
    expect(weeklyStreak([3, 4, 3, 3], 3)).toBe(4)
  })
  it('une semaine passée incomplète casse', () => {
    expect(weeklyStreak([3, 2, 3, 3], 3)).toBe(2)
  })
  it('0 sans historique', () => expect(weeklyStreak([0, 0], 3)).toBe(0))
})

describe('monthGrid', () => {
  it('octobre 2026 commence un jeudi (3 cases vides)', () => {
    const g = monthGrid('2026-10-10', new Set(['2026-10-01']))
    expect(g.slice(0, 3)).toEqual([null, null, null])
    expect(g[3]).toMatchObject({ label: '1', trained: true })
    expect(g.length % 7).toBe(0)
    expect(g.find((c) => c?.today)?.label).toBe('10')
  })
})
